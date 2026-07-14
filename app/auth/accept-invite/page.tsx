"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PageState = "checking" | "ready" | "invalid";

function isSamePasswordError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "same_password" || message.includes("different from the old password") || message.includes("same password");
}

function passwordUpdateErrorMessage(error: { code?: string; message?: string }) {
  const code = error.code ?? "unknown";
  const message = error.message?.toLowerCase() ?? "";

  if (code === "weak_password" || message.includes("weak password") || message.includes("password is too weak")) {
    return "そのパスワードは安全性の条件を満たしていません。英字・数字を組み合わせた、推測されにくい8文字以上のパスワードにしてください。";
  }
  if (code === "session_not_found" || message.includes("auth session missing") || message.includes("invalid jwt")) {
    return "パスワード設定用のログイン状態が切れています。管理者に招待メールの再送を依頼し、最新のメールから開いてください。";
  }

  // エラーコードだけを表示し、認証情報や招待リンクは画面へ出さない。
  return `パスワードを設定できませんでした（確認コード: ${code}）。この画面の写真を管理者へ送ってください。`;
}

export default function AcceptInvitePage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setError("Supabaseの設定が見つかりません。管理者へ連絡してください。");
      setPageState("invalid");
      return;
    }

    supabase.auth.getUser().then(({ data, error: userError }) => {
      if (userError || !data.user) {
        setPageState("invalid");
        return;
      }
      setPageState("ready");
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }
    if (password !== confirmation) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Supabaseの設定が見つかりません。管理者へ連絡してください。");
      return;
    }

    setIsSaving(true);
    // 招待リンクのセッションが失効している場合は、更新前に案内する。
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError("パスワード設定用のログイン状態が切れています。管理者に招待メールの再送を依頼し、最新のメールから開いてください。");
      setIsSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError && !isSamePasswordError(updateError)) {
      setError(passwordUpdateErrorMessage(updateError));
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/accept-invite", { method: "POST" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok || result.error) {
        setError(result.error ?? "会員情報を紐付けできませんでした。管理者へ連絡してください。");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] items-center bg-slate-50 px-5 py-8">
      <section className="w-full rounded-md border border-jc-line bg-white p-5 shadow-soft">
        <p className="text-sm font-bold text-jc-blue">Tamashima Junior Chamber</p>
        <h1 className="mt-3 text-2xl font-bold text-jc-navy">利用開始設定</h1>

        {pageState === "checking" ? <p className="mt-5 text-sm text-slate-600">招待リンクを確認しています...</p> : null}
        {pageState === "invalid" ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-800">
              {error ?? "招待リンクが無効、期限切れ、またはすでに利用済みです。管理者に招待メールの再送を依頼してください。"}
            </p>
            <Link className="flex min-h-12 items-center justify-center rounded-md bg-jc-blue px-4 text-sm font-bold text-white" href="/login">
              ログイン画面へ
            </Link>
          </div>
        ) : null}
        {pageState === "ready" ? (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <p className="text-sm leading-6 text-slate-600">新しいパスワードを設定すると、会員情報と自動で紐付けられます。</p>
            {error ? <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p> : null}
            <PasswordField label="新しいパスワード" onChange={setPassword} value={password} />
            <PasswordField label="パスワード（確認）" onChange={setConfirmation} value={confirmation} />
            <button className="min-h-12 w-full rounded-md bg-jc-blue px-4 text-base font-bold text-white disabled:bg-slate-400" disabled={isSaving} type="submit">
              {isSaving ? "設定中..." : "パスワードを設定して利用開始"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        autoComplete="new-password"
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        minLength={8}
        onChange={(event) => onChange(event.target.value)}
        required
        type="password"
        value={value}
      />
    </label>
  );
}
