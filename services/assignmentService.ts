import {
  assignmentRoleLabels,
  getFallbackAssignmentFormOptions,
  getFallbackAssignmentSummaries,
  getFallbackAssignmentYear
} from "@/lib/assignments";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type {
  AnnualMemberAssignmentView,
  AssignmentFormOptions,
  AssignmentYearDetail,
  AssignmentYearSummary
} from "@/types/assignment";
import type { AnnualRole } from "@/types/common";
import type { Member, MemberStatus } from "@/types/member";

type DataSource = "supabase" | "fallback";

type QueryResult<T> = {
  data: T;
  error: string | null;
  source: DataSource;
};

type SupabaseRelation<T> = T | T[] | null;

type FiscalYearRow = {
  id: string;
  year: number;
  name: string;
  loms: SupabaseRelation<{ name: string | null }>;
};

type MemberRow = {
  id: string;
  last_name: string;
  first_name: string;
  last_name_kana: string;
  first_name_kana: string;
  email: string;
  phone: string | null;
  joined_year: number;
  status: MemberStatus;
  loms: SupabaseRelation<{ name: string | null }>;
};

type CommitteeRow = {
  id: string;
  fiscal_year_id: string;
  name: string;
  deleted_at?: string | null;
};

type PositionRow = {
  id: string;
  fiscal_year_id: string;
  name: string;
};

type AssignmentRow = {
  id: string;
  fiscal_year_id: string;
  member_id: string;
  committee_id: string | null;
  position_id: string | null;
  role: AnnualRole | null;
  is_board_member: boolean | null;
  is_active: boolean | null;
};

function firstRelation<T>(relation: SupabaseRelation<T>) {
  return Array.isArray(relation) ? relation[0] : relation;
}

function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    lastName: row.last_name,
    firstName: row.first_name,
    lastNameKana: row.last_name_kana,
    firstNameKana: row.first_name_kana,
    email: row.email,
    phone: row.phone ?? "",
    lomName: firstRelation(row.loms)?.name ?? "未設定",
    joinedYear: row.joined_year,
    status: row.status,
    annualProfiles: []
  };
}

async function fetchFiscalYears() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("fiscal_years")
    .select("id, year, name, loms(name)")
    .order("year", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as FiscalYearRow[];
}

async function fetchMembers() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("members")
    .select("id, last_name, first_name, last_name_kana, first_name_kana, email, phone, joined_year, status, loms(name)")
    .order("last_name_kana", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as MemberRow[]).map(toMember);
}

