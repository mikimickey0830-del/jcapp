import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AuthMember } from "@/types/auth";
import type { InvitationStatus } from "@/types/member";

type InvitationMemberRow = {
  id: string;
  lom_id: string;
  email: string;
  auth_user_id: string | null;
  invitation_status: InvitationStatus | null;
};

type InvitationAction = "invited" | "resent" | "activated" | "failed";

type InviteResult =
  | { ok: true; status: InvitationStatus; message: string }
  | { ok: false; status: number; message: string };

type ActivateResult =
  | { ok: true; memberId: string; alreadyActive: boolean }
  | { ok: false; status: number; message: string };

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return value ? value.replace(/\/$/, "") : null;
}

async function writeAuditLog(
  action: InvitationAction,
  memberId: string | null,
  actorAuthUserId: string | null,
  metadata: Record<string, string | boolean | null>,
) {
  const admin = createAdminClient();
  if (!admin) return;

  // Audit logging must never make invitation delivery unavailable.
  await admin.from("auth_invitation_audit_logs").insert({
    action,
    member_id: memberId,
    actor_auth_user_id: actorAuthUserId,
    metadata,
  });
}

async function getInvitationMember(memberId: string) {
  const admin = createAdminClient();
  if (!admin) return { data: null, error: "招待用のSupabase Secret keyが未設定です。" };

  const { data, error } = await admin
    .from("members")
    .select("id, lom_id, email, auth_user_id, invitation_status")
    .eq("id", memberId)
    .maybeSingle();

  return { data: data as InvitationMemberRow | null, error: error?.message ?? null };
}

async function inviteMember(memberId: string, actor: AuthMember, resend: boolean): Promise<InviteResult> {
  const admin = createAdminClient();
  const redirectBaseUrl = siteUrl();
  if (!admin || !redirectBaseUrl) {
    return {
      ok: false,
      status: 500,
      message: "招待メールの設定が完了していません。管理者は環境変数を確認してください。",
    };
  }

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
    return { ok: false, status: 409, message: "すでに招待済みです。必要な場合は招待を再送してください。" };
  }

  const action: InvitationAction = resend ? "resent" : "invited";
  const redirectTo = `${redirectBaseUrl}/auth/callback?next=/auth/accept-invite`;
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(normalizedEmail(member.email), {
    data: {
      member_id: member.id,
      lom_id: member.lom_id,
      invited_by: actor.authUserId,
    },
    redirectTo,
  });

  if (inviteError) {
    await admin
      .from("members")
      .update({ invitation_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", member.id);
    await writeAuditLog("failed", member.id, actor.authUserId, { reason: "invite_api_error" });
    return { ok: false, status: 502, message: "招待メールを送信できませんでした。メールアドレスとSupabase設定を確認してください。" };
  }

  const sentAt = new Date().toISOString();
  const invitationUpdate: {
    invitation_status: InvitationStatus;
    invitation_last_sent_at: string;
    updated_at: string;
    invited_at?: string;
  } = {
    invitation_status: "invited",
    invitation_last_sent_at: sentAt,
    updated_at: sentAt,
  };
  if (member.invitation_status !== "invited") {
    invitationUpdate.invited_at = sentAt;
  }

  const { error: updateError } = await admin
    .from("members")
    .update(invitationUpdate)
    .eq("id", member.id);

  if (updateError) {
    await writeAuditLog("failed", member.id, actor.authUserId, { reason: "status_update_error" });
    return { ok: false, status: 500, message: "招待メールは送信されましたが、招待状態を保存できませんでした。" };
  }

  await writeAuditLog(action, member.id, actor.authUserId, { resend, email: normalizedEmail(member.email) });
  return {
    ok: true,
    status: "invited",
    message: resend ? "招待メールを再送しました。" : "招待メールを送信しました。",
  };
}

function getMetadataValue(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

async function activateInvitation(input: {
  authUserId: string;
  email: string | undefined;
  userMetadata: unknown;
}): Promise<ActivateResult> {
  const admin = createAdminClient();
  const email = input.email ? normalizedEmail(input.email) : null;
  if (!admin || !email) {
    return { ok: false, status: 400, message: "招待リンクの会員情報を確認できません。" };
  }

  const metadataMemberId = getMetadataValue(input.userMetadata, "member_id");
  const metadataLomId = getMetadataValue(input.userMetadata, "lom_id");
  let member: InvitationMemberRow | null = null;

  if (metadataMemberId) {
    const result = await getInvitationMember(metadataMemberId);
    member = result.data;
    // Metadata is only accepted when it also matches the invited email and LOM.
    if (!member || member.lom_id !== metadataLomId || normalizedEmail(member.email) !== email) {
      member = null;
    }
  }

  if (!member) {
    const { data, error } = await admin
      .from("members")
      .select("id, lom_id, email, auth_user_id, invitation_status")
      .eq("email", email);
    const matches = (data ?? []) as InvitationMemberRow[];
    if (error || matches.length !== 1) {
      return {
        ok: false,
        status: matches.length > 1 ? 409 : 404,
        message: matches.length > 1
          ? "同じメールアドレスの会員情報が複数あります。管理者へ連絡してください。"
          : "会員情報が見つかりません。管理者へ連絡してください。",
      };
    }
    member = matches[0];
  }

  if (member.auth_user_id && member.auth_user_id !== input.authUserId) {
    return { ok: false, status: 409, message: "この会員はすでに別のログインユーザーと紐付いています。" };
  }
  if (!member.auth_user_id && member.invitation_status !== "invited") {
    return { ok: false, status: 403, message: "有効な招待情報を確認できません。管理者へ連絡してください。" };
  }

  const now = new Date().toISOString();
  const activationUpdate = {
    invitation_status: "active" as InvitationStatus,
    activated_at: now,
    updated_at: now,
    ...(member.auth_user_id ? {} : { auth_user_id: input.authUserId }),
  };
  let activationQuery = admin
    .from("members")
    .update(activationUpdate)
    .eq("id", member.id);

  activationQuery = member.auth_user_id
    ? activationQuery.eq("auth_user_id", input.authUserId)
    : activationQuery.is("auth_user_id", null);

  const { data: updatedMember, error: updateError } = await activationQuery.select("id").maybeSingle();

  if (updateError || !updatedMember) {
    return { ok: false, status: 500, message: "会員情報の紐付けに失敗しました。管理者へ連絡してください。" };
  }

  await writeAuditLog("activated", member.id, input.authUserId, { email });
  return { ok: true, memberId: member.id, alreadyActive: member.auth_user_id === input.authUserId };
}

export const memberInvitationService = { inviteMember, activateInvitation };
