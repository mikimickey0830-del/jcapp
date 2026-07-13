"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InvitationStatus } from "@/types/member";

const statusLabels: Record<InvitationStatus, string> = {
  not_invited: "未招待",
  invited: "招待済み",
  active: "利用開始済み",
  failed: "送信失敗",
};

const statusClasses: Record<InvitationStatus, string> = {
  not_invited: "bg-slate-100 text-slate-700",
  invited: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800",
};

type MemberInvitationActionsProps = {
  memberId: string;
  email: string;
  authUserId?: string;
  invitationStatus?: InvitationStatus;
  canManage: boolean;
  compact?: boolean;
};

export function MemberInvitationActions({
  memberId,
  email,
  authUserId,
  invitationStatus = authUserId ? "active" : "not_invited",
  canManage,
  compact = false,
}: MemberInvitationActionsProps) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasEmail = Boolean(email.trim());
  const isActive = Boolean(authUserId) || invitationStatus === "active";
  const isResend = invitationStatus === "invited";

  async function sendInvite() {
    if (!hasEmail || isActive || isSending) return;
    setIsSending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/members/${memberId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resend: isResend }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok || result.error) {
        setError(result.error ?? "招待メールを送信できませんでした。")
        return;
      }
      setMessage(result.message ?? "招待メールを送信しました。")
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className={compact ? "mt-3" : "mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className={compact ? "text-sm font-bold text-jc-navy" : "text-base font-bold text-jc-navy"}>アカウント招待</h2>
          <p className="mt-1 text-xs text-slate-500">{hasEmail ? email : "メールアドレス未登録"}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses[isActive ? "active" : invitationStatus]}`}>
          {statusLabels[isActive ? "active" : invitationStatus]}
        </span>
      </div>

      {canManage && !isActive ? (
        <button
          className="mt-3 min-h-11 w-full rounded-md bg-jc-blue px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={!hasEmail || isSending}
          onClick={sendInvite}
          type="button"
        >
          {!hasEmail ? "メールアドレス未登録" : isSending ? "送信中..." : isResend ? "招待メールを再送" : "招待メールを送る"}
        </button>
      ) : null}

      {!canManage && !compact ? <p className="mt-3 text-sm text-slate-600">招待メールの送信は管理者のみ実行できます。</p> : null}
      {message ? <p className="mt-3 text-sm font-medium text-emerald-700" role="status">{message}</p> : null}
      {error ? <p className="mt-3 text-sm font-medium text-rose-700" role="alert">{error}</p> : null}
    </section>
  );
}
