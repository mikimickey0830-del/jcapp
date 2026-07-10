import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { attendanceService } from "@/services/attendanceService";
import { scheduleService } from "@/services/scheduleService";

// Attendance status changes throughout the day and must not be statically cached.
export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  noStore();
  const result = await attendanceService.getAttendanceEvents();
  const events = result.data;

  return (
    <AppShell>
      <PageHeader
        description="イベントごとの出欠回答、未回答、期限超過、回答率を確認します。"
        title="出欠管理"
      />
      <DataSourceNotice error={result.error} source={result.source} />

      <section className="space-y-3">
        {events.map(({ event, summary }) => (
          <article className="rounded-md border border-jc-line bg-white p-4 shadow-sm" key={event.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">
                  {event.lomName} / {event.fiscalYear}年度
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{event.title}</h2>
              </div>
              <StatusPill label={scheduleService.eventTypeLabels[event.eventType]} tone={scheduleService.eventTypeTones[event.eventType]} />
            </div>

            <div className="mt-3 grid gap-1 text-sm text-slate-600">
              <span>
                {scheduleService.formatEventDate(event)} - {event.endTime}
              </span>
              <span>返信期限: {event.attendanceDeadline ?? "未設定"}</span>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-2">
              <MiniStat label="回答率" value={`${summary.responseRate}%`} />
              <MiniStat label="出席" value={String(summary.attending)} />
              <MiniStat label="欠席" value={String(summary.absent)} />
              <MiniStat label="遅刻" value={String(summary.late)} />
              <MiniStat label="未回答" value={String(summary.unanswered)} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <StatusPill
                label={summary.isDeadlineOver ? "期限切れ" : "期限内"}
                tone={summary.isDeadlineOver ? "red" : "green"}
              />
              <div className="flex gap-2">
                <Link className="rounded-md bg-jc-sky px-3 py-2 text-xs font-bold text-jc-blue" href={`/attendance/${event.id}/respond`}>
                  回答
                </Link>
                <Link className="rounded-md bg-jc-navy px-3 py-2 text-xs font-bold text-white" href={`/attendance/${event.id}`}>
                  詳細
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2 text-center">
      <p className="text-base font-bold text-jc-navy">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function DataSourceNotice({ error, source }: { error: string | null; source: "supabase" | "fallback" }) {
  if (!error && source === "supabase") return null;

  return (
    <section className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
      {error ?? "Supabaseに該当データがないため、仮データを表示しています。"}
    </section>
  );
}
