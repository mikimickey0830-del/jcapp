import { committees, getCommittee } from "@/lib/committees";
import { members as fallbackMembers } from "@/lib/members";
import { fiscalYears } from "@/lib/years";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type {
  CommitteeDetail,
  CommitteeFormOptions,
  CommitteeMember,
  CommitteeMemberRole
} from "@/types/committee";
import type { AnnualRole } from "@/types/common";
import type { Member, MemberStatus } from "@/types/member";

type CommitteeQueryResult = {
  data: CommitteeDetail[];
  error: string | null;
  source: "supabase" | "fallback";
};

type SingleCommitteeQueryResult = {
  data: CommitteeDetail | undefined;
  error: string | null;
  source: "supabase" | "fallback";
};

type CommitteeOptionsResult = {
  data: CommitteeFormOptions;
  error: string | null;
  source: "supabase" | "fallback";
};

type SupabaseRelation<T> = T | T[] | null;

type CommitteeRow = {
  id: string;
  fiscal_year_id: string;
  name: string;
  description: string | null;
  vice_president_member_id: string | null;
  chair_member_id: string | null;
  vice_chair_member_id: string | null;
  sort_order: number | null;
  deleted_at: string | null;
  fiscal_years: SupabaseRelation<{
    id: string;
    year: number;
    name: string;
    loms: SupabaseRelation<{ name: string | null }>;
  }>;
};

