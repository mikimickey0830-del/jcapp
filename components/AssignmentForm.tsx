"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignmentRoleLabels } from "@/lib/assignments";
import type { AnnualMemberAssignmentView, AssignmentFormOptions } from "@/types/assignment";
import type { AnnualRole } from "@/types/common";

type AssignmentFormProps = {
  assignment: AnnualMemberAssignmentView;
  options: AssignmentFormOptions;
};

type FormErrors = {
  role?: string;
  form?: string;
};

const roleOptions: AnnualRole[] = ["member", "vice_chair", "chair", "secretary", "president", "admin"];

export function AssignmentForm({ assignment, options }: AssignmentFormProps) {
  const router = useRouter();
  const [committeeId, setCommitteeId] = useState(assignment.committeeId);
  const [positionId, setPositionId] = useState(assignment.positionId);
  const [role, setRole] = useState<AnnualRole>(assignment.role);
  const [isBoardMember, setIsBoardMember] = useState(assignment.isBoardMember);
  const [isActive, setIsActive] = useState(assignment.isActive);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  function validate() {
    const nextErrors: FormErrors = {};

    if (!role) {
      nextErrors.role = "権限を選択してください。";
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
      const response = await fetch(`/api/assignments/${assignment.fiscalYearId}/${assignment.memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          committeeId,
          positionId,
          role,
          isBoardMember,
          isActive
        })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setErrors({ form: result.error ?? "年度所属を保存できませんでした。" });
        return;
      }

      router.push(`/assignments/${assignment.fiscalYearId}`);
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
        <h2 className="text-base font-bold text-jc-navy">対象会員</h2>
        <div className="mt-3 rounded-md bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">{assignment.memberKana}</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{assignment.memberName}</p>
          <p className="mt-1 truncate text-sm text-slate-500">{assignment.memberEmail}</p>
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">年度所属</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {options.fiscalYear.name} / {options.fiscalYear.lomName}
        </p>
        <div className="mt-4 space-y-3">
          <SelectField
            label="所属委員会"
            onChange={setCommitteeId}
            options={options.committees}
            placeholder="未設定"
            value={committeeId}
          />
          <SelectField
            label="役職"
            onChange={setPositionId}
            options={options.positions}
            placeholder="未設定"
            value={positionId}
          />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">権限・区分</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setRole(event.target.value as AnnualRole)}
              value={role}
            >
              {roleOptions.map((item) => (
                <option key={item} value={item}>
                  {assignmentRoleLabels[item]}
                </option>
              ))}
            </select>
            {errors.role ? <span className="mt-1 block text-xs font-semibold text-red-600">{errors.role}</span> : null}
          </label>
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">状態</h2>
        <div className="mt-4 grid gap-2">
          <CheckRow checked={isBoardMember} label="理事・役員として扱う" onChange={setIsBoardMember} />
          <CheckRow checked={isActive} label="この年度所属を有効にする" onChange={setIsActive} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          className="flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700"
          href={`/assignments/${assignment.fiscalYearId}`}
        >
          キャンセル
        </Link>
        <button
          className="min-h-12 rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "保存中..." : "変更を保存"}
        </button>
      </div>
    </form>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string }>;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <select
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
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
