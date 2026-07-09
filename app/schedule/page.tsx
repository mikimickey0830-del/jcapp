import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { useSchedule } from "@/hooks/useSchedule";
import type { ScheduleEvent } from "@/types/schedule";

export default function SchedulePage() {
  const { events, getEventsForFiscalYear, eventTypeLabels, eventTypeTones, formatEventDate } = useSchedule();
  const currentYearEvents = getEventsForFiscalYear(2026);

  return (
    <AppShell>
      <PageHeader
        action={{ href: "/schedule/new", label: "新規作成" }}
        description="年度に紐づく予定を管理します。出欠確認の有無と返信期限もイベント単位で設定します。"
        title="スケジュール"
      />

      <section className="grid grid-cols-3 gap-3">
        <SummaryCard label="2026年度" value={String(currentYearEvents.length)} />
        <SummaryCard
          label="出欠あり"
          value={String(currentYearEvents.filter((event) => event.requiresAttendance).length)}
        />
        <SummaryCard label="全年度" value={String(events.length)} />
      </section>

      <section className="mt-5 rounded-md border border-jc-line bg-white p-1 shadow-sm">
        <div className="grid grid-cols-2 gap-1">
          <button className="min-h-11 rounded-md bg-jc-blue text-sm font-bold text-white" type="button">
            月表示
          </button>
          <button className="min-h-11 rounded-md text-sm font-bold text-slate-600" type="button">
            リスト表示
          </button>
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-lg font-bold text-jc-navy">月表示</h2>
        <div className="mt-3 space-y-3">
          {getMonthGroups(currentYearEvents).map((group) => (
            <article className="rounded-md border border-jc-line bg-white p-4 shadow-sm" key={group.monthLabel}>
              <h3 className="font-bold text-jc-navy">{group.monthLabel}</h3>
              <div className="mt-3 grid gap-2">
                {group.events.map((event) => (
                  <Link
                    className="flex min-h-12 items-center justify-between gap-3 rounded-md bg-slate-50 px-3"
                    href={`/schedule/${event.id}`}
                    key={event.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{event.title}</p>
                      <p className="text-xs text-slate-500">{formatEventDate(event)}</p>
                    </div>
                    <StatusPill label={eventTypeLabels[event.eventType]} tone={eventTypeTones[event.eventType]} />
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-jc-navy">リスト表示</h2>
        <div className="mt-3 space-y-3">
          {currentYearEvents.map((event) => (
            <Link
              className="block rounded-md border border-jc-line bg-white p-4 shadow-sm transition hover:border-jc-blue hover:shadow-soft"
              href={`/schedule/${event.id}`}
              key={event.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">{event.lomName} / {event.fiscalYear}年度</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{event.title}</h3>
                </div>
                <StatusPill label={eventTypeLabels[event.eventType]} tone={eventTypeTones[event.eventType]} />
              </div>
              <div className="mt-3 grid gap-1 text-sm text-slate-600">
                <span>{formatEventDate(event)} - {event.endTime}</span>
                <span>{event.venue}</span>
                <span>対象: {event.targetAudience}</span>
              </div>
              {event.requiresAttendance ? (
                <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                  出欠返信期限: {event.attendanceDeadline}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-jc-line bg-white p-3 text-center shadow-sm">
      <p className="text-2xl font-bold text-jc-blue">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
    </article>
  );
}

function getMonthGroups(events: ScheduleEvent[]) {
  const groups = new Map<string, ScheduleEvent[]>();

  events.forEach((event) => {
    const month = Number(event.date.slice(5, 7));
    const monthLabel = `${month}月`;
    const current = groups.get(monthLabel) ?? [];
    groups.set(monthLabel, [...current, event]);
  });

  return Array.from(groups.entries()).map(([monthLabel, groupedEvents]) => ({
    monthLabel,
    events: groupedEvents
  }));
}
