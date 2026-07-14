"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Member, MemberStatus } from "@/types/member";

type MemberFormProps = { mode: "create" | "edit"; member?: Member };

type MemberFormValues = {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  email: string;
  phone: string;
  joinedYear: string;
  status: MemberStatus;
  issueAccount: boolean;
};

type InitialCredentials = {
  memberId: string;
  memberName: string;
  loginId: string;
  initialPassword: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function MemberForm({ mode, member }: MemberFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<InitialCredentials | null>(null);
  const [values, setValues] = useState<MemberFormValues>({
    lastName: member?.lastName ?? "",
    firstName: member?.firstName ?? "",
    lastNameKana: member?.lastNameKana ?? "",
    firstNameKana: member?.firstNameKana ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    joinedYear: String(member?.joinedYear ?? 2026),
    status: member?.status ?? "active",
    issueAccount: !isEdit,
  });

  function updateValue(name: keyof MemberFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function validate() {
    if (!values.lastName.trim() || !values.firstName.trim()) return "氏名は必須です。";
    if (!emailPattern.test(values.email.trim())) return "メールアドレスの形式を確認してください。";
    if (!Number.isInteger(Number(values.joinedYear))) return "入会年度は数値で入力してください。";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);
    const endpoint = isEdit && member ? `/api/members/${member.id}` : "/api/members";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, joinedYear: Number(values.joinedYear) }),
      });
      const result = (await response.json()) as { id?: string; error?: string; credentials?: InitialCredentials };
      if (!response.ok || result.error) {
        setError(result.error ?? "会員情報を保存できませんでした。");
        return;
      }

      if (!isEdit && result.credentials) {
        // The only in-browser copy of this password is component state.
        setCredentials(result.credentials);
        return;
      }

      router.push(isEdit && member ? `/members/${member.id}` : `/members/${result.id ?? ""}`);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setIsSaving(false);
    }
  }

  if (credentials) {
    return <InitialCredentialsNotice credentials={credentials} onClose={() => router.push(`/members/${credentials.memberId}`)} />;
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? <section className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-700">{error}</section> : null}

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">会員基本情報</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">年度をまたいで引き継ぐ会員情報です。役職・委員会・権限は年度所属管理で扱います。</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <TextField label="姓" name="lastName" onChange={updateValue} required value={values.lastName} />
          <TextField label="名" name="firstName" onChange={updateValue} required value={values.firstName} />
          <TextField label="姓フリガナ" name="lastNameKana" onChange={updateValue} value={values.lastNameKana} />
          <TextField label="名フリガナ" name="firstNameKana" onChange={updateValue} value={values.firstNameKana} />
        </div>
        <div className="mt-3 space-y-3">
          <TextField label="メールアドレス" name="email" onChange={updateValue} required type="email" value={values.email} />
          <TextField label="電話番号" name="phone" onChange={updateValue} type="tel" value={values.phone} />
          <TextField label="入会年度" name="joinedYear" onChange={updateValue} required type="number" value={values.joinedYear} />
        </div>
        <label className="mt-3 block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">ステータス</span>
          <select
            className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
            onChange={(event) => updateValue("status", event.target.value)}
            value={values.status}
          >
            <option value="active">在籍</option>
            <option value="inactive">休会</option>
            <option value="graduated">卒業</option>
          </select>
        </label>
      </section>

      {!isEdit ? (
        <section className="rounded-md border border-blue-200 bg-jc-sky p-4">
          <label className="flex min-h-12 items-center gap-3">
            <input
              checked={values.issueAccount}
              className="size-5 accent-jc-blue"
              onChange={(event) => updateValue("issueAccount", event.target.checked)}
              type="checkbox"
            />
            <span className="text-sm font-bold text-jc-navy">アカウントを同時発行する</span>
          </label>
          <p className="mt-2 text-xs leading-5 text-slate-700">初期パスワードを自動発行し、登録完了後に一度だけ表示します。</p>
        </section>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Link className="flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700" href={isEdit && member ? `/members/${member.id}` : "/members"}>キャンセル</Link>
        <button className="min-h-12 rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft disabled:cursor-not-allowed disabled:bg-slate-400" disabled={isSaving} type="submit">
          {isSaving ? "保存中..." : isEdit ? "更新する" : "登録する"}
        </button>
      </div>
    </form>
  );
}

function InitialCredentialsNotice({ credentials, onClose }: { credentials: InitialCredentials; onClose: () => void }) {
  return (
    <section className="space-y-4 rounded-md border border-jc-line bg-white p-5 shadow-soft print:shadow-none">
      <div>
        <p className="text-sm font-bold text-jc-blue">アカウント発行完了</p>
        <h2 className="mt-2 text-xl font-bold text-jc-navy">{credentials.memberName}</h2>
      </div>
      <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">この画面を閉じると、初期パスワードは再表示できません。本人へ安全な方法でお渡しください。</p>
      <CredentialRow label="ログインID" value={credentials.loginId} />
      <CredentialRow label="初期パスワード" value={credentials.initialPassword} />
      <p className="text-sm leading-6 text-slate-700">初回ログイン後は、必ず新しいパスワードへの変更画面が表示されます。</p>
      <div className="grid grid-cols-2 gap-3 print:hidden">
        <button className="min-h-12 rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700" onClick={() => window.print()} type="button">印刷</button>
        <button className="min-h-12 rounded-md bg-jc-blue px-4 text-sm font-bold text-white" onClick={onClose} type="button">閉じる</button>
      </div>
    </section>
  );
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  }
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all text-sm font-bold text-slate-900">{value}</code>
        <button className="min-h-10 shrink-0 rounded-md border border-jc-line bg-white px-3 text-xs font-bold text-jc-blue print:hidden" onClick={copy} type="button">{copied ? "コピー済み" : "コピー"}</button>
      </div>
    </div>
  );
}

function TextField({ label, name, type = "text", value, required = false, onChange }: {
  label: string;
  name: keyof MemberFormValues;
  type?: string;
  value: string;
  required?: boolean;
  onChange: (name: keyof MemberFormValues, value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100" name={name} onChange={(event) => onChange(name, event.target.value)} required={required} type={type} value={value} />
    </label>
  );
}
