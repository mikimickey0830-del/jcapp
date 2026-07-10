import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EventDeleteButton } from "@/components/EventDeleteButton";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { attendanceService } from "@/services/attendanceService";
import { scheduleService } from "@/services/scheduleService";

export default async function ScheduleEventDetailPage({ params }: { params: { eventId: string } }) {
  const [eventResult, attendanceResult] = await Promise.all([
    scheduleService.getEventById(params.eventId),
    attendanceService.getAttendanceDetail(params.eventId)
  ]);
  const event = eventResult.data;
  const attendance = attendanceResult.data;

  if (!event) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        action={{ href: `/schedule/${event.id}/edit`, label: "編集" }}
        backHref="/schedule"
        description="イベント情報、対象者、運営情報、出欠設定を確認します。"
        title={event.title}
      />
      <DataSourceNotice error={eventResult.error ?? attendanceResult.error} source={eventResult.source} />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {event.lomName} / {event.fiscalYear}年度
            </p>
            <h2 className="mt-1 text-xl font-bold text-jc-navy">{event.title}</h2>
          </div>
          <StatusPill label={scheduleService.eventTypeLabels[event.eventType]} tone={scheduleService.eventTypeTones[event.eventType]} />
        </div>

        <dl className="mt-5 grid gap-3">
          <InfoRow label="開催日時" value={`${scheduleService.formatEventDate(event)} - ${event.endTime}`} />
          <InfoRow label="会場" value={event.venue || "未設定"} />
          <InfoRow label="住所" value={event.address || "未設定"} />
          <InfoRow label="対象者" value={event.targetAudience || "未設定"} />
        </dl>

        {event.googleMapUrl ? (
          <a
            className="mt-4 flex min-h-11 items-center justify-center rounded-md bg-jc-blue px-4 text-sm font-bold text-white"
            href={event.googleMapUrl}
            rel="noreferrer"
            target="_blank"
          >
            Google Mapを開く
          </a>
        ) : null}
      </section>

      {attendance ? (
        <section className="mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-jc-navy">出欠状況</h2>
            <StatusPill
              label={attendance.summary.isDeadlineOver ? "期限切れ" : "期限内"}
              tone={attendance.summary.isDeadlineOver ? "red" : "green"}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat label="回答率" value={`${attendance.summary.responseRate}%`} />
            <MiniStat label="未回答" value={String(attendance.summary.unanswered)} />
            <MiniStat label="期限" value={event.attendanceDeadline ?? "未設定"} />
          </div>
          <Link
            className="mt-4 flex min-h-11 items-center justify-center rounded-md bg-jc-navy px-4 text-sm font-bold text-white"
            href={`/attendance/${event.id}`}
          >
            出欠状況を見る
          </Link>
        </section>
      ) : null}

      <section className="mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">対象設定</h2>
        <div className="mt-3 grid gap-3">
          <TagList label="対象委員会" values={event.targetCommittees.map((committee) => committee.name)} />
          <TagList label="対象役職" values={event.targetPositions.map((position) => position.name)} />
          <TagList label="対象会員" values={event.targetMembers.map((member) => member.name)} />
        </div>
      </section>

      <section className="mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">運営情報</h2>
        <dl className="mt-3 grid gap-3">
          <InfoRow label="担当委員会" value={event.operatingCommitteeName || "未設定"} />
          <InfoRow label="担当者" value={event.contactMemberName || "未設定"} />
          <InfoRow label="持参物" value={event.bringItems || "未設定"} />
          <InfoRow label="服装" value={event.dressCode || "未設定"} />
          <InfoRow label="備考" value={event.notes || "なし"} />
        </dl>
      </section>

      <section className="mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">説明</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">{event.description || "説明は未設定です。"}</p>
      </section>

      <section className="mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-jc-navy">出欠・通知</h2>
          <StatusPill label={event.requiresAttendance ? "出欠あり" : "出欠なし"} tone={event.requiresAttendance ? "red" : "green"} />
        </div>
        <dl className="mt-3 grid gap-3">
          <InfoRow label="返信期限" value={event.attendanceDeadline ?? "未設定"} />
          <InfoRow label="締切通知" value={event.reminderAt ? event.reminderAt.replace("T", " ").slice(0, 16) : "未設定"} />
          <InfoRow label="Google ID" value={event.googleCalendarEventId || "未設定"} />
        </dl>
      </section>

      <Link
        className="mt-5 flex min-h-12 items-center justify-center rounded-md bg-jc-navy px-4 text-sm font-bold text-white"
        href="/schedule"
      >
        スケジュール一覧へ
      </Link>
      <EventDeleteButton eventId={event.id} />
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function TagList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value) => (
            <span className="rounded-full bg-jc-sky px-3 py-1 text-xs font-bold text-jc-blue" key={value}>
              {value}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-500">未設定</span>
        )}
      </div>
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
