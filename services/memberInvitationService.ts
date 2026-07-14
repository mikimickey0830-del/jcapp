import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AuthMember } from "@/types/auth";
import type { InvitationStatus } from "@/types/member";

type InvitationMemberRow = {
  id: string;
  lom_id: string;
  email: string;
  auth_user_id: string | null;
  invitation_status: InvitationStatus | null;
};

type InvitationAction = "invited" | "resent" | "failed";

type InviteResult =
  | { ok: true; status: InvitationStatus; message: string }
  | { ok: false; status: number; message: string };

type ActivateResult =
  | { ok: true; memberId: string; alreadyActive: boolean }
  | { ok: false; status: number; message: string };

type PasswordSetupEmailResult =
  | { ok: true }
  | { ok: false; message: string };

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return value ? value.replace(/\/$/, "") : null;
}

function invitationErrorMessage(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : null;

  if (code === "over_email_send_rate_limit") {
    return "招待メールの送信上限に達しました。時間をおいてから再送してください。";
  }
  if (code === "email_address_invalid") {
    return "Supabaseがメールアドレスを受け付けませんでした。会員情報を確認してください。";
  }

  return "招待メールを送信できませんでした。メールアドレスとSupabase設定を確認してください。";
}

function isExistingAuthUserError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  return code === "email_exists";
}

async function getInvitationMember(memberId: string) {
  const supabase = createClient();
  if (!supabase) return { data: null, error: "Supabaseの設定が見つかりません。" };

  const { data, error } = await supabase
    .from("members")
    .select("id, lom_id, email, auth_user_id, invitation_status")
    .eq("id", memberId)
    .maybeSingle();

  return { data: data as InvitationMemberRow | null, error: error?.message ?? null };
}

async function recordInvitation(memberId: string, action: InvitationAction) {
  const supabase = createClient();
  if (!supabase) return false;

  const { data, error } = await supabase.rpc("record_member_invitation", {
    p_member_id: memberId,
    p_action: action,
  });

  return !error && data === true;
}

async function sendPasswordSetupEmail(email: string, redirectTo: string): Promise<PasswordSetupEmailResult> {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Supabaseの設定が見つかりません。" };

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail(email), { redirectTo });
  if (error) return { ok: false, message: invitationErrorMessage(error) };

  return { ok: true };
}

async function inviteMember(memberId: string, actor: AuthMember, resend: boolean): Promise<InviteResult> {
  const admin = createAdminClient();
  const redirectBaseUrl = siteUrl();
  if (!admin || !redirectBaseUrl) {
    return {
      ok: false,
      status: 500,
      message: "招待メールの設定が完了していません。管理者へ連絡してください。",
    };
  }

  // The request session performs the member lookup, so production RLS still
  // scopes the action to the signed-in administrator's LOM.
  const memberResult = await getInvitationMember(memberId);
  const member = memberResult.data;
  if (memberResult.error || !member) {
    return { ok: false, status: 404, message: "対象会員が見つかりません。" };
  }
  if (member.lom_id !== actor.lomId) {
    return { ok: false, status: 403, message: "他LOMの会員には招待を送信できません。" };
  }
  if (!member.email.trim()) {
    return { ok: false, status: 400, message: "メールアドレス未登録のため招待できません。" };
  }
  if (member.auth_user_id) {
    return { ok: false, status: 409, message: "この会員はすでに利用開始済みです。" };
  }
  if (member.invitation_status === "invited" && !resend) {
    return { ok: false, status: 409, message: "すでに招待送信済みです。必要な場合は招待を再送してください。" };
  }

  const action: InvitationAction = resend ? "resent" : "invited";
  const redirectTo = `${redirectBaseUrl}/auth/callback?next=/auth/accept-invite`;

  // Supabase creates the Auth user when the first invite is sent. A later
  // resend must use password recovery instead of creating the user again.
  if (resend && member.invitation_status === "invited") {
    const recoveryResult = await sendPasswordSetupEmail(member.email, redirectTo);
    if (!recoveryResult.ok) {
      return { ok: false, status: 502, message: recoveryResult.message };
    }
    if (!(await recordInvitation(member.id, action))) {
      return { ok: false, status: 500, message: "再送メールは送信されましたが、招待状態を記録できませんでした。" };
    }
    return { ok: true, status: "invited", message: "パスワード設定メールを再送しました。" };
  }

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(normalizedEmail(member.email), {
    data: {
      member_id: member.id,
      lom_id: member.lom_id,
      invited_by: actor.authUserId,
    },
    redirectTo,
  });

  if (inviteError) {
    // A partially completed invite already has an Auth user. Its member row
    // may be marked failed after an earlier mail error, so detect Auth's
    // email_exists response instead of relying only on invitation_status.
    if (isExistingAuthUserError(inviteError)) {
      const recoveryResult = await sendPasswordSetupEmail(member.email, redirectTo);
      if (recoveryResult.ok && (await recordInvitation(member.id, action))) {
        return { ok: true, status: "invited", message: "パスワード設定メールを再送しました。" };
      }
      if (!recoveryResult.ok) {
        return { ok: false, status: 502, message: recoveryResult.message };
      }
    }
    await recordInvitation(member.id, "failed");
    return {
      ok: false,
      status: 502,
      message: invitationErrorMessage(inviteError),
    };
  }

  if (!(await recordInvitation(member.id, action))) {
    return {
      ok: false,
      status: 500,
      message: "招待メールは送信されましたが、招待状態を記録できませんでした。",
    };
  }

  return {
    ok: true,
    status: "invited",
    message: resend ? "招待メールを再送しました。" : "招待メールを送信しました。",
  };
}

async function activateInvitation(input: {
  authUserId: string;
  email: string | undefined;
  userMetadata: unknown;
}): Promise<ActivateResult> {
  const supabase = createClient();
  if (!supabase || !input.email) {
    return { ok: false, status: 400, message: "ログイン会員情報を確認できません。" };
  }

  // The RPC verifies invite metadata against the signed-in email, updates the
  // protected member fields, and records the activation audit log atomically.
  const { data: memberId, error } = await supabase.rpc("activate_current_member_invitation");
  if (error || !memberId) {
    return { ok: false, status: 403, message: "有効な招待情報を確認できません。管理者へ連絡してください。" };
  }

  return { ok: true, memberId, alreadyActive: false };
}

export const memberInvitationService = { inviteMember, activateInvitation };
