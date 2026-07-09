import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { CommitteeMutationPayload } from "@/types/committee";
import type { AnnualRole } from "@/types/common";

function uniqueMemberIds(body: CommitteeMutationPayload) {
  return [
    body.vicePresidentMemberId,
    body.chairMemberId,
    body.viceChairMemberId,
    ...(body.memberIds ?? [])
  ].filter((memberId): memberId is string => Boolean(memberId));
}

function roleForMember(memberId: string, body: CommitteeMutationPayload): AnnualRole {
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

async function syncAssignments(committeeId: string, fiscalYearId: string, body: CommitteeMutationPayload) {
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
    .from("annual_member_assignments")
    .select("member_id")
    .eq("fiscal_year_id", fiscalYearId)
    .eq("committee_id", committeeId);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const removedMemberIds = ((existingRows ?? []) as Array<{ member_id: string }>)
    .map((row) => row.member_id)
    .filter((memberId) => !selectedMemberIds.includes(memberId));

  await Promise.all(
    removedMemberIds.map((memberId) =>
      client
        .from("annual_member_assignments")
        .update({ committee_id: null, role: "member" })
        .eq("fiscal_year_id", fiscalYearId)
        .eq("member_id", memberId)
    )
  );

  if (selectedMemberIds.length === 0) {
    return;
  }

  const { error: upsertError } = await client.from("annual_member_assignments").upsert(
    selectedMemberIds.map((memberId) => ({
      lom_id: committee.lom_id,
      fiscal_year_id: fiscalYearId,
      member_id: memberId,
      committee_id: committeeId,
      role: roleForMember(memberId, body),
      is_board_member: memberId === body.chairMemberId
    })),
    { onConflict: "fiscal_year_id,member_id" }
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
    await syncAssignments(params.committeeId, fiscalYearId, body);
  } catch (syncError) {
    return NextResponse.json(
      { error: syncError instanceof Error ? syncError.message : "委員の紐付けに失敗しました。" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: params.committeeId });
}

export async function DELETE(_request: Request, { params }: { params: { committeeId: string } }) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  const { error } = await supabase
    .from("committees")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.committeeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: params.committeeId });
}
