import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AuthContext, AuthMember } from "@/types/auth";
import type { AnnualRole } from "@/types/common";

const managementRoles: AnnualRole[] = ["admin", "president", "secretary"];

type MemberRow = {
  id: string;
  auth_user_id: string;
  lom_id: string;
  last_name: string;
  first_name: string;
  email: string;
};

type AssignmentRow = { role: AnnualRole; is_active: boolean };

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

  const { data: memberData, error: memberError } = await supabase
    .from("members")
    .select("id, auth_user_id, lom_id, last_name, first_name, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (memberError || !memberData) {
    return {
      userId: user.id,
      userEmail: user.email,
      isAuthenticated: true,
      canManage: false,
      error: memberError?.message ?? null,
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
    authUserId: row.auth_user_id,
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
