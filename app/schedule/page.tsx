import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { scheduleService } from "@/services/scheduleService";
import type { ScheduleEvent } from "@/types/schedule";

// Events are updated through the management screens, so this page must read current data at request time.
export const dynamic = "force-dynamic";

type SchedulePageProps = {
  searchParams?: {
    view?: string;
  };
};

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  noStore();
  const result = await scheduleService.getEvents();
  const events = result.data;
  const listedEvents = events;
  const view = searchParams?.view === "list" ? "list" : "month";
  const fiscalYearCount = new Set(events.map((event) => event.fiscalYearId)).size;

  return (
    <AppShell>
      <PageHeader
        action={{ href: "/schedule/new", label: "新規作成" }}
        description="年度、LOM、対象委員会、出欠確認までイベント単位で管理します。"
        title="スケジュール"
      />
      <DataSourceNotice error={result.error} source={result.source} />

      <section className="grid grid-cols-3 gap-3">
        <SummaryCard label="対象年度" value={String(fiscalYearCount)} />
        <SummaryCard
          label="出欠あり"
          value={String(listedEvents.filter((event) => event.requiresAttendance).length)}
        />
        <SummaryCard label="全予定" value={String(events.length)} />
      </section>

      <section className="mt-5 rounded-md border border-jc-line bg-white p-1 shadow-sm">
        <div className="grid grid-cols-2 gap-1">
          <Link
            aria-current={view === "month" ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center rounded-md text-sm font-bold ${
              view === "month" ? "bg-jc-blue text-white" : "text-slate-600"
            }`}
            href="/schedule?view=month"
          >
            月表示
          </Link>
          <Link
            aria-current={view === "list" ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center rounded-md text-sm font-bold ${
              view === "list" ? "bg-jc-blue text-white" : "text-slate-600"
            }`}
            href="/schedule?view=list"
          >
            リスト表示
          </Link>
        </div>
      </section>

      {view === "month" ? (
        <section className="mt-5">
          <h2 className="text-lg font-bold text-jc-navy">月表示</h2>
          <div className="mt-3 space-y-3">
            {getMonthGroups(listedEvents).map((group) => (
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
                        <p className="text-xs text-slate-500">{scheduleService.formatEventDate(event)}</p>
                      </div>
                      <StatusPill label={scheduleService.eventTypeLabels[event.eventType]} tone={scheduleService.eventTypeTones[event.eventType]} />
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-5">
          <h2 className="text-lg font-bold text-jc-navy">リスト表示</h2>
          <div className="mt-3 space-y-3">
            {listedEvents.map((event) => (
              <Link
                className="block rounded-md border border-jc-line bg-white p-4 shadow-sm transition hover:border-jc-blue hover:shadow-soft"
                href={`/schedule/${event.id}`}
                key={event.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500">
                      {event.lomName} / {event.fiscalYear}年度
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{event.title}</h3>
                  </div>
                  <StatusPill label={scheduleService.eventTypeLabels[event.eventType]} tone={scheduleService.eventTypeTones[event.eventType]} />
                </div>
                <div className="mt-3 grid gap-1 text-sm text-slate-600">
                  <span>
                    {scheduleService.formatEventDate(event)} - {event.endTime}
                  </span>
                  <span>{event.venue || "会場未設定"}</span>
                  <span>対象: {event.targetAudience || "未設定"}</span>
                </div>
                {event.requiresAttendance ? (
                  <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                    出欠返信期限: {event.attendanceDeadline ?? "未設定"}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      )}
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
    const monthLabel = `${event.date.slice(0, 4)}年${month}月`;
    const current = groups.get(monthLabel) ?? [];
    groups.set(monthLabel, [...current, event]);
  });

  return Array.from(groups.entries()).map(([monthLabel, groupedEvents]) => ({
    monthLabel,
    events: groupedEvents
  }));
}

function DataSourceNotice({ error, source }: { error: string | null; source: "supabase" | "fallback" }) {
  if (!error && source === "supabase") return null;

  return (
    <section className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
      {error ?? "Supabaseに該当データがないため、仮データを表示しています。"}
    </section>
  );
}
