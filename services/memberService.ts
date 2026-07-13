import { getCurrentAnnualProfile, getMember, members, roleLabels as fallbackRoleLabels, statusLabels } from "@/lib/members";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/service";
import type { CommitteeMemberRole } from "@/types/committee";
import type { AnnualRole } from "@/types/common";
import type { AnnualMemberProfile, InvitationStatus, Member, MemberStatus } from "@/types/member";

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
  positions: SupabaseRelation<{ name: string | null }>;
};

type SupabaseCommitteeMembershipRow = {
  role_in_committee: CommitteeMemberRole | null;
  is_primary: boolean | null;
  note: string | null;
  deleted_at: string | null;
  fiscal_years: SupabaseRelation<{ year: number | null }>;
  committees: SupabaseRelation<{ name: string | null }>;
};

type SupabaseMemberRow = {
  id: string;
  auth_user_id: string | null;
  invitation_status: InvitationStatus | null;
  invited_at: string | null;
  activated_at: string | null;
  invitation_last_sent_at: string | null;
  lom_id: string;
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
  committee_memberships: SupabaseCommitteeMembershipRow[] | null;
};

const memberSelect = `
  id,
  auth_user_id,
  invitation_status,
  invited_at,
  activated_at,
  invitation_last_sent_at,
  lom_id,
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
    positions(name)
  ),
  committee_memberships(
    role_in_committee,
    is_primary,
    note,
    deleted_at,
    fiscal_years(year),
    committees(name)
  )
`;

const canUseFallbackData = process.env.NODE_ENV !== "production";
const fallbackMembers = () => (canUseFallbackData ? members : []);
const fallbackMember = (memberId: string) => (canUseFallbackData ? getMember(memberId) : undefined);

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

function membershipsByYear(rows: SupabaseCommitteeMembershipRow[] | null) {
  return (rows ?? [])
    .filter((row) => !row.deleted_at)
    .reduce<Map<number, NonNullable<AnnualMemberProfile["committeeMemberships"]>>>((accumulator, row) => {
      const fiscalYear = firstRelation(row.fiscal_years)?.year;

      if (!fiscalYear) {
        return accumulator;
      }

      accumulator.set(fiscalYear, [
        ...(accumulator.get(fiscalYear) ?? []),
        {
          committeeName: firstRelation(row.committees)?.name ?? "未設定",
          roleInCommittee: row.role_in_committee ?? "member",
          isPrimary: Boolean(row.is_primary),
          note: row.note ?? ""
        }
      ]);
      return accumulator;
    }, new Map());
}

function toAnnualProfile(
  row: SupabaseAssignmentRow,
  committeeMemberships: Map<number, NonNullable<AnnualMemberProfile["committeeMemberships"]>>
): AnnualMemberProfile | null {
  const fiscalYear = firstRelation(row.fiscal_years)?.year;

  if (!fiscalYear) {
    return null;
  }

  const memberships = committeeMemberships.get(fiscalYear) ?? [];
  const primaryMembership = memberships.find((membership) => membership.isPrimary) ?? memberships[0];

  return {
    fiscalYear,
    committee: primaryMembership?.committeeName ?? "未設定",
    committeeMemberships: memberships,
    position: firstRelation(row.positions)?.name ?? "未設定",
    role: row.role ?? "member"
  };
}

function toMember(row: SupabaseMemberRow): Member {
  const committeeMemberships = membershipsByYear(row.committee_memberships);

  return {
    id: row.id,
    authUserId: row.auth_user_id ?? undefined,
    lomId: row.lom_id,
    invitationStatus: row.auth_user_id ? "active" : row.invitation_status ?? "not_invited",
    invitedAt: row.invited_at ?? undefined,
    activatedAt: row.activated_at ?? undefined,
    invitationLastSentAt: row.invitation_last_sent_at ?? undefined,
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
      .map((assignment) => toAnnualProfile(assignment, committeeMemberships))
      .filter((profile): profile is AnnualMemberProfile => Boolean(profile))
      .sort((a, b) => b.fiscalYear - a.fiscalYear)
  };
}

async function fetchMembersFromSupabase(): Promise<MemberQueryResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: fallbackMembers(),
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
      data: fallbackMembers(),
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
      data: fallbackMember(memberId),
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
      data: fallbackMember(memberId),
      error: `Supabaseから会員詳細を取得できませんでした。仮データを表示しています。(${error.message})`,
      source: "fallback"
    };
  }

  if (!data) {
    return {
      data: fallbackMember(memberId),
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
  getFallbackMembers: fallbackMembers,
  getFallbackMemberById: fallbackMember,
  getCurrentAnnualProfile,
  roleLabels,
  statusLabels
};
