"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { isValidMemberPassword, passwordRequirementMessage } from "@/lib/auth/passwordPolicy";

export function ChangeInitialPasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("現在の初期パスワードを入力してください。");
      return;
    }
    if (!isValidMemberPassword(newPassword)) {
      setError(passwordRequirementMessage);
      return;
    }
    if (newPassword !== confirmation) {
      setError("新しいパスワードと確認用パスワードが一致しません。");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/change-initial-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok || result.error) {
        setError(result.error ?? "パスワード変更を完了できませんでした。もう一度お試しください。");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。時間をおいてもう一度お試しください。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-slate-50 px-5 py-6">
      <div className="flex justify-end"><LogoutButton /></div>
      <section className="mt-8 rounded-md border border-jc-line bg-white p-5 shadow-soft">
        <p className="text-sm font-bold text-jc-blue">Tamashima Junior Chamber</p>
        <h1 className="mt-3 text-2xl font-bold text-jc-navy">初回パスワード変更</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          初期パスワードの変更が完了するまで、JC-Appの通常画面は利用できません。
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {error ? <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-800" role="alert">{error}</p> : null}
          <PasswordField autoComplete="current-password" label="現在の初期パスワード" onChange={setCurrentPassword} value={currentPassword} />
          <PasswordField autoComplete="new-password" label="新しいパスワード" onChange={setNewPassword} value={newPassword} />
          <PasswordField autoComplete="new-password" label="新しいパスワード（確認）" onChange={setConfirmation} value={confirmation} />
          <p className="rounded-md bg-jc-sky p-3 text-xs leading-5 text-slate-700">
            {passwordRequirementMessage}
          </p>
          <button
            className="min-h-12 w-full rounded-md bg-jc-blue px-4 text-base font-bold text-white disabled:bg-slate-400"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "変更中..." : "パスワードを変更して利用開始"}
          </button>
        </form>
      </section>
    </main>
  );
}

function PasswordField({
  autoComplete,
  label,
  onChange,
  value,
}: {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        autoComplete={autoComplete}
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        required
        type="password"
        value={value}
      />
    </label>
  );
}
