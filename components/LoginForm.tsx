"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isTemporarilyLocked, setIsTemporarilyLocked] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isTemporarilyLocked) {
      setError("ログイン試行が多いため、30秒ほど待ってからもう一度お試しください。");
      return;
    }

    if (!email.trim() || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Supabaseの接続設定が見つかりません。");
      return;
    }

    setIsSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("メールアドレスまたはパスワードを確認してください。");
      const nextFailedAttempts = failedAttempts + 1;
      setFailedAttempts(nextFailedAttempts);
      if (nextFailedAttempts >= 5) {
        // This is a UX-only pause. It is intentionally not treated as an
        // authentication security boundary; production protection belongs in
        // Supabase Auth rate limits and CAPTCHA/server-side controls.
        setIsTemporarilyLocked(true);
        window.setTimeout(() => {
          setFailedAttempts(0);
          setIsTemporarilyLocked(false);
        }, 30_000);
      }
      setIsSubmitting(false);
      return;
    }

    const requestedPath = searchParams.get("next");
    const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/";
    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">メールアドレス</span>
        <input
          autoComplete="email"
          className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-4 text-base outline-none transition focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          required
          type="email"
          value={email}
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">パスワード</span>
        <input
          autoComplete="current-password"
          className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-4 text-base outline-none transition focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="パスワード"
          required
          type="password"
          value={password}
        />
      </label>
      <button
        className="flex min-h-12 w-full items-center justify-center rounded-md bg-jc-blue px-4 text-base font-bold text-white shadow-soft transition hover:bg-blue-700 disabled:bg-slate-400"
        disabled={isSubmitting || isTemporarilyLocked}
        type="submit"
      >
        {isSubmitting ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
