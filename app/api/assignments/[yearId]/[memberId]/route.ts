import { NextResponse } from "next/server";
import { requireManagement } from "@/lib/auth/requireManagement";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/service";
import type { AssignmentMutationPayload } from "@/types/assignment";
import type { CommitteeMemberRole } from "@/types/committee";
import type { AnnualRole } from "@/types/common";

const validRoles: AnnualRole[] = ["member", "vice_chair", "chair", "secretary", "president", "admin"];
const validCommitteeRoles: CommitteeMemberRole[] = ["chair", "vice_chair", "member", "observer", "advisor"];

function validateAssignmentInput(body: AssignmentMutationPayload) {
  if (body.role && !validRoles.includes(body.role)) {
    return "権限の値が不正です。";
  }

  const invalidCommitteeRole = body.committeeMemberships?.find(
    (membership) => membership.roleInCommittee && !validCommitteeRoles.includes(membership.roleInCommittee)
  );

  if (invalidCommitteeRole) {
    return "委員会内の区分が不正です。";
  }

  return null;
}

async function getFiscalYearLomId(yearId: string) {
  if (!supabase) {
    throw new Error("Supabase環境変数が未設定です。");
  }

  const { data, error } = await supabase
    .from("fiscal_years")
    .select("lom_id")
    .eq("id", yearId)
    .single();

  if (error || !data) {
    throw new Error("年度情報を取得できませんでした。");
  }

  return data.lom_id as string;
}

async function upsertAssignment(yearId: string, memberId: string, body: AssignmentMutationPayload) {
  if (!supabase) {
    throw new Error("Supabase環境変数が未設定です。");
  }

  const lomId = await getFiscalYearLomId(yearId);

  const { error } = await supabase.from("annual_member_assignments").upsert(
    {
      lom_id: lomId,
      fiscal_year_id: yearId,
      member_id: memberId,
      position_id: body.positionId || null,
      role: body.role ?? "member",
      is_board_member: Boolean(body.isBoardMember),
      is_active: body.isActive ?? true,
      updated_at: new Date().toISOString()
    },
    { onConflict: "fiscal_year_id,member_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  return lomId;
}

async function syncCommitteeMemberships(
  yearId: string,
  memberId: string,
  lomId: string,
  body: AssignmentMutationPayload
) {
  if (!supabase || !body.committeeMemberships) {
    return;
  }

  const now = new Date().toISOString();
  const memberships = body.committeeMemberships;
  const deletedIds = memberships
    .filter((membership) => membership.deleted && membership.id)
    .map((membership) => membership.id as string);

  if (deletedIds.length > 0) {
    const { error } = await supabase
      .from("committee_memberships")
      .update({ deleted_at: now })
      .in("id", deletedIds);

    if (error) {
      throw new Error(error.message);
    }
  }

  const activeMemberships = memberships.filter((membership) => !membership.deleted && membership.committeeId);

  if (activeMemberships.length === 0) {
    return;
  }

  const primaryCommitteeId =
    activeMemberships.find((membership) => membership.isPrimary)?.committeeId ?? activeMemberships[0]?.committeeId;

  const { error } = await supabase.from("committee_memberships").upsert(
    activeMemberships.map((membership) => ({
      ...(membership.id ? { id: membership.id } : {}),
      lom_id: lomId,
      fiscal_year_id: yearId,
      member_id: memberId,
      committee_id: membership.committeeId,
      role_in_committee: membership.roleInCommittee ?? "member",
      is_primary: membership.committeeId === primaryCommitteeId,
      note: membership.note?.trim() ?? "",
      deleted_at: null,
      updated_at: now
    })),
    { onConflict: "fiscal_year_id,member_id,committee_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { yearId: string; memberId: string } }
) {
  const guard = await requireManagement();
  if (guard.response) return guard.response;
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  const body = (await request.json()) as AssignmentMutationPayload;
  const validationError = validateAssignmentInput(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const lomId = await upsertAssignment(params.yearId, params.memberId, body);
    await syncCommitteeMemberships(params.yearId, params.memberId, lomId, body);
    return NextResponse.json({ yearId: params.yearId, memberId: params.memberId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "年度所属を保存できませんでした。" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { yearId: string; memberId: string } }
) {
  const guard = await requireManagement();
  if (guard.response) return guard.response;
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  try {
    await upsertAssignment(params.yearId, params.memberId, {
      role: "member",
      isBoardMember: false,
      isActive: false
    });
    const { error } = await supabase
      .from("committee_memberships")
      .update({ deleted_at: new Date().toISOString() })
      .eq("fiscal_year_id", params.yearId)
      .eq("member_id", params.memberId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ yearId: params.yearId, memberId: params.memberId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "年度所属を無効化できませんでした。" },
      { status: 500 }
    );
  }
}
