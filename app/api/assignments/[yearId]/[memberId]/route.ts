import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { AssignmentMutationPayload } from "@/types/assignment";
import type { AnnualRole } from "@/types/common";

const validRoles: AnnualRole[] = ["member", "vice_chair", "chair", "secretary", "president", "admin"];

function validateAssignmentInput(body: AssignmentMutationPayload) {
  if (body.role && !validRoles.includes(body.role)) {
    return "権限の値が不正です。";
  }

  return null;
}

async function upsertAssignment(yearId: string, memberId: string, body: AssignmentMutationPayload) {
  if (!supabase) {
    throw new Error("Supabase環境変数が未設定です。");
  }

  const { data: fiscalYear, error: fiscalYearError } = await supabase
    .from("fiscal_years")
    .select("lom_id")
    .eq("id", yearId)
    .single();

  if (fiscalYearError || !fiscalYear) {
    throw new Error("年度情報を取得できませんでした。");
  }

  const { error } = await supabase.from("annual_member_assignments").upsert(
    {
      lom_id: fiscalYear.lom_id,
      fiscal_year_id: yearId,
      member_id: memberId,
      committee_id: body.committeeId || null,
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
}

export async function PATCH(
  request: Request,
  { params }: { params: { yearId: string; memberId: string } }
) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  const body = (await request.json()) as AssignmentMutationPayload;
  const validationError = validateAssignmentInput(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    await upsertAssignment(params.yearId, params.memberId, body);
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
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  try {
    await upsertAssignment(params.yearId, params.memberId, {
      role: "member",
      isBoardMember: false,
      isActive: false
    });
    return NextResponse.json({ yearId: params.yearId, memberId: params.memberId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "年度所属を無効化できませんでした。" },
      { status: 500 }
    );
  }
}
