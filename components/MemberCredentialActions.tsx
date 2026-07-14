"use client";

import { useState } from "react";

type Credentials = {
  memberId: string;
  memberName: string;
  loginId: string;
  initialPassword: string;
};

export function MemberCredentialActions({
  memberId,
  hasAuthAccount,
  canManage,
}: {
  memberId: string;
  hasAuthAccount: boolean;
  canManage: boolean;
}) {
  const [isSending, setIsSending] = useState(false);
  const [confirmReissue, setConfirmReissue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  async function issue(action: "issue" | "reissue") {
    setIsSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/members/${memberId}/initial-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = (await response.json()) as { credentials?: Credentials; error?: string };
      if (!response.ok || !result.credentials) {
        setError(result.error ?? "初期パスワードを発行できませんでした。");
        return;
      }
      setCredentials(result.credentials);
      setConfirmReissue(false);
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setIsSending(false);
    }
  }

  if (!canManage) return null;

  return (
    <section className="mb-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-jc-navy">初期ログイン情報</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">全会員共通の初期パスワードを発行します。初回ログイン後に必ず変更してください。</p>

      {credentials ? <CredentialsPanel credentials={credentials} onClose={() => setCredentials(null)} /> : null}

      {!credentials && !hasAuthAccount ? (
        <button className="mt-3 min-h-12 w-full rounded-md bg-jc-blue px-4 text-sm font-bold text-white disabled:bg-slate-400" disabled={isSending} onClick={() => issue("issue")} type="button">
          {isSending ? "発行中..." : "初期パスワードを発行"}
        </button>
      ) : null}

      {!credentials && hasAuthAccount ? (
        <>
          <button className="mt-3 min-h-12 w-full rounded-md border border-rose-300 bg-white px-4 text-sm font-bold text-rose-700 disabled:bg-slate-100" disabled={isSending} onClick={() => setConfirmReissue(true)} type="button">
            初期パスワードを再発行
          </button>
          {confirmReissue ? (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              <p>現在のログイン情報は無効になります。新しい初期パスワードを発行しますか？</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="min-h-11 rounded-md border border-amber-300 bg-white font-bold" onClick={() => setConfirmReissue(false)} type="button">キャンセル</button>
                <button className="min-h-11 rounded-md bg-rose-600 font-bold text-white disabled:bg-rose-300" disabled={isSending} onClick={() => issue("reissue")} type="button">再発行する</button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      {error ? <p className="mt-3 text-sm font-medium text-rose-700" role="alert">{error}</p> : null}
    </section>
  );
}

function CredentialsPanel({ credentials, onClose }: { credentials: Credentials; onClose: () => void }) {
  return (
    <div className="mt-4 space-y-3 rounded-md border border-blue-200 bg-jc-sky p-3 print:border-0">
      <p className="text-sm font-bold text-jc-navy">{credentials.memberName} さんの初期ログイン情報</p>
      <p className="text-xs leading-5 text-amber-800">全会員共通の初期パスワードです。速やかに変更してください。この画面を閉じると再表示できません。</p>
      <CopyRow label="ログインID" value={credentials.loginId} />
      <CopyRow label="初期パスワード" value={credentials.initialPassword} />
      <p className="text-xs leading-5 text-slate-700">本人は初回ログイン後に必ずパスワードを変更します。</p>
      <div className="grid grid-cols-2 gap-2 print:hidden">
        <button className="min-h-11 rounded-md border border-jc-line bg-white text-sm font-bold text-slate-700" onClick={() => window.print()} type="button">印刷</button>
        <button className="min-h-11 rounded-md bg-jc-blue text-sm font-bold text-white" onClick={onClose} type="button">閉じる</button>
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  }
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all text-sm font-bold text-slate-900">{value}</code>
        <button className="min-h-10 shrink-0 rounded-md border border-jc-line px-3 text-xs font-bold text-jc-blue print:hidden" onClick={copy} type="button">{copied ? "コピー済み" : "コピー"}</button>
      </div>
    </div>
  );
}
