"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommitteeDetail, CommitteeFormOptions } from "@/types/committee";

type CommitteeFormProps = {
  mode: "create" | "edit";
  committee?: CommitteeDetail;
  options: CommitteeFormOptions;
};

type FormErrors = {
  fiscalYearId?: string;
  name?: string;
  form?: string;
};

export function CommitteeForm({ mode, committee, options }: CommitteeFormProps) {
  const router = useRouter();
  const defaultFiscalYear = options.fiscalYears[0];
  const [fiscalYearId, setFiscalYearId] = useState(committee?.fiscalYearId ?? defaultFiscalYear?.id ?? "");
  const [name, setName] = useState(committee?.name ?? "");
  const [description, setDescription] = useState(committee?.description ?? "");
  const [vicePresidentMemberId, setVicePresidentMemberId] = useState(committee?.vicePresidentMemberId ?? "");
  const [chairMemberId, setChairMemberId] = useState(committee?.chairMemberId ?? "");
  const [viceChairMemberId, setViceChairMemberId] = useState(committee?.viceChairMemberId ?? "");
  const [memberIds, setMemberIds] = useState<string[]>(committee?.memberIds ?? []);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const selectedMemberIds = useMemo(
    () => new Set([vicePresidentMemberId, chairMemberId, viceChairMemberId, ...memberIds].filter(Boolean)),
    [chairMemberId, memberIds, viceChairMemberId, vicePresidentMemberId]
  );

  function validate() {
    const nextErrors: FormErrors = {};

    if (!fiscalYearId) {
      nextErrors.fiscalYearId = "年度を選択してください。";
    }

    if (!name.trim()) {
      nextErrors.name = "委員会名を入力してください。";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function toggleMember(memberId: string) {
    setMemberIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSaving(true);
    setErrors({});

    const endpoint = mode === "create" ? "/api/committees" : `/api/committees/${committee?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fiscalYearId,
          name: name.trim(),
          description,
          vicePresidentMemberId,
          chairMemberId,
          viceChairMemberId,
          memberIds
        })
      });

      const result = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !result.id) {
        setErrors({ form: result.error ?? "委員会を保存できませんでした。" });
        return;
      }

      router.push(`/committees/${result.id}`);
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
        <h2 className="text-base font-bold text-jc-navy">基本情報</h2>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">年度</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setFiscalYearId(event.target.value)}
              value={fiscalYearId}
            >
              <option value="">年度を選択</option>
              {options.fiscalYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} / {year.lomName}
                </option>
              ))}
            </select>
            {errors.fiscalYearId ? (
              <span className="mt-1 block text-xs font-semibold text-red-600">{errors.fiscalYearId}</span>
            ) : null}
          </label>

          <TextField error={errors.name} label="委員会名" onChange={setName} value={name} />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">説明</span>
            <textarea
              className="min-h-28 w-full rounded-md border border-jc-line bg-slate-50 px-3 py-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </label>
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">役割</h2>
        <div className="mt-4 space-y-3">
          <MemberSelect
            label="担当副理事長"
            members={options.members}
            onChange={setVicePresidentMemberId}
            value={vicePresidentMemberId}
          />
          <MemberSelect label="委員長" members={options.members} onChange={setChairMemberId} value={chairMemberId} />
          <MemberSelect
            label="副委員長"
            members={options.members}
            onChange={setViceChairMemberId}
            value={viceChairMemberId}
          />
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-jc-navy">委員一覧</h2>
          <span className="rounded-full bg-jc-sky px-3 py-1 text-xs font-bold text-jc-blue">
            {selectedMemberIds.size}名
          </span>
        </div>
        <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {options.members.map((member) => {
            const fullName = `${member.lastName} ${member.firstName}`;
            const checked = selectedMemberIds.has(member.id);

            return (
              <label
                className="flex min-h-14 items-center gap-3 rounded-md border border-jc-line bg-slate-50 px-3"
                key={member.id}
              >
                <input
                  checked={checked}
                  className="size-5 accent-jc-blue"
                  onChange={() => toggleMember(member.id)}
                  type="checkbox"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-800">{fullName}</span>
                  <span className="block truncate text-xs font-semibold text-slate-500">
                    {member.lastNameKana} {member.firstNameKana}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          className="flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700"
          href={committee ? `/committees/${committee.id}` : "/committees"}
        >
          キャンセル
        </Link>
        <button
          className="min-h-12 rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "保存中..." : mode === "create" ? "委員会を作成" : "変更を保存"}
        </button>
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  error
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function MemberSelect({
  label,
  members,
  value,
  onChange
}: {
  label: string;
  members: CommitteeFormOptions["members"];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <select
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">未設定</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.lastName} {member.firstName}
          </option>
        ))}
      </select>
    </label>
  );
}
