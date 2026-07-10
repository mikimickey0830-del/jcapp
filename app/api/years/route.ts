import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { AnnualRole } from "@/types/common";
import type { FiscalYearStatus } from "@/types/year";

type CreateYearPayload = {
  name?: string;
  startsOn?: string;
  endsOn?: string;
  copyFromFiscalYearId?: string | null;
  copyCommittees?: boolean;
  copyPositions?: boolean;
  copyAssignments?: boolean;
};

type FiscalYearInsertRow = {
  id: string;
  lom_id: string;
  year: number;
  name: string;
  starts_on: string;
  ends_on: string;
  status: FiscalYearStatus;
  is_current: boolean;
  copied_from_year_id: string | null;
};

type CommitteeCopyRow = {
  id: string;
  lom_id: string;
  name: string;
  sort_order: number;
};

type PositionCopyRow = {
  id: string;
  lom_id: string;
  name: string;
  sort_order: number;
};

type AssignmentCopyRow = {
  lom_id: string;
  member_id: string;
  committee_id: string | null;
  position_id: string | null;
  role: AnnualRole;
  is_board_member: boolean;
};

type CommitteeMembershipCopyRow = {
  lom_id: string;
  member_id: string;
  committee_id: string;
  role_in_committee: "chair" | "vice_chair" | "member" | "observer" | "advisor";
  is_primary: boolean;
  note: string | null;
};

