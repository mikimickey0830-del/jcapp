import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { announcementService } from "@/services/announcementService";
import { attendanceService } from "@/services/attendanceService";
import { documentService } from "@/services/documentService";
import { notificationService } from "@/services/notificationService";
import { scheduleService } from "@/services/scheduleService";

export default async function HomePage() {
  const scheduleResult = await scheduleService.getEvents();
  const events = scheduleResult.data;
  const todayEvents = scheduleService.getTodayEvents(events);
  const thisWeekEvents = scheduleService.getThisWeekEvents(events).slice(0, 5);
  const unansweredAttendance = attendanceService.getUnansweredAttendanceForMember("m004");
  const latestAnnouncements = announcementService.getLatestAnnouncements(3);
  const newDocuments = documentService.getNewDocuments(3);
  const latestNotifications = notificationService.getLatestNotifications(3);

  return (
    <AppShell>
      <header className="rounded-md bg-jc-navy p-5 text-white shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-100">玉島青年会議所</p>
            <h1 className="mt-2 text-2xl font-bold">2026年度 ホーム</h1>
          </div>
          <StatusPill label="現在年度" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-md bg-white/10 p-3">
            <p className="text-xs text-blue-100">今日の予定</p>
            <p className="mt-1 text-sm font-bold">{todayEvents.length}件</p>
          </div>
          <div className="rounded-md bg-white/10 p-3">
            <p className="text-xs text-blue-100">今週の予定</p>
            <p className="mt-1 text-sm font-bold">{thisWeekEvents.length}件</p>
          </div>
        </div>
      </header>

      {scheduleResult.error ? (
        <section className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
          {scheduleResult.error}
        </section>
      ) : null}

      <section className="mt-5 grid grid-cols-3 gap-3">
        <SummaryCard label="未回答" value={String(unansweredAttendance.length)} tone="red" />
        <SummaryCard label="今日" value={String(todayEvents.length)} tone="blue" />
        <SummaryCard label="新着資料" value={String(newDocuments.length)} tone="green" />
      </section>

      <section className="mt-6" id="today-schedule">
        <SectionTitle actionHref="/schedule" actionLabel="一覧" title="今日の予定" />
        <EventList events={todayEvents} emptyText="今日の予定はありません。" />
      </section>

      <section className="mt-6" id="week-schedule">
        <SectionTitle actionHref="/schedule" actionLabel="一覧" title="今週の予定" />
        <EventList events={thisWeekEvents} emptyText="今週の予定はありません。" />
      </section>

      <section className="mt-6">
        <SectionTitle actionHref="/attendance" actionLabel="回答" title="未回答の出欠" />
        <div className="mt-3 space-y-3">
          {unansweredAttendance.slice(0, 3).map(({ event, isOverdue }) => (
            <Link
              className="block rounded-md border border-jc-line bg-white p-4 shadow-sm"
              href={`/attendance/${event.id}/respond`}
              key={event.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">{event.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">返信期限: {event.attendanceDeadline}</p>
                </div>
                <StatusPill label={isOverdue ? "期限切れ" : "未回答"} tone={isOverdue ? "red" : "amber"} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6" id="documents">
        <SectionTitle actionHref="/documents" title="新着資料" actionLabel="開く" />
        <div className="mt-3 rounded-md border border-jc-line bg-white">
          {newDocuments.map((document) => (
            <Link
              className="flex min-h-12 items-center justify-between gap-3 border-b border-jc-line px-4 last:border-b-0"
              href={`/documents/${document.id}`}
              key={document.id}
            >
              <span className="min-w-0 truncate text-sm font-medium text-slate-800">{document.title}</span>
              <StatusPill label={documentService.fileTypeLabels[document.fileType]} tone={documentService.documentToneByFileType[document.fileType]} />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6" id="announcements">
        <SectionTitle actionHref="/announcements" title="最新のお知らせ" actionLabel="確認" />
        <div className="mt-3 space-y-3">
          {latestAnnouncements.map((announcement) => (
            <Link
              className="block rounded-md border border-jc-line bg-white p-4 shadow-sm"
              href={`/announcements/${announcement.id}`}
              key={announcement.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900">{announcement.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{announcement.body}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{announcement.publishStartAt}</p>
                </div>
                <StatusPill
                  label={announcementService.announcementImportanceLabels[announcement.importance]}
                  tone={announcementService.announcementImportanceTones[announcement.importance]}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6" id="notifications">
        <SectionTitle actionHref="/notifications" title="最新通知" actionLabel="確認" />
        <div className="mt-3 space-y-2">
          {latestNotifications.map((notification) => (
            <Link className="block rounded-md bg-amber-50 px-4 py-3" href={notification.relatedHref ?? "/notifications"} key={notification.id}>
              <p className="text-sm font-bold text-amber-900">{notification.title}</p>
              <p className="mt-1 text-xs font-semibold text-amber-700">{notificationService.notificationTypeLabels[notification.type]}</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function EventList({ events, emptyText }: { events: Awaited<ReturnType<typeof scheduleService.getEvents>>["data"]; emptyText: string }) {
  return (
    <div className="mt-3 space-y-3">
      {events.length > 0 ? (
        events.map((event) => (
          <Link className="block rounded-md border border-jc-line bg-white p-4 shadow-sm" href={`/schedule/${event.id}`} key={event.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900">{event.title}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {scheduleService.formatEventDate(event)} - {event.endTime}
                </p>
                <p className="mt-1 truncate text-sm text-slate-500">{event.venue || "会場未設定"}</p>
              </div>
              <StatusPill label={scheduleService.eventTypeLabels[event.eventType]} tone={scheduleService.eventTypeTones[event.eventType]} />
            </div>
          </Link>
        ))
      ) : (
        <p className="rounded-md border border-jc-line bg-white p-4 text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}

function SectionTitle({ title, actionLabel, actionHref }: { title: string; actionLabel: string; actionHref?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-jc-navy">{title}</h2>
      {actionHref ? (
        <Link className="flex min-h-10 items-center rounded-md px-3 text-sm font-bold text-jc-blue" href={actionHref}>
          {actionLabel}
        </Link>
      ) : (
        <button className="min-h-10 rounded-md px-3 text-sm font-bold text-jc-blue" type="button">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "red";
}) {
  const toneClassName = {
    blue: "text-jc-blue",
    green: "text-emerald-700",
    red: "text-rose-700"
  };

  return (
    <article className="rounded-md border border-jc-line bg-white p-3 text-center shadow-sm">
      <p className={`text-2xl font-bold ${toneClassName[tone]}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
    </article>
  );
}
