import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AttendanceCsvButton } from "@/components/AttendanceCsvButton";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { attendanceService } from "@/services/attendanceService";
import { scheduleService } from "@/services/scheduleService";
import type { AttendanceGroupSummary } from "@/types/attendance";

export default async function AttendanceSummaryPage({ params }: { params: { eventId: string } }) {
  noStore();
  const result = await attendanceService.getAttendanceDetail(params.eventId);
  const detail = result.data;

  if (!detail) {
    notFound();
  }

  const { event, rows, summary } = detail;

  return (
    <AppShell>
      <PageHeader
        backHref={`/attendance/${event.id}`}
        description="管理者向けの出欠集計画面です。委員会別・役職別の状況を確認できます。"
        title="出欠集計"
      />
      <DataSourceNotice error={result.error} source={result.source} />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">
          {scheduleService.formatEventDate(event)} - {event.endTime}
        </p>
        <h2 className="mt-1 text-xl font-bold text-jc-navy">{event.title}</h2>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-jc-blue" style={{ width: `${summary.responseRate}%` }} />
        </div>
        <p className="mt-2 text-sm font-bold text-jc-blue">回答率 {summary.responseRate}%</p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <SummaryCard label="出席人数" value={String(summary.attending)} />
        <SummaryCard label="欠席人数" value={String(summary.absent)} />
        <SummaryCard label="遅刻人数" value={String(summary.late)} />
        <SummaryCard label="未回答人数" value={String(summary.unanswered)} />
      </section>

      <GroupSummarySection title="対象委員会別集計" groups={summary.committeeSummaries} />
      <GroupSummarySection title="役職別集計" groups={summary.positionSummaries} />

      <section className="mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-jc-navy">未回答者一覧</h2>
          <StatusPill label={summary.isDeadlineOver ? "期限切れ" : "期限内"} tone={summary.isDeadlineOver ? "red" : "green"} />
        </div>
        <div className="mt-3 space-y-2">
          {summary.unansweredRows.length > 0 ? (
            summary.unansweredRows.map((row) => (
              <div className="rounded-md bg-slate-50 px-3 py-3" key={row.memberId}>
                <p className="font-bold text-slate-900">{row.memberName}</p>
                <p className="mt-1 text-xs text-slate-500">{row.memberKana}</p>
                {row.isOverdue ? <p className="mt-1 text-xs font-bold text-rose-700">期限超過</p> : null}
              </div>
            ))
          ) : (
            <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">未回答者はいません。</p>
          )}
        </div>
      </section>

      <section className="mt-5 rounded-md border border-dashed border-amber-300 bg-amber-50 p-4">
        <h2 className="text-base font-bold text-amber-900">通知準備</h2>
        <div className="mt-3 grid gap-2">
          <button className="min-h-10 rounded-md bg-white px-3 text-sm font-bold text-amber-800" type="button">
            未回答通知を作成
          </button>
          <button className="min-h-10 rounded-md bg-white px-3 text-sm font-bold text-amber-800" type="button">
            締切通知を作成
          </button>
          <button className="min-h-10 rounded-md bg-white px-3 text-sm font-bold text-amber-800" type="button">
            イベント前日通知を作成
          </button>
        </div>
      </section>

      <AttendanceCsvButton eventTitle={event.title} rows={rows} />
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

function GroupSummarySection({ title, groups }: { title: string; groups: AttendanceGroupSummary[] }) {
  return (
    <section className="mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-jc-navy">{title}</h2>
      <div className="mt-3 space-y-3">
        {groups.map((group) => (
          <article className="rounded-md bg-slate-50 p-3" key={group.id}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900">{group.name}</h3>
              <span className="text-sm font-bold text-jc-blue">{group.responseRate}%</span>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[11px] font-semibold text-slate-600">
              <span>対象 {group.total}</span>
              <span>出席 {group.attending}</span>
              <span>欠席 {group.absent}</span>
              <span>遅刻 {group.late}</span>
              <span>未 {group.unanswered}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
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
