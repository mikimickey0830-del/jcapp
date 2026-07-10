import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { attendanceService } from "@/services/attendanceService";
import { scheduleService } from "@/services/scheduleService";

export default async function AttendanceDetailPage({ params }: { params: { eventId: string } }) {
  const result = await attendanceService.getAttendanceDetail(params.eventId);
  const detail = result.data;

  if (!detail) {
    notFound();
  }

  const { event, rows, summary } = detail;

  return (
    <AppShell>
      <PageHeader
        action={{ href: `/attendance/${event.id}/summary`, label: "集計" }}
        backHref="/attendance"
        description="会員ごとの回答状況と未回答者を確認します。"
        title={event.title}
      />
      <DataSourceNotice error={result.error} source={result.source} />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">
          {scheduleService.formatEventDate(event)} - {event.endTime}
        </p>
        <h2 className="mt-1 text-lg font-bold text-jc-navy">回答率 {summary.responseRate}%</h2>
        <div className="mt-3 grid grid-cols-5 gap-2">
          <MiniStat label="出席" value={String(summary.attending)} />
          <MiniStat label="欠席" value={String(summary.absent)} />
          <MiniStat label="遅刻" value={String(summary.late)} />
          <MiniStat label="未回答" value={String(summary.unanswered)} />
          <MiniStat label="対象" value={String(summary.total)} />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-600">
          返信期限: {event.attendanceDeadline ?? "未設定"} / {summary.isDeadlineOver ? "期限切れ" : "期限内"}
        </p>
      </section>

      <section className="mt-5 space-y-3">
        {rows.map((row) => (
          <article className="rounded-md border border-jc-line bg-white p-4 shadow-sm" key={row.memberId}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">{row.memberKana}</p>
                <h3 className="mt-1 font-bold text-slate-900">{row.memberName}</h3>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {row.committees.map((committee) => committee.name).join(" / ") || "委員会未設定"}
                </p>
              </div>
              <StatusPill label={attendanceService.attendanceStatusLabels[row.status]} tone={attendanceService.attendanceStatusTones[row.status]} />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {row.respondedAt ? `回答日時: ${row.respondedAt.replace("T", " ").slice(0, 16)}` : "回答日時: 未回答"}
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
        出欠を回答する
      </Link>
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2 text-center">
      <p className="text-base font-bold text-jc-blue">{value}</p>
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
