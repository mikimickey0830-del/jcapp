import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { useAttendanceEvent } from "@/hooks/useAttendance";
import { useScheduleEvent } from "@/hooks/useSchedule";

export default function AttendanceSummaryPage({ params }: { params: { eventId: string } }) {
  const { event, formatEventDate } = useScheduleEvent(params.eventId);

  if (!event) {
    notFound();
  }

  const { summary } = useAttendanceEvent(event.id);

  return (
    <AppShell>
      <PageHeader
        backHref={`/attendance/${event.id}`}
        description="管理者向けの出欠集計画面です。CSV出力はUIのみ用意しています。"
        title="出欠集計"
      />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">{formatEventDate(event)} - {event.endTime}</p>
        <h2 className="mt-1 text-xl font-bold text-jc-navy">{event.title}</h2>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-jc-blue" style={{ width: `${summary.responseRate}%` }} />
        </div>
        <p className="mt-2 text-sm font-bold text-jc-blue">回答率 {summary.responseRate}%</p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <SummaryCard label="出席者数" value={String(summary.attending)} />
        <SummaryCard label="欠席者数" value={String(summary.absent)} />
        <SummaryCard label="遅刻者数" value={String(summary.late)} />
        <SummaryCard label="未回答者数" value={String(summary.unanswered)} />
      </section>

      <section className="mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-jc-navy">未回答者一覧</h2>
          <StatusPill label={summary.isDeadlineOver ? "期限切れ" : "期限内"} tone={summary.isDeadlineOver ? "red" : "green"} />
        </div>
        <div className="mt-3 space-y-2">
          {summary.unansweredRows.map((row) => (
            <div className="rounded-md bg-slate-50 px-3 py-3" key={row.memberId}>
              <p className="font-bold text-slate-900">{row.memberName}</p>
              <p className="mt-1 text-xs text-slate-500">{row.memberKana}</p>
              {row.isOverdue ? <p className="mt-1 text-xs font-bold text-rose-700">期限超過</p> : null}
            </div>
          ))}
        </div>
      </section>

      <button className="mt-5 min-h-12 w-full rounded-md bg-jc-navy px-4 text-sm font-bold text-white" type="button">
        CSV出力
      </button>
      <Link className="mt-3 flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700" href="/attendance">
        出欠一覧へ
      </Link>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-jc-line bg-white p-4 text-center shadow-sm">
      <p className="text-3xl font-bold text-jc-blue">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
    </article>
  );
}
