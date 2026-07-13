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

type AssignmentRow = { role: AnnualRole; is_active: boolean };

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

  // Link a first-time login only when its email identifies one unlinked member.
  // A duplicate email never links automatically, so multi-LOM data stays safe.
  const { data: emailMatches, error: emailLookupError } = await supabase
    .from("members")
    .select("id, auth_user_id, lom_id, last_name, first_name, email")
    .eq("email", user.email.trim().toLowerCase())
    .limit(2);

  if (emailLookupError || !emailMatches || emailMatches.length !== 1) {
    return { member: null, error: emailLookupError?.message ?? null };
  }

  const candidate = emailMatches[0] as MemberRow;
  if (candidate.auth_user_id) {
    return { member: null, error: null };
  }

  const now = new Date().toISOString();
  const { data: linkedByEmail, error: linkError } = await supabase
    .from("members")
    .update({
      auth_user_id: user.id,
      invitation_status: "active",
      activated_at: now,
      updated_at: now,
    })
    .eq("id", candidate.id)
    .is("auth_user_id", null)
    .select("id, auth_user_id, lom_id, last_name, first_name, email")
    .maybeSingle();

  return { member: linkedByEmail as MemberRow | null, error: linkError?.message ?? null };
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
    .select("role, is_active")
    .eq("member_id", row.id)
    .eq("is_active", true);
  const roles = ((assignmentData ?? []) as AssignmentRow[]).map((item) => item.role);
  const member: AuthMember = {
    id: row.id,
    authUserId: row.auth_user_id ?? user.id,
    lomId: row.lom_id,
    name: `${row.last_name} ${row.first_name}`,
    email: row.email,
    roles,
  };

  return {
    userId: user.id,
    userEmail: user.email,
    member,
    isAuthenticated: true,
    canManage: roles.some((role) => managementRoles.includes(role)),
    error: assignmentError?.message ?? null,
  };
}

export const authService = { getCurrentAuthContext };
