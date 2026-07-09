import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { useAttendanceEvent } from "@/hooks/useAttendance";
import { useScheduleEvent } from "@/hooks/useSchedule";

export default function AttendanceRespondPage({ params }: { params: { eventId: string } }) {
  const { event, formatEventDate } = useScheduleEvent(params.eventId);

  if (!event) {
    notFound();
  }

  const { summary } = useAttendanceEvent(event.id);

  return (
    <AppShell>
      <PageHeader
        backHref={`/attendance/${event.id}`}
        description="仮データ画面のため保存はまだ行いません。後続フェーズでSupabaseに接続します。"
        title="出欠回答"
      />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">{formatEventDate(event)} - {event.endTime}</p>
            <h2 className="mt-1 text-xl font-bold text-jc-navy">{event.title}</h2>
          </div>
          <StatusPill label={summary.isDeadlineOver ? "期限切れ" : "期限内"} tone={summary.isDeadlineOver ? "red" : "green"} />
        </div>
        <p className="mt-3 text-sm text-slate-600">返信期限: {event.attendanceDeadline}</p>
      </section>

      <section className="mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">回答ステータス</h2>
        <div className="mt-4 grid gap-3">
          <button className="min-h-14 rounded-md bg-emerald-600 px-4 text-base font-bold text-white" type="button">
            出席
          </button>
          <button className="min-h-14 rounded-md bg-rose-600 px-4 text-base font-bold text-white" type="button">
            欠席
          </button>
          <button className="min-h-14 rounded-md bg-amber-500 px-4 text-base font-bold text-white" type="button">
            遅刻
          </button>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">コメント</span>
          <textarea
            className="min-h-28 w-full rounded-md border border-jc-line bg-slate-50 px-3 py-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="必要に応じてコメントを入力"
          />
        </label>

        <button className="mt-4 min-h-12 w-full rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft" type="button">
          回答を保存
        </button>
      </section>

      <Link className="mt-5 flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700" href="/attendance">
        出欠一覧へ
      </Link>
    </AppShell>
  );
}
