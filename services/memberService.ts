import { getCurrentAnnualProfile, getMember, members, roleLabels as fallbackRoleLabels, statusLabels } from "@/lib/members";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { AnnualRole } from "@/types/common";
import type { AnnualMemberProfile, Member, MemberStatus } from "@/types/member";

type MemberQueryResult = {
  data: Member[];
  error: string | null;
  source: "supabase" | "fallback";
};

type SingleMemberQueryResult = {
  data: Member | undefined;
  error: string | null;
  source: "supabase" | "fallback";
};

type SupabaseRelation<T> = T | T[] | null;

type SupabaseAssignmentRow = {
  role: AnnualRole | null;
  fiscal_years: SupabaseRelation<{ year: number | null }>;
  committees: SupabaseRelation<{ name: string | null }>;
  positions: SupabaseRelation<{ name: string | null }>;
};

type SupabaseMemberRow = {
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
  annual_member_assignments: SupabaseAssignmentRow[] | null;
};

const memberSelect = `
  id,
  last_name,
  first_name,
  last_name_kana,
  first_name_kana,
  email,
  phone,
  joined_year,
  status,
  loms(name),
  annual_member_assignments(
    role,
    fiscal_years(year),
    committees(name),
    positions(name)
  )
`;

export const roleLabels: Record<AnnualRole, string> = {
  ...fallbackRoleLabels,
  vice_chair: "副委員長",
  chair: "委員長",
  secretary: "専務理事",
  president: "理事長"
};

function firstRelation<T>(relation: SupabaseRelation<T>) {
  return Array.isArray(relation) ? relation[0] : relation;
}

function toAnnualProfile(row: SupabaseAssignmentRow): AnnualMemberProfile | null {
  const fiscalYear = firstRelation(row.fiscal_years)?.year;

  if (!fiscalYear) {
    return null;
  }

  return {
    fiscalYear,
    committee: firstRelation(row.committees)?.name ?? "未設定",
    position: firstRelation(row.positions)?.name ?? "未設定",
    role: row.role ?? "member"
  };
}

function toMember(row: SupabaseMemberRow): Member {
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
    annualProfiles: (row.annual_member_assignments ?? [])
      .map(toAnnualProfile)
      .filter((profile): profile is AnnualMemberProfile => Boolean(profile))
      .sort((a, b) => b.fiscalYear - a.fiscalYear)
  };
}

async function fetchMembersFromSupabase(): Promise<MemberQueryResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: members,
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  const { data, error } = await supabase
    .from("members")
    .select(memberSelect)
    .order("last_name_kana", { ascending: true });

  if (error) {
    return {
      data: members,
      error: `Supabaseから会員一覧を取得できませんでした。仮データを表示しています。(${error.message})`,
      source: "fallback"
    };
  }

  return {
    data: ((data ?? []) as unknown as SupabaseMemberRow[]).map(toMember),
    error: null,
    source: "supabase"
  };
}

async function fetchMemberFromSupabase(memberId: string): Promise<SingleMemberQueryResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: getMember(memberId),
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  const { data, error } = await supabase
    .from("members")
    .select(memberSelect)
    .eq("id", memberId)
    .maybeSingle();

  if (error) {
    return {
      data: getMember(memberId),
      error: `Supabaseから会員詳細を取得できませんでした。仮データを表示しています。(${error.message})`,
      source: "fallback"
    };
  }

  if (!data) {
    return {
      data: getMember(memberId),
      error: null,
      source: "fallback"
    };
  }

  return {
    data: toMember(data as unknown as SupabaseMemberRow),
    error: null,
    source: "supabase"
  };
}

export const memberService = {
  getMembers: fetchMembersFromSupabase,
  getMemberById: fetchMemberFromSupabase,
  getFallbackMembers: () => members,
  getFallbackMemberById: (memberId: string) => getMember(memberId),
  getCurrentAnnualProfile,
  roleLabels,
  statusLabels
};
