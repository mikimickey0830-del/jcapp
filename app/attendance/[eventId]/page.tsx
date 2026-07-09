import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { useAttendanceEvent } from "@/hooks/useAttendance";
import { useScheduleEvent } from "@/hooks/useSchedule";

export default function AttendanceDetailPage({ params }: { params: { eventId: string } }) {
  const { event, formatEventDate } = useScheduleEvent(params.eventId);

  if (!event) {
    notFound();
  }

  const { rows, summary, attendanceStatusLabels, attendanceStatusTones } = useAttendanceEvent(event.id);

  return (
    <AppShell>
      <PageHeader
        action={{ href: `/attendance/${event.id}/summary`, label: "集計" }}
        backHref="/attendance"
        description="会員ごとの回答状況と未回答者を確認します。"
        title={event.title}
      />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">{formatEventDate(event)} - {event.endTime}</p>
        <h2 className="mt-1 text-lg font-bold text-jc-navy">回答率 {summary.responseRate}%</h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <MiniStat label="出席" value={String(summary.attending)} />
          <MiniStat label="欠席" value={String(summary.absent)} />
          <MiniStat label="遅刻" value={String(summary.late)} />
          <MiniStat label="未回答" value={String(summary.unanswered)} />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-600">
          返信期限: {event.attendanceDeadline} / {summary.isDeadlineOver ? "期限切れ" : "期限内"}
        </p>
      </section>

      <section className="mt-5 space-y-3">
        {rows.map((row) => (
          <article className="rounded-md border border-jc-line bg-white p-4 shadow-sm" key={row.memberId}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">{row.memberKana}</p>
                <h3 className="mt-1 font-bold text-slate-900">{row.memberName}</h3>
              </div>
              <StatusPill label={attendanceStatusLabels[row.status]} tone={attendanceStatusTones[row.status]} />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {row.respondedAt ? `回答日時: ${row.respondedAt}` : "回答日時: 未回答"}
            </p>
            {row.comment ? <p className="mt-2 text-sm text-slate-700">{row.comment}</p> : null}
            {row.isOverdue ? <p className="mt-2 text-xs font-bold text-rose-700">期限超過の未回答です</p> : null}
          </article>
        ))}
      </section>

      <Link
        className="mt-5 flex min-h-12 items-center justify-center rounded-md bg-jc-blue px-4 text-sm font-bold text-white"
        href={`/attendance/${event.id}/respond`}
      >
        自分の出欠を回答
      </Link>
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2 text-center">
      <p className="text-base font-bold text-jc-blue">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}
