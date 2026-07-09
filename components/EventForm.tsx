import Link from "next/link";
import { useSchedule } from "@/hooks/useSchedule";
import { useYears } from "@/hooks/useYears";
import type { ScheduleEvent } from "@/types/schedule";

type EventFormProps = {
  mode: "create" | "edit";
  event?: ScheduleEvent;
};

export function EventForm({ mode, event }: EventFormProps) {
  const isEdit = mode === "edit";
  const { eventTypeLabels } = useSchedule();
  const { fiscalYears } = useYears();

  return (
    <form className="space-y-5">
      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">イベント基本情報</h2>
        <div className="mt-4 space-y-3">
          <TextField defaultValue={event?.title ?? "新規イベント"} label="イベント名" name="title" />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">年度</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={String(event?.fiscalYear ?? 2026)}
              name="fiscalYear"
            >
              {fiscalYears.map((year) => (
                <option key={year.year} value={year.year}>
                  {year.name} / {year.lomName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">種別</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={event?.eventType ?? "regular_meeting"}
              name="eventType"
            >
              {Object.entries(eventTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <TextField defaultValue={event?.date ?? "2026-08-20"} label="開催日" name="date" type="date" />
          <div className="grid grid-cols-2 gap-3">
            <TextField defaultValue={event?.startTime ?? "19:00"} label="開始時間" name="startTime" type="time" />
            <TextField defaultValue={event?.endTime ?? "21:00"} label="終了時間" name="endTime" type="time" />
          </div>
          <TextField defaultValue={event?.venue ?? ""} label="会場" name="venue" />
          <TextField defaultValue={event?.address ?? ""} label="住所" name="address" />
          <TextField defaultValue={event?.targetAudience ?? "全会員"} label="対象者" name="targetAudience" />
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">説明・出欠</h2>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">説明</span>
          <textarea
            className="min-h-28 w-full rounded-md border border-jc-line bg-slate-50 px-3 py-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
            defaultValue={event?.description ?? ""}
            name="description"
          />
        </label>

        <label className="mt-4 flex min-h-12 items-center gap-3 rounded-md border border-jc-line bg-slate-50 px-3">
          <input
            className="size-5 accent-jc-blue"
            defaultChecked={event?.requiresAttendance ?? true}
            name="requiresAttendance"
            type="checkbox"
          />
          <span className="text-sm font-semibold text-slate-700">出欠確認を行う</span>
        </label>

        <div className="mt-3">
          <TextField
            defaultValue={event?.attendanceDeadline ?? "2026-08-15"}
            label="出欠返信期限"
            name="attendanceDeadline"
            type="date"
          />
        </div>
      </section>

      <section className="rounded-md border border-dashed border-jc-line bg-jc-sky p-4">
        <h2 className="text-base font-bold text-jc-navy">年度連動</h2>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          イベントは年度とLOMに紐づきます。対象者や出欠対象は、後続フェーズで年度別所属・権限と連動します。
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          className="flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700"
          href={isEdit && event ? `/schedule/${event.id}` : "/schedule"}
        >
          キャンセル
        </Link>
        <button className="min-h-12 rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft" type="button">
          {isEdit ? "更新する" : "作成する"}
        </button>
      </div>
    </form>
  );
}

function TextField({
  label,
  name,
  type = "text",
  defaultValue
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        defaultValue={defaultValue}
        name={name}
        type={type}
      />
    </label>
  );
}
