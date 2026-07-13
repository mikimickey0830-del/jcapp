"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AttendanceRow, AttendanceStatus } from "@/types/attendance";

type AttendanceResponseFormProps = {
  eventId: string;
  rows: AttendanceRow[];
  currentMemberId: string;
  canManage?: boolean;
};

const responseOptions: Array<{ status: AttendanceStatus; label: string; symbol: string; className: string }> = [
  { status: "attending", label: "出席", symbol: "○", className: "bg-emerald-600 text-white" },
  { status: "late", label: "遅刻", symbol: "△", className: "bg-amber-500 text-white" },
  { status: "absent", label: "欠席", symbol: "×", className: "bg-rose-600 text-white" },
];

export function AttendanceResponseForm({ eventId, rows, currentMemberId, canManage = false }: AttendanceResponseFormProps) {
  const router = useRouter();
  const initialMemberId = rows.some((row) => row.memberId === currentMemberId)
    ? currentMemberId
    : canManage
      ? rows[0]?.memberId ?? ""
      : "";
  const [memberId, setMemberId] = useState(initialMemberId);
  const selectedRow = useMemo(() => rows.find((row) => row.memberId === memberId), [memberId, rows]);
  const [status, setStatus] = useState<AttendanceStatus>(selectedRow?.status !== "unanswered" ? selectedRow?.status ?? "attending" : "attending");
  const [comment, setComment] = useState(selectedRow?.comment ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleMemberChange(nextMemberId: string) {
    const row = rows.find((item) => item.memberId === nextMemberId);
    setMemberId(nextMemberId);
    setStatus(row?.status !== "unanswered" ? row?.status ?? "attending" : "attending");
    setComment(row?.comment ?? "");
  }

  async function handleSubmit() {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/attendance/${eventId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, status, comment }),
      });
      const result = (await response.json()) as { error?: string; eventId?: string };
      if (!response.ok) {
        setError(result.error ?? "出欠回答を保存できませんでした。");
        return;
      }
      router.push(`/attendance/${result.eventId ?? eventId}`);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setIsSaving(false);
    }
  }

  if (!memberId || !selectedRow) {
    return (
      <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        このイベントの出欠回答対象に登録されていません。
      </p>
    );
  }

  return (
    <section className="mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-jc-navy">出欠回答</h2>
      {error ? <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {canManage ? (
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">回答する会員</span>
          <select className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base" value={memberId} onChange={(event) => handleMemberChange(event.target.value)}>
            {rows.map((row) => <option key={row.memberId} value={row.memberId}>{row.memberName}</option>)}
          </select>
        </label>
      ) : (
        <p className="mt-3 text-sm font-semibold text-slate-700">{selectedRow.memberName}</p>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {responseOptions.map((option) => (
          <button className={`min-h-16 rounded-md px-2 text-center text-sm font-bold ${status === option.status ? option.className : "border border-jc-line bg-slate-50 text-slate-700"}`} key={option.status} onClick={() => setStatus(option.status)} type="button">
            <span className="block text-2xl leading-6">{option.symbol}</span>{option.label}
          </button>
        ))}
      </div>
      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">コメント</span>
        <textarea className="min-h-28 w-full rounded-md border border-jc-line bg-slate-50 px-3 py-3 text-base" placeholder="遅刻時間や欠席理由などを入力できます。" value={comment} onChange={(event) => setComment(event.target.value)} />
      </label>
      <button className="mt-4 min-h-12 w-full rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft disabled:bg-slate-400" disabled={isSaving} onClick={handleSubmit} type="button">
        {isSaving ? "送信中..." : "送信"}
      </button>
    </section>
  );
}
