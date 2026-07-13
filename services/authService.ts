import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AuthContext, AuthMember } from "@/types/auth";
import type { AnnualRole } from "@/types/common";

const managementRoles: AnnualRole[] = ["admin", "president", "secretary"];

type MemberRow = {
  id: string;
  auth_user_id: string | null;
  lom_id: string;
  last_name: string;
  first_name: string;
  email: string;
};

type AssignmentRow = {
  role: AnnualRole;
  is_active: boolean;
  fiscal_years: { is_current: boolean; status: "planned" | "current" | "closed" } | Array<{ is_current: boolean; status: "planned" | "current" | "closed" }> | null;
};

type AuthenticatedUser = {
  id: string;
  email?: string;
};

async function findLinkedMember(supabase: NonNullable<ReturnType<typeof createClient>>, user: AuthenticatedUser) {
  const { data: linkedMember, error: linkedMemberError } = await supabase
    .from("members")
    .select("id, auth_user_id, lom_id, last_name, first_name, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (linkedMemberError || linkedMember || !user.email) {
    return { member: linkedMember as MemberRow | null, error: linkedMemberError?.message ?? null };
  }

  // RLS prevents an unlinked user from reading the member directory. The RPC
  // links only one exact email match and keeps protected columns server-owned.
  const { data: linkedMemberId, error: linkError } = await supabase.rpc("link_current_member_by_email");
  if (linkError || !linkedMemberId) {
    return { member: null, error: linkError?.message ?? null };
  }

  const { data: linkedByEmail, error: linkedByEmailError } = await supabase
    .from("members")
    .select("id, auth_user_id, lom_id, last_name, first_name, email")
    .eq("id", linkedMemberId)
    .maybeSingle();

  return {
    member: linkedByEmail as MemberRow | null,
    error: linkedByEmailError?.message ?? null,
  };
}

async function getCurrentAuthContext(): Promise<AuthContext> {
  const supabase = createClient();
  if (!supabase) {
    return {
      isAuthenticated: false,
      canManage: false,
      error: "Supabase環境変数が設定されていません。",
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return {
      isAuthenticated: false,
      canManage: false,
      error: userError?.message ?? null,
    };
  }

  const { member: memberData, error: memberError } = await findLinkedMember(supabase, user);

  if (memberError || !memberData) {
    return {
      userId: user.id,
      userEmail: user.email,
      isAuthenticated: true,
      canManage: false,
      error: memberError,
    };
  }

  const row = memberData as MemberRow;
  const { data: assignmentData, error: assignmentError } = await supabase
    .from("annual_member_assignments")
    .select("role, is_active, fiscal_years(is_current, status)")
    .eq("member_id", row.id)
    .eq("is_active", true);
  const currentRoles = ((assignmentData ?? []) as AssignmentRow[])
    .filter((item) => {
      const fiscalYear = Array.isArray(item.fiscal_years) ? item.fiscal_years[0] : item.fiscal_years;
      return fiscalYear?.is_current === true || fiscalYear?.status === "current";
    })
    .map((item) => item.role);
  const member: AuthMember = {
    id: row.id,
    authUserId: row.auth_user_id ?? user.id,
    lomId: row.lom_id,
    name: `${row.last_name} ${row.first_name}`,
    email: row.email,
    roles: currentRoles,
  };

  return {
    userId: user.id,
    userEmail: user.email,
    member,
    isAuthenticated: true,
    canManage: currentRoles.some((role) => managementRoles.includes(role)),
    error: assignmentError?.message ?? null,
  };
}

export const authService = { getCurrentAuthContext };
