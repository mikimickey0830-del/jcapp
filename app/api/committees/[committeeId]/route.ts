import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { CommitteeMemberRole, CommitteeMutationPayload } from "@/types/committee";

function uniqueMemberIds(body: CommitteeMutationPayload) {
  return [
    body.vicePresidentMemberId,
    body.chairMemberId,
    body.viceChairMemberId,
    ...(body.memberIds ?? [])
  ].filter((memberId): memberId is string => Boolean(memberId));
}

function roleForMember(memberId: string, body: CommitteeMutationPayload): CommitteeMemberRole {
  if (memberId === body.chairMemberId) {
    return "chair";
  }

  if (memberId === body.viceChairMemberId) {
    return "vice_chair";
  }

  return "member";
}

function validateCommitteeInput(body: CommitteeMutationPayload) {
  if (!body.name?.trim()) {
    return "委員会名を入力してください。";
  }

  return null;
}

async function syncCommitteeMemberships(committeeId: string, fiscalYearId: string, body: CommitteeMutationPayload) {
  const client = supabase;

  if (!client) {
    return;
  }

  const selectedMemberIds = Array.from(new Set(uniqueMemberIds(body)));

  const { data: committee, error: committeeError } = await client
    .from("committees")
    .select("lom_id")
    .eq("id", committeeId)
    .single();

  if (committeeError || !committee) {
    throw new Error("委員会情報を取得できませんでした。");
  }

  const { data: existingRows, error: existingError } = await client
    .from("committee_memberships")
    .select("id, member_id")
    .eq("fiscal_year_id", fiscalYearId)
    .eq("committee_id", committeeId)
    .is("deleted_at", null);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const removedRows = ((existingRows ?? []) as Array<{ id: string; member_id: string }>).filter(
    (row) => !selectedMemberIds.includes(row.member_id)
  );

  if (removedRows.length > 0) {
    const { error: removeError } = await client
      .from("committee_memberships")
      .update({ deleted_at: new Date().toISOString() })
      .in(
        "id",
        removedRows.map((row) => row.id)
      );

    if (removeError) {
      throw new Error(removeError.message);
    }
  }

  if (selectedMemberIds.length === 0) {
    return;
  }

  const { error: upsertError } = await client.from("committee_memberships").upsert(
    selectedMemberIds.map((memberId) => ({
      lom_id: committee.lom_id,
      fiscal_year_id: fiscalYearId,
      member_id: memberId,
      committee_id: committeeId,
      role_in_committee: roleForMember(memberId, body),
      is_primary: memberId === body.chairMemberId,
      note: "",
      deleted_at: null,
      updated_at: new Date().toISOString()
    })),
    { onConflict: "fiscal_year_id,member_id,committee_id" }
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }
}

export async function PATCH(request: Request, { params }: { params: { committeeId: string } }) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  const body = (await request.json()) as CommitteeMutationPayload;
  const validationError = validateCommitteeInput(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data: committee, error: committeeFetchError } = await supabase
    .from("committees")
    .select("fiscal_year_id")
    .eq("id", params.committeeId)
    .single();

  if (committeeFetchError || !committee) {
    return NextResponse.json({ error: "委員会情報を取得できませんでした。" }, { status: 404 });
  }

  const fiscalYearId = body.fiscalYearId ?? committee.fiscal_year_id;

  const { error } = await supabase
    .from("committees")
    .update({
      fiscal_year_id: fiscalYearId,
      name: body.name?.trim(),
      description: body.description?.trim() ?? "",
      vice_president_member_id: body.vicePresidentMemberId || null,
      chair_member_id: body.chairMemberId || null,
      vice_chair_member_id: body.viceChairMemberId || null
    })
    .eq("id", params.committeeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await syncCommitteeMemberships(params.committeeId, fiscalYearId, body);
  } catch (syncError) {
    return NextResponse.json(
      { error: syncError instanceof Error ? syncError.message : "委員会所属の保存に失敗しました。" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: params.committeeId });
}

export async function DELETE(_request: Request, { params }: { params: { committeeId: string } }) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  const deletedAt = new Date().toISOString();
  const [committeeResult, membershipResult] = await Promise.all([
    supabase.from("committees").update({ deleted_at: deletedAt }).eq("id", params.committeeId),
    supabase.from("committee_memberships").update({ deleted_at: deletedAt }).eq("committee_id", params.committeeId)
  ]);

  const error = committeeResult.error ?? membershipResult.error;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: params.committeeId });
}
