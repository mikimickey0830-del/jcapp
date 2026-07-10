"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FiscalYear } from "@/types/year";

type YearFormProps = {
  fiscalYears: FiscalYear[];
};

type FormErrors = {
  name?: string;
  startsOn?: string;
  endsOn?: string;
  form?: string;
};

export function YearForm({ fiscalYears }: YearFormProps) {
  const router = useRouter();
  const latestYear = useMemo(
    () => [...fiscalYears].sort((a, b) => b.year - a.year)[0],
    [fiscalYears]
  );
  const nextYear = latestYear ? latestYear.year + 1 : new Date().getFullYear() + 1;
  const [name, setName] = useState(`${nextYear}年度`);
  const [startsOn, setStartsOn] = useState(`${nextYear}-01-01`);
  const [endsOn, setEndsOn] = useState(`${nextYear}-12-31`);
  const [copyFromFiscalYearId, setCopyFromFiscalYearId] = useState(latestYear?.id ?? "");
  const [copyCommittees, setCopyCommittees] = useState(true);
  const [copyPositions, setCopyPositions] = useState(true);
  const [copyAssignments, setCopyAssignments] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const copySource = fiscalYears.find((year) => year.id === copyFromFiscalYearId);

  function validate() {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = "年度名を入力してください。";
    }

    if (!startsOn) {
      nextErrors.startsOn = "開始日を入力してください。";
    }

    if (!endsOn) {
      nextErrors.endsOn = "終了日を入力してください。";
    }

    if (startsOn && endsOn && startsOn > endsOn) {
      nextErrors.endsOn = "終了日は開始日以降にしてください。";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const response = await fetch("/api/years", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          startsOn,
          endsOn,
          copyFromFiscalYearId: copyFromFiscalYearId || null,
          copyCommittees,
          copyPositions,
          copyAssignments
        })
      });

      const result = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !result.id) {
        setErrors({ form: result.error ?? "年度を保存できませんでした。" });
        return;
      }

      router.push(`/years/${result.id}`);
      router.refresh();
    } catch {
      setErrors({ form: "通信エラーが発生しました。時間をおいて再度お試しください。" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {errors.form ? (
        <section className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
          {errors.form}
        </section>
      ) : null}

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">年度基本情報</h2>
        <div className="mt-4 space-y-3">
          <TextField error={errors.name} label="年度名" name="name" onChange={setName} value={name} />
          <TextField label="LOM" name="lomName" readOnly value={latestYear?.lomName ?? "玉島青年会議所"} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              error={errors.startsOn}
              label="開始日"
              name="startsOn"
              onChange={setStartsOn}
              type="date"
              value={startsOn}
            />
            <TextField
              error={errors.endsOn}
              label="終了日"
              name="endsOn"
              onChange={setEndsOn}
              type="date"
              value={endsOn}
            />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">前年度コピー</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          コピー元の役職、委員会、会員ごとの年度所属と権限を、新年度の初期データとして保存します。
        </p>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">コピー元年度</span>
          <select
            className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
            onChange={(event) => setCopyFromFiscalYearId(event.target.value)}
            value={copyFromFiscalYearId}
          >
            <option value="">コピーしない</option>
            {fiscalYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 grid gap-2">
          <CheckRow checked={copyPositions} label="役職マスタをコピー" onChange={setCopyPositions} />
          <CheckRow checked={copyCommittees} label="委員会マスタをコピー" onChange={setCopyCommittees} />
          <CheckRow checked={copyAssignments} label="会員ごとの年度所属と権限をコピー" onChange={setCopyAssignments} />
        </div>

        {copySource ? (
          <div className="mt-4 rounded-md bg-jc-sky p-3">
            <p className="text-xs font-semibold text-slate-500">コピー予定</p>
            <p className="mt-1 text-sm font-bold text-jc-navy">
              役職 {copySource.positions.length}件 / 委員会 {copySource.committees.length}件 / 年度所属{" "}
              {copySource.assignments.length}件
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-md border border-dashed border-jc-line bg-slate-50 p-4">
        <h2 className="text-base font-bold text-jc-navy">作成後に確認する情報</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          コピーされた内容は年度詳細画面と年度所属管理で確認できます。必要に応じて役職、委員会、複数委員会所属を調整してください。
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          className="flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700"
          href="/years"
        >
          キャンセル
        </Link>
        <button
          className="min-h-12 rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "保存中..." : "新年度を作成"}
        </button>
      </div>
    </form>
  );
}

function TextField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  readOnly = false
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange?: (value: string) => void;
  error?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:text-slate-500"
        name={name}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readOnly}
        type={type}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function CheckRow({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-md border border-jc-line bg-slate-50 px-3">
      <input
        checked={checked}
        className="size-5 accent-jc-blue"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </label>
  );
}
