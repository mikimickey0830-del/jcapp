import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AttendanceResponseForm } from "@/components/AttendanceResponseForm";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { attendanceService } from "@/services/attendanceService";
import { authService } from "@/services/authService";
import { scheduleService } from "@/services/scheduleService";

export default async function AttendanceRespondPage({ params }: { params: { eventId: string } }) {
  noStore();
  const [result, authContext] = await Promise.all([
    attendanceService.getAttendanceDetail(params.eventId),
    authService.getCurrentAuthContext(),
  ]);
  const detail = result.data;

  if (!detail) {
    notFound();
  }

  const { event, rows, summary } = detail;

  return (
    <AppShell>
      <PageHeader
        backHref={`/attendance/${event.id}`}
        description="出席、遅刻、欠席を選択して送信します。"
        title="出欠回答"
      />
      <DataSourceNotice error={result.error} source={result.source} />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {scheduleService.formatEventDate(event)} - {event.endTime}
            </p>
            <h2 className="mt-1 text-xl font-bold text-jc-navy">{event.title}</h2>
          </div>
          <StatusPill label={summary.isDeadlineOver ? "期限切れ" : "期限内"} tone={summary.isDeadlineOver ? "red" : "green"} />
        </div>
        <p className="mt-3 text-sm text-slate-600">返信期限: {event.attendanceDeadline ?? "未設定"}</p>
      </section>

      {authContext.member ? (
        <AttendanceResponseForm
          canManage={authContext.canManage}
          currentMemberId={authContext.member.id}
          eventId={event.id}
          rows={authContext.canManage ? rows : rows.filter((row) => row.memberId === authContext.member?.id)}
        />
      ) : (
        <p className="mt-5 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          会員情報との紐付けがないため回答できません。管理者へご連絡ください。
        </p>
      )}

      <Link className="mt-5 flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700" href="/attendance">
        出欠一覧へ
      </Link>
    </AppShell>
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