async function fetchCommittees(yearId?: string) {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("committees")
    .select("id, fiscal_year_id, name, deleted_at")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (yearId) {
    query = query.eq("fiscal_year_id", yearId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as CommitteeRow[];
}

async function fetchPositions(yearId?: string) {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("positions")
    .select("id, fiscal_year_id, name")
    .order("sort_order", { ascending: true });

  if (yearId) {
    query = query.eq("fiscal_year_id", yearId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as PositionRow[];
}

async function fetchAssignments(yearId?: string) {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("annual_member_assignments")
    .select("id, fiscal_year_id, member_id, committee_id, position_id, role, is_board_member, is_active");

  if (yearId) {
    query = query.eq("fiscal_year_id", yearId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as AssignmentRow[];
}

function toYearSummary(
  year: FiscalYearRow,
  memberCount: number,
  assignmentsByYear: Map<string, AssignmentRow[]>
): AssignmentYearSummary {
  const assignments = assignmentsByYear.get(year.id) ?? [];
  const activeCount = assignments.filter((assignment) => assignment.is_active !== false).length;

  return {
    fiscalYearId: year.id,
    fiscalYearName: year.name,
    fiscalYear: year.year,
    lomName: firstRelation(year.loms)?.name ?? "未設定",
    memberCount,
    assignmentCount: assignments.length,
    activeCount,
    inactiveCount: assignments.length - activeCount
  };
}

function toAssignmentRows(
  year: FiscalYearRow,
  members: Member[],
  committees: CommitteeRow[],
  positions: PositionRow[],
  assignments: AssignmentRow[]
): AnnualMemberAssignmentView[] {
  const committeeById = new Map(committees.map((committee) => [committee.id, committee]));
  const positionById = new Map(positions.map((position) => [position.id, position]));
  const assignmentByMemberId = new Map(assignments.map((assignment) => [assignment.member_id, assignment]));

  return members.map((member) => {
    const assignment = assignmentByMemberId.get(member.id);
    const committee = assignment?.committee_id ? committeeById.get(assignment.committee_id) : undefined;
    const position = assignment?.position_id ? positionById.get(assignment.position_id) : undefined;

    return {
      id: assignment?.id ?? "",
      fiscalYearId: year.id,
      fiscalYearName: year.name,
      fiscalYear: year.year,
      memberId: member.id,
      memberName: `${member.lastName} ${member.firstName}`,
      memberKana: `${member.lastNameKana} ${member.firstNameKana}`,
      memberEmail: member.email,
      committeeId: assignment?.committee_id ?? "",
      committeeName: committee?.name ?? "未設定",
      positionId: assignment?.position_id ?? "",
      positionName: position?.name ?? "未設定",
      role: assignment?.role ?? "member",
      isBoardMember: Boolean(assignment?.is_board_member),
      isActive: assignment ? assignment.is_active !== false : false
    };
  });
}

async function fetchAssignmentSummaries(): Promise<QueryResult<AssignmentYearSummary[]>> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: getFallbackAssignmentSummaries(),
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  try {
    const [years, members, assignments] = await Promise.all([
      fetchFiscalYears(),
      fetchMembers(),
      fetchAssignments()
    ]);
    const assignmentsByYear = assignments.reduce<Map<string, AssignmentRow[]>>((accumulator, assignment) => {
      accumulator.set(assignment.fiscal_year_id, [
        ...(accumulator.get(assignment.fiscal_year_id) ?? []),
        assignment
      ]);
      return accumulator;
    }, new Map());

    return {
      data: years.map((year) => toYearSummary(year, members.length, assignmentsByYear)),
      error: null,
      source: "supabase"
    };
  } catch (error) {
    return {
      data: getFallbackAssignmentSummaries(),
      error: `Supabaseから年度所属を取得できませんでした。仮データを表示しています。(${
        error instanceof Error ? error.message : "unknown"
      })`,
      source: "fallback"
    };
  }
}

async function fetchAssignmentYear(yearId: string): Promise<QueryResult<AssignmentYearDetail | undefined>> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: getFallbackAssignmentYear(yearId),
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  try {
    const [years, members, committees, positions, assignments] = await Promise.all([
      fetchFiscalYears(),
      fetchMembers(),
      fetchCommittees(yearId),
      fetchPositions(yearId),
      fetchAssignments(yearId)
    ]);
    const year = years.find((item) => item.id === yearId || item.year === Number(yearId));

    if (!year) {
      return {
        data: getFallbackAssignmentYear(yearId),
        error: null,
        source: "fallback"
      };
    }

    return {
      data: {
        fiscalYearId: year.id,
        fiscalYearName: year.name,
        fiscalYear: year.year,
        lomName: firstRelation(year.loms)?.name ?? "未設定",
        rows: toAssignmentRows(year, members, committees, positions, assignments)
      },
      error: null,
      source: "supabase"
    };
  } catch (error) {
    return {
      data: getFallbackAssignmentYear(yearId),
      error: `Supabaseから年度別所属を取得できませんでした。仮データを表示しています。(${
        error instanceof Error ? error.message : "unknown"
      })`,
      source: "fallback"
    };
  }
}

async function fetchAssignmentFormOptions(
  yearId: string,
  memberId: string
): Promise<QueryResult<AssignmentFormOptions | undefined>> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: getFallbackAssignmentFormOptions(yearId, memberId),
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  try {
    const [years, members, committees, positions] = await Promise.all([
      fetchFiscalYears(),
      fetchMembers(),
      fetchCommittees(yearId),
      fetchPositions(yearId)
    ]);
    const year = years.find((item) => item.id === yearId || item.year === Number(yearId));
    const member = members.find((item) => item.id === memberId);

    if (!year || !member) {
      return {
        data: getFallbackAssignmentFormOptions(yearId, memberId),
        error: null,
        source: "fallback"
      };
    }

    return {
      data: {
        fiscalYear: {
          id: year.id,
          name: year.name,
          year: year.year,
          lomName: firstRelation(year.loms)?.name ?? "未設定"
        },
        member,
        committees: committees.map((committee) => ({ id: committee.id, name: committee.name })),
        positions: positions.map((position) => ({ id: position.id, name: position.name }))
      },
      error: null,
      source: "supabase"
    };
  } catch (error) {
    return {
      data: getFallbackAssignmentFormOptions(yearId, memberId),
      error: `Supabaseから編集候補を取得できませんでした。仮データを表示しています。(${
        error instanceof Error ? error.message : "unknown"
      })`,
      source: "fallback"
    };
  }
}

export const assignmentService = {
  getAssignmentSummaries: fetchAssignmentSummaries,
  getAssignmentYear: fetchAssignmentYear,
  getAssignmentFormOptions: fetchAssignmentFormOptions,
  roleLabels: assignmentRoleLabels
};
