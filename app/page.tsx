import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { useUnansweredAttendance } from "@/hooks/useAttendance";
import { useLatestAnnouncements } from "@/hooks/useAnnouncements";
import { useNewDocuments } from "@/hooks/useDocuments";
import { useLatestNotifications } from "@/hooks/useNotifications";
import { useUpcomingEvents } from "@/hooks/useSchedule";

export default function HomePage() {
  const { upcomingEvents, eventTypeLabels, eventTypeTones, formatEventDate } = useUpcomingEvents(3);
  const { unansweredAttendance } = useUnansweredAttendance("m004");
  const { latestAnnouncements, announcementImportanceLabels, announcementImportanceTones } = useLatestAnnouncements(3);
  const { newDocuments, documentToneByFileType, fileTypeLabels } = useNewDocuments(3);
  const { latestNotifications, notificationTypeLabels } = useLatestNotifications(3);

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
            <p className="text-xs text-blue-100">所属委員会</p>
            <p className="mt-1 text-sm font-bold">総務広報委員会</p>
          </div>
          <div className="rounded-md bg-white/10 p-3">
            <p className="text-xs text-blue-100">年度役職</p>
            <p className="mt-1 text-sm font-bold">委員</p>
          </div>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-3 gap-3">
        <SummaryCard label="未回答" value={String(unansweredAttendance.length)} tone="red" />
        <SummaryCard label="今月予定" value={String(upcomingEvents.length)} tone="blue" />
        <SummaryCard label="新着資料" value={String(newDocuments.length)} tone="green" />
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

      <section className="mt-6" id="schedule">
        <SectionTitle actionHref="/schedule" actionLabel="一覧" title="直近の予定" />
        <div className="mt-3 space-y-3">
          {upcomingEvents.map((event) => (
            <Link className="block rounded-md border border-jc-line bg-white p-4 shadow-sm" href={`/schedule/${event.id}`} key={event.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">{event.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{formatEventDate(event)} - {event.endTime}</p>
                  <p className="mt-1 text-sm text-slate-500">{event.venue}</p>
                </div>
                <StatusPill
                  label={eventTypeLabels[event.eventType]}
                  tone={eventTypeTones[event.eventType]}
                />
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
              <StatusPill label={fileTypeLabels[document.fileType]} tone={documentToneByFileType[document.fileType]} />
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
                  label={announcementImportanceLabels[announcement.importance]}
                  tone={announcementImportanceTones[announcement.importance]}
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
              <p className="mt-1 text-xs font-semibold text-amber-700">{notificationTypeLabels[notification.type]}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-md border border-jc-line bg-white p-4" id="admin">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">年度管理</h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              前年度コピーで新年度の役職、委員会、権限を準備します。
            </p>
          </div>
          <Link className="rounded-md bg-jc-navy px-3 py-2 text-sm font-bold text-white" href="#admin">
            管理
          </Link>
        </div>
      </section>
    </AppShell>
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