function isDateLike(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function yearFromPayload(name: string, startsOn: string) {
  const fromName = name.match(/\d{4}/)?.[0];
  return Number(fromName ?? startsOn.slice(0, 4));
}

async function copyCommittees(sourceFiscalYearId: string, newFiscalYearId: string) {
  if (!supabase) {
    return new Map<string, string>();
  }

  const { data: sourceRows, error: sourceError } = await supabase
    .from("committees")
    .select("id, lom_id, name, sort_order")
    .eq("fiscal_year_id", sourceFiscalYearId)
    .order("sort_order", { ascending: true });

  if (sourceError) {
    throw new Error(`委員会コピー元を取得できませんでした。${sourceError.message}`);
  }

  const rows = (sourceRows ?? []) as unknown as CommitteeCopyRow[];

  if (rows.length === 0) {
    return new Map<string, string>();
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("committees")
    .insert(
      rows.map((row) => ({
        lom_id: row.lom_id,
        fiscal_year_id: newFiscalYearId,
        name: row.name,
        sort_order: row.sort_order
      }))
    )
    .select("id, name");

  if (insertError) {
    throw new Error(`委員会をコピーできませんでした。${insertError.message}`);
  }

  const insertedByName = new Map((insertedRows ?? []).map((row) => [row.name, row.id]));
  return new Map(rows.map((row) => [row.id, insertedByName.get(row.name) ?? ""]));
}

async function copyPositions(sourceFiscalYearId: string, newFiscalYearId: string) {
  if (!supabase) {
    return new Map<string, string>();
  }

  const { data: sourceRows, error: sourceError } = await supabase
    .from("positions")
    .select("id, lom_id, name, sort_order")
    .eq("fiscal_year_id", sourceFiscalYearId)
    .order("sort_order", { ascending: true });

  if (sourceError) {
    throw new Error(`役職コピー元を取得できませんでした。${sourceError.message}`);
  }

  const rows = (sourceRows ?? []) as unknown as PositionCopyRow[];

  if (rows.length === 0) {
    return new Map<string, string>();
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("positions")
    .insert(
      rows.map((row) => ({
        lom_id: row.lom_id,
        fiscal_year_id: newFiscalYearId,
        name: row.name,
        sort_order: row.sort_order
      }))
    )
    .select("id, name");

  if (insertError) {
    throw new Error(`役職をコピーできませんでした。${insertError.message}`);
  }

  const insertedByName = new Map((insertedRows ?? []).map((row) => [row.name, row.id]));
  return new Map(rows.map((row) => [row.id, insertedByName.get(row.name) ?? ""]));
}

async function copyAssignments(
  sourceFiscalYearId: string,
  newFiscalYearId: string,
  committeeIdMap: Map<string, string>,
  positionIdMap: Map<string, string>
) {
  if (!supabase) {
    return;
  }

  const { data: sourceRows, error: sourceError } = await supabase
    .from("annual_member_assignments")
    .select("lom_id, member_id, committee_id, position_id, role, is_board_member")
    .eq("fiscal_year_id", sourceFiscalYearId);

  if (sourceError) {
    throw new Error(`年度所属コピー元を取得できませんでした。${sourceError.message}`);
  }

  const rows = (sourceRows ?? []) as unknown as AssignmentCopyRow[];

  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("annual_member_assignments").insert(
    rows.map((row) => ({
      lom_id: row.lom_id,
      fiscal_year_id: newFiscalYearId,
      member_id: row.member_id,
      committee_id: row.committee_id ? committeeIdMap.get(row.committee_id) || null : null,
      position_id: row.position_id ? positionIdMap.get(row.position_id) || null : null,
      role: row.role,
      is_board_member: row.is_board_member
    }))
  );

  if (insertError) {
    throw new Error(`年度所属をコピーできませんでした。${insertError.message}`);
  }
}

async function copyCommitteeMemberships(
  sourceFiscalYearId: string,
  newFiscalYearId: string,
  committeeIdMap: Map<string, string>
) {
  if (!supabase) {
    return;
  }

  const { data: sourceRows, error: sourceError } = await supabase
    .from("committee_memberships")
    .select("lom_id, member_id, committee_id, role_in_committee, is_primary, note")
    .eq("fiscal_year_id", sourceFiscalYearId)
    .is("deleted_at", null);

  if (sourceError) {
    throw new Error(`委員会所属コピー元を取得できませんでした。${sourceError.message}`);
  }

  const rows = (sourceRows ?? []) as unknown as CommitteeMembershipCopyRow[];
  const insertRows = rows
    .map((row) => ({
      lom_id: row.lom_id,
      fiscal_year_id: newFiscalYearId,
      member_id: row.member_id,
      committee_id: committeeIdMap.get(row.committee_id) ?? "",
      role_in_committee: row.role_in_committee,
      is_primary: row.is_primary,
      note: row.note ?? ""
    }))
    .filter((row) => row.committee_id);

  if (insertRows.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("committee_memberships").insert(insertRows);

  if (insertError) {
    throw new Error(`委員会所属をコピーできませんでした。${insertError.message}`);
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  const payload = (await request.json()) as CreateYearPayload;
  const name = payload.name?.trim() ?? "";
  const startsOn = payload.startsOn ?? "";
  const endsOn = payload.endsOn ?? "";

  if (!name) {
    return NextResponse.json({ error: "年度名を入力してください。" }, { status: 400 });
  }

  if (!startsOn || !isDateLike(startsOn)) {
    return NextResponse.json({ error: "開始日を入力してください。" }, { status: 400 });
  }

  if (!endsOn || !isDateLike(endsOn)) {
    return NextResponse.json({ error: "終了日を入力してください。" }, { status: 400 });
  }

  if (startsOn > endsOn) {
    return NextResponse.json({ error: "終了日は開始日以降にしてください。" }, { status: 400 });
  }

  const { data: lom, error: lomError } = await supabase
    .from("loms")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (lomError || !lom) {
    return NextResponse.json({ error: "LOM情報を取得できませんでした。" }, { status: 500 });
  }

  const insertPayload = {
    lom_id: lom.id,
    year: yearFromPayload(name, startsOn),
    name,
    starts_on: startsOn,
    ends_on: endsOn,
    status: "planned",
    is_current: false,
    copied_from_year_id: payload.copyFromFiscalYearId || null
  };

  const { data: fiscalYear, error: insertError } = await supabase
    .from("fiscal_years")
    .insert(insertPayload)
    .select("id, lom_id, year, name, starts_on, ends_on, status, is_current, copied_from_year_id")
    .single();

  if (insertError || !fiscalYear) {
    return NextResponse.json(
      { error: `年度を保存できませんでした。${insertError?.message ?? ""}` },
      { status: 500 }
    );
  }

  const newFiscalYear = fiscalYear as FiscalYearInsertRow;

  try {
    if (payload.copyFromFiscalYearId) {
      const committeeIdMap = payload.copyCommittees
        ? await copyCommittees(payload.copyFromFiscalYearId, newFiscalYear.id)
        : new Map<string, string>();
      const positionIdMap = payload.copyPositions
        ? await copyPositions(payload.copyFromFiscalYearId, newFiscalYear.id)
        : new Map<string, string>();

      if (payload.copyAssignments) {
        await copyAssignments(payload.copyFromFiscalYearId, newFiscalYear.id, committeeIdMap, positionIdMap);
        await copyCommitteeMemberships(payload.copyFromFiscalYearId, newFiscalYear.id, committeeIdMap);
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "前年度コピーに失敗しました。" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: newFiscalYear.id });
}
