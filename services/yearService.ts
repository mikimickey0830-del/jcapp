import {
  fiscalYears,
  fiscalYearStatusLabels,
  getAssignmentRows,
  getFiscalYear
} from "@/lib/years";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { AnnualRole } from "@/types/common";
import type { AnnualAssignment, Committee, FiscalYear, FiscalYearStatus, Position } from "@/types/year";

type YearQueryResult = {
  data: FiscalYear[];
  error: string | null;
  source: "supabase" | "fallback";
};

type SingleYearQueryResult = {
  data: FiscalYear | undefined;
  error: string | null;
  source: "supabase" | "fallback";
};

type SupabaseRelation<T> = T | T[] | null;

type FiscalYearRow = {
  id: string;
  year: number;
  name: string;
  starts_on: string;
  ends_on: string;
  status: FiscalYearStatus;
  copied_from_year_id: string | null;
  loms: SupabaseRelation<{ name: string | null }>;
};

type CommitteeRow = {
  id: string;
  fiscal_year_id: string;
  name: string;
  sort_order: number | null;
};

type PositionRow = {
  id: string;
  fiscal_year_id: string;
  name: string;
  sort_order: number | null;
};

type AssignmentRow = {
  fiscal_year_id: string;
  member_id: string;
  committee_id: string | null;
  position_id: string | null;
  role: AnnualRole | null;
  is_board_member: boolean | null;
  members: SupabaseRelation<{
    last_name: string | null;
    first_name: string | null;
    last_name_kana: string | null;
    first_name_kana: string | null;
  }>;
};

function firstRelation<T>(relation: SupabaseRelation<T>) {
  return Array.isArray(relation) ? relation[0] : relation;
}

function byFiscalYearId<T extends { fiscal_year_id: string }>(rows: T[]) {
  return rows.reduce<Record<string, T[]>>((accumulator, row) => {
    accumulator[row.fiscal_year_id] = [...(accumulator[row.fiscal_year_id] ?? []), row];
    return accumulator;
  }, {});
}

function toCommittee(row: CommitteeRow): Committee {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order ?? 0
  };
}

function toPosition(row: PositionRow): Position {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order ?? 0
  };
}

function toAssignment(
  row: AssignmentRow,
  committeeMap: Map<string, Committee>,
  positionMap: Map<string, Position>
): AnnualAssignment {
  const member = firstRelation(row.members);
  const committee = row.committee_id ? committeeMap.get(row.committee_id) : undefined;
  const position = row.position_id ? positionMap.get(row.position_id) : undefined;

  return {
    memberId: row.member_id,
    committeeId: row.committee_id ?? "",
    positionId: row.position_id ?? "",
    role: row.role ?? "member",
    isBoardMember: Boolean(row.is_board_member),
    memberName: member ? `${member.last_name ?? ""} ${member.first_name ?? ""}`.trim() : "未登録会員",
    memberKana: member ? `${member.last_name_kana ?? ""} ${member.first_name_kana ?? ""}`.trim() : "",
    committeeName: committee?.name ?? "未設定",
    positionName: position?.name ?? "未設定"
  };
}

async function fetchYearsFromSupabase(): Promise<YearQueryResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: fiscalYears,
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  const [
    fiscalYearResult,
    committeeResult,
    positionResult,
    assignmentResult
  ] = await Promise.all([
    supabase
      .from("fiscal_years")
      .select("id, year, name, starts_on, ends_on, status, copied_from_year_id, loms(name)")
      .order("year", { ascending: false }),
    supabase.from("committees").select("id, fiscal_year_id, name, sort_order").order("sort_order", { ascending: true }),
    supabase.from("positions").select("id, fiscal_year_id, name, sort_order").order("sort_order", { ascending: true }),
    supabase
      .from("annual_member_assignments")
      .select(
        "fiscal_year_id, member_id, committee_id, position_id, role, is_board_member, members(last_name, first_name, last_name_kana, first_name_kana)"
      )
  ]);

  const error =
    fiscalYearResult.error ?? committeeResult.error ?? positionResult.error ?? assignmentResult.error;

  if (error) {
    return {
      data: fiscalYears,
      error: `Supabaseから年度情報を取得できませんでした。仮データを表示しています。(${error.message})`,
      source: "fallback"
    };
  }

  const yearRows = (fiscalYearResult.data ?? []) as unknown as FiscalYearRow[];
  const committeeRows = (committeeResult.data ?? []) as unknown as CommitteeRow[];
  const positionRows = (positionResult.data ?? []) as unknown as PositionRow[];
  const assignmentRows = (assignmentResult.data ?? []) as unknown as AssignmentRow[];

  const committeesByYear = byFiscalYearId(committeeRows);
  const positionsByYear = byFiscalYearId(positionRows);
  const assignmentsByYear = byFiscalYearId(assignmentRows);
  const copiedYearById = new Map(yearRows.map((row) => [row.id, row.year]));

  const data = yearRows.map<FiscalYear>((row) => {
    const committees = (committeesByYear[row.id] ?? []).map(toCommittee);
    const positions = (positionsByYear[row.id] ?? []).map(toPosition);
    const committeeMap = new Map(committees.map((committee) => [committee.id, committee]));
    const positionMap = new Map(positions.map((position) => [position.id, position]));

    return {
      id: row.id,
      year: row.year,
      name: row.name,
      lomName: firstRelation(row.loms)?.name ?? "未設定",
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      status: row.status,
      copiedFromYear: row.copied_from_year_id ? copiedYearById.get(row.copied_from_year_id) : undefined,
      committees,
      positions,
      assignments: (assignmentsByYear[row.id] ?? []).map((assignment) =>
        toAssignment(assignment, committeeMap, positionMap)
      )
    };
  });

  return {
    data,
    error: null,
    source: "supabase"
  };
}

async function fetchYearFromSupabase(yearOrId: string): Promise<SingleYearQueryResult> {
  const yearsResult = await fetchYearsFromSupabase();
  const data = yearsResult.data.find(
    (fiscalYear) => fiscalYear.id === yearOrId || fiscalYear.year === Number(yearOrId)
  );

  return {
    data: data ?? getFiscalYear(yearOrId),
    error: yearsResult.error,
    source: yearsResult.source
  };
}

export const yearService = {
  getYears: fetchYearsFromSupabase,
  getYearByValue: fetchYearFromSupabase,
  getFallbackYears: () => fiscalYears,
  getFallbackYearByValue: (year: string | number) => getFiscalYear(year),
  getAssignmentRows,
  fiscalYearStatusLabels
};
