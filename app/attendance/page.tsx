import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { useAttendance } from "@/hooks/useAttendance";
import { useSchedule } from "@/hooks/useSchedule";

export default function AttendancePage() {
  const { attendanceEvents: events, getAttendanceSummary } = useAttendance();
  const { eventTypeLabels, eventTypeTones, formatEventDate } = useSchedule();

  return (
    <AppShell>
      <PageHeader
        description="スケジュールの出欠対象イベントと連動して、回答状況を確認します。"
        title="出欠管理"
      />

      <section className="space-y-3">
        {events.map((event) => {
          const summary = getAttendanceSummary(event.id);

          return (
            <article className="rounded-md border border-jc-line bg-white p-4 shadow-sm" key={event.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">
                    {event.lomName} / {event.fiscalYear}年度
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{event.title}</h2>
                </div>
                <StatusPill label={eventTypeLabels[event.eventType]} tone={eventTypeTones[event.eventType]} />
              </div>

              <div className="mt-3 grid gap-1 text-sm text-slate-600">
                <span>{formatEventDate(event)} - {event.endTime}</span>
                <span>返信期限: {event.attendanceDeadline}</span>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">
                <MiniStat label="回答率" value={`${summary.responseRate}%`} />
                <MiniStat label="出席" value={String(summary.attending)} />
                <MiniStat label="欠席" value={String(summary.absent)} />
                <MiniStat label="遅刻" value={String(summary.late)} />
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
          );
        })}
      </section>
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2 text-center">
      <p className="text-base font-bold text-jc-navy">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}
