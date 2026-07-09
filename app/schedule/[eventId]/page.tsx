import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { useScheduleEvent } from "@/hooks/useSchedule";

export default function ScheduleEventDetailPage({ params }: { params: { eventId: string } }) {
  const { event, eventTypeLabels, eventTypeTones, formatEventDate } = useScheduleEvent(params.eventId);

  if (!event) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        action={{ href: `/schedule/${event.id}/edit`, label: "編集" }}
        backHref="/schedule"
        description="年度に紐づくイベント情報と出欠設定を確認します。"
        title={event.title}
      />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">{event.lomName} / {event.fiscalYear}年度</p>
            <h2 className="mt-1 text-xl font-bold text-jc-navy">{event.title}</h2>
          </div>
          <StatusPill label={eventTypeLabels[event.eventType]} tone={eventTypeTones[event.eventType]} />
        </div>

        <dl className="mt-5 grid gap-3">
          <InfoRow label="開催日時" value={`${formatEventDate(event)} - ${event.endTime}`} />
          <InfoRow label="会場" value={event.venue} />
          <InfoRow label="住所" value={event.address} />
          <InfoRow label="対象者" value={event.targetAudience} />
        </dl>
      </section>

      <section className="mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">説明</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">{event.description}</p>
      </section>

      <section className="mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-jc-navy">出欠確認</h2>
          <StatusPill label={event.requiresAttendance ? "あり" : "なし"} tone={event.requiresAttendance ? "red" : "green"} />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {event.requiresAttendance
            ? `返信期限は ${event.attendanceDeadline} です。後続フェーズで出欠管理と連動します。`
            : "このイベントでは出欠確認を行いません。"}
        </p>
      </section>

      <Link
        className="mt-5 flex min-h-12 items-center justify-center rounded-md bg-jc-navy px-4 text-sm font-bold text-white"
        href="/schedule"
      >
        スケジュール一覧へ
      </Link>
    </AppShell>
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