type AssignmentRow = {
  committee_id: string | null;
  member_id: string;
  role: AnnualRole | null;
  is_active?: boolean | null;
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

type FiscalYearOptionRow = {
  id: string;
  year: number;
  name: string;
  loms: SupabaseRelation<{ name: string | null }>;
};

const committeeSelect = `
  id,
  fiscal_year_id,
  name,
  description,
  vice_president_member_id,
  chair_member_id,
  vice_chair_member_id,
  sort_order,
  deleted_at,
  fiscal_years(id, year, name, loms(name))
`;

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

function memberRole(memberId: string, committee: CommitteeRow, assignment?: AssignmentRow): CommitteeMemberRole {
  if (memberId === committee.vice_president_member_id) {
    return "vice_president";
  }

  if (memberId === committee.chair_member_id || assignment?.role === "chair") {
    return "chair";
  }

  if (memberId === committee.vice_chair_member_id || assignment?.role === "vice_chair") {
    return "vice_chair";
  }

  return "member";
}

function toCommitteeDetail(
  row: CommitteeRow,
  membersById: Map<string, Member>,
  assignmentsByCommittee: Map<string, AssignmentRow[]>
): CommitteeDetail {
  const fiscalYear = firstRelation(row.fiscal_years);
  const lomName = firstRelation(fiscalYear?.loms ?? null)?.name ?? "未設定";
  const assignments = assignmentsByCommittee.get(row.id) ?? [];
  const selectedMemberIds = new Set([
    ...assignments.map((assignment) => assignment.member_id),
    row.vice_president_member_id,
    row.chair_member_id,
    row.vice_chair_member_id
  ].filter((memberId): memberId is string => Boolean(memberId)));

  const committeeMembers: CommitteeMember[] = Array.from(selectedMemberIds)
    .map((memberId) => {
      const member = membersById.get(memberId);

      if (!member) {
        return null;
      }

      const assignment = assignments.find((item) => item.member_id === memberId);
      return {
        id: member.id,
        lastName: member.lastName,
        firstName: member.firstName,
        lastNameKana: member.lastNameKana,
        firstNameKana: member.firstNameKana,
        email: member.email,
        role: memberRole(memberId, row, assignment)
      };
    })
    .filter((member): member is CommitteeMember => Boolean(member));

  return {
    id: row.id,
    fiscalYearId: row.fiscal_year_id,
    fiscalYearName: fiscalYear?.name ?? "未設定",
    fiscalYear: fiscalYear?.year ?? 0,
    lomName,
    name: row.name,
    description: row.description ?? "",
    vicePresidentMemberId: row.vice_president_member_id ?? "",
    chairMemberId: row.chair_member_id ?? "",
    viceChairMemberId: row.vice_chair_member_id ?? "",
    memberIds: Array.from(selectedMemberIds),
    members: committeeMembers,
    sortOrder: row.sort_order ?? 0,
    deletedAt: row.deleted_at
  };
}

async function fetchMembers() {
  if (!supabase) {
    return fallbackMembers;
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

async function fetchCommitteeRows() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("committees")
    .select(committeeSelect)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as CommitteeRow[];
}

async function fetchAssignments() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("annual_member_assignments")
    .select("committee_id, member_id, role, is_active")
    .not("committee_id", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as AssignmentRow[];
}

async function fetchCommitteeOptions(): Promise<CommitteeOptionsResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: {
        fiscalYears: fiscalYears.map((year) => ({
          id: year.id,
          name: year.name,
          year: year.year,
          lomName: year.lomName
        })),
        members: fallbackMembers
      },
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  try {
    const [members, fiscalYearResult] = await Promise.all([
      fetchMembers(),
      supabase
        .from("fiscal_years")
        .select("id, year, name, loms(name)")
        .order("year", { ascending: false })
    ]);

    if (fiscalYearResult.error) {
      throw new Error(fiscalYearResult.error.message);
    }

    return {
      data: {
        fiscalYears: ((fiscalYearResult.data ?? []) as unknown as FiscalYearOptionRow[]).map((year) => ({
          id: year.id,
          name: year.name,
          year: year.year,
          lomName: firstRelation(year.loms)?.name ?? "未設定"
        })),
        members
      },
      error: null,
      source: "supabase"
    };
  } catch (error) {
    return {
      data: {
        fiscalYears: fiscalYears.map((year) => ({
          id: year.id,
          name: year.name,
          year: year.year,
          lomName: year.lomName
        })),
        members: fallbackMembers
      },
      error: `Supabaseからフォーム候補を取得できませんでした。仮データを表示しています。(${
        error instanceof Error ? error.message : "unknown"
      })`,
      source: "fallback"
    };
  }
}

async function fetchCommittees(): Promise<CommitteeQueryResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: committees,
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  try {
    const [committeeRows, members, assignmentRows] = await Promise.all([
      fetchCommitteeRows(),
      fetchMembers(),
      fetchAssignments()
    ]);
    const membersById = new Map(members.map((member) => [member.id, member]));
    const assignmentsByCommittee = assignmentRows.reduce<Map<string, AssignmentRow[]>>((accumulator, assignment) => {
      if (!assignment.committee_id || assignment.is_active === false) {
        return accumulator;
      }

      accumulator.set(assignment.committee_id, [...(accumulator.get(assignment.committee_id) ?? []), assignment]);
      return accumulator;
    }, new Map());

    return {
      data: committeeRows.map((row) => toCommitteeDetail(row, membersById, assignmentsByCommittee)),
      error: null,
      source: "supabase"
    };
  } catch (error) {
    return {
      data: committees,
      error: `Supabaseから委員会情報を取得できませんでした。仮データを表示しています。(${
        error instanceof Error ? error.message : "unknown"
      })`,
      source: "fallback"
    };
  }
}

async function fetchCommittee(committeeId: string): Promise<SingleCommitteeQueryResult> {
  const result = await fetchCommittees();

  return {
    data: result.data.find((committee) => committee.id === committeeId) ?? getCommittee(committeeId),
    error: result.error,
    source: result.source
  };
}

export const committeeService = {
  getCommittees: fetchCommittees,
  getCommitteeById: fetchCommittee,
  getFormOptions: fetchCommitteeOptions,
  getFallbackCommittees: () => committees,
  getFallbackCommitteeById: (committeeId: string) => getCommittee(committeeId)
};
