import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { announcementService } from "@/services/announcementService";
import { authService } from "@/services/authService";
import { dashboardService } from "@/services/dashboardService";
import { documentService } from "@/services/documentService";
import { scheduleService } from "@/services/scheduleService";
import type { Announcement } from "@/types/announcement";
import type { AssignmentCommitteeMembership } from "@/types/assignment";
import type { AttendanceDashboard } from "@/types/attendance";
import type { ScheduleEvent } from "@/types/schedule";

export const dynamic = "force-dynamic";

const committeeRoleLabels: Record<AssignmentCommitteeMembership["roleInCommittee"], string> = {
  vice_president: "担当副理事長",
  chair: "委員長",
  vice_chair: "副委員長",
  member: "委員",
  observer: "オブザーバー",
  advisor: "顧問",
};

const annualRoleLabels: Record<string, string> = {
  member: "会員",
  vice_chair: "副委員長",
  chair: "委員長",
  secretary: "専務理事",
  president: "理事長",
  admin: "管理者",
  owner: "所有者",
  committee_manager: "委員会管理者",
};

export default async function HomePage() {
  noStore();
  const authContext = await authService.getCurrentAuthContext();
  const result = await dashboardService.getDashboard(
    authContext.member
      ? { memberId: authContext.member.id, lomId: authContext.member.lomId }
      : undefined,
  );
  const {
    currentFiscalYear,
    currentAssignment,
    todayEvents,
    thisWeekEvents,
    attendance,
    announcements,
    documents,
  } = result.data;
  const deadlineItems = uniqueDeadlineItems(attendance);

  return (
    <AppShell>
      <header className="border-b border-jc-line pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-jc-blue">玉島青年会議所</p>
            <h1 className="mt-1 text-2xl font-bold text-jc-navy">ダッシュボード</h1>
            <p className="mt-2 text-sm text-slate-600">{formatToday()}の確認事項</p>
          </div>
          <div className="shrink-0 text-right">
            <StatusPill label={currentFiscalYear?.name ?? "年度未設定"} />
            {authContext.member ? (
              <p className="mt-2 max-w-32 truncate text-xs font-semibold text-slate-600">
                {authContext.member.name}
              </p>
            ) : null}
            {result.usesFallback ? (
              <p className="mt-2 text-xs font-semibold text-amber-700">一部仮データ</p>
            ) : null}
          </div>
        </div>
      </header>

      {!authContext.member ? (
        <section className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
          <p className="font-bold">ログイン会員との紐付けが見つかりません。</p>
          <p className="mt-1">
            管理者に、AuthユーザーIDと会員情報の紐付けを依頼してください。
          </p>
          {authContext.userEmail ? <p className="mt-2 text-xs">ログイン: {authContext.userEmail}</p> : null}
        </section>
      ) : null}

      {result.errors.length > 0 ? (
        <section className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          <p className="font-bold">一部の情報を取得できませんでした。</p>
          <p className="mt-1">取得できた情報と仮データを表示しています。</p>
        </section>
      ) : null}

      <section className="mt-5 grid grid-cols-3 gap-2" aria-label="対応状況">
        <SummaryLink href="/attendance" label="未回答" tone="red" value={attendance.unansweredItems.length} />
        <SummaryLink href="/attendance" label="今日締切" tone="amber" value={attendance.dueTodayItems.length} />
        <SummaryLink href="/attendance" label="今週締切" tone="blue" value={attendance.dueThisWeekItems.length} />
      </section>

      <DashboardSection actionHref="/schedule" actionLabel="すべて見る" title="今日の予定">
        <EventList events={todayEvents} emptyText="今日の予定はありません。" />
      </DashboardSection>

      <DashboardSection actionHref="/attendance" actionLabel="出欠一覧" title="未回答の出欠">
        <div className="space-y-3">
          {attendance.unansweredItems.slice(0, 4).map(({ event, row, isOverdue }) => (
            <Link
              className={`block rounded-md border bg-white p-4 shadow-sm ${isOverdue ? "border-rose-300" : "border-jc-line"}`}
              href={`/attendance/${event.id}/respond`}
              key={`${event.id}-${row.memberId}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words font-bold text-slate-900">{event.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    返信期限: {formatDate(row.replyDeadline ?? event.attendanceDeadline)}
                  </p>
                </div>
                <StatusPill label={isOverdue ? "期限超過" : "未回答"} tone={isOverdue ? "red" : "amber"} />
              </div>
            </Link>
          ))}
          {attendance.unansweredItems.length === 0 ? <EmptyState text="未回答の出欠はありません。" /> : null}
        </div>
      </DashboardSection>

      <DashboardSection actionHref="/attendance" actionLabel="確認する" title="締切間近">
        <div className="space-y-3">
          {deadlineItems.slice(0, 4).map(({ event, row, dueToday }) => (
            <Link
              className="block rounded-md border border-amber-200 bg-amber-50 p-4"
              href={`/attendance/${event.id}/respond`}
              key={`${event.id}-${row.memberId}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-amber-950">{event.title}</h3>
                  <p className="mt-2 text-sm text-amber-800">
                    返信期限: {formatDate(row.replyDeadline ?? event.attendanceDeadline)}
                  </p>
                </div>
                <StatusPill label={dueToday ? "今日締切" : "今週締切"} tone="amber" />
              </div>
            </Link>
          ))}
          {deadlineItems.length === 0 ? <EmptyState text="今週締切の出欠はありません。" /> : null}
        </div>
      </DashboardSection>

      <DashboardSection actionHref="/schedule" actionLabel="すべて見る" title="今週の予定">
        <EventList events={thisWeekEvents} emptyText="今週の予定はありません。" />
      </DashboardSection>

      <DashboardSection actionHref="/announcements" actionLabel="一覧へ" title="お知らせ">
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <AnnouncementCard announcement={announcement} key={announcement.id} />
          ))}
          {announcements.length === 0 ? <EmptyState text="公開中のお知らせはありません。" /> : null}
        </div>
      </DashboardSection>

      <DashboardSection actionHref="/documents" actionLabel="一覧へ" title="新着資料">
        <div className="overflow-hidden rounded-md border border-jc-line bg-white shadow-sm">
          {documents.map((document) => (
            <Link
              className="flex min-h-14 items-center justify-between gap-3 border-b border-jc-line px-4 py-3 last:border-b-0"
              href={`/documents/${document.id}`}
              key={document.id}
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-bold text-slate-900">{document.title}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(document.uploadedAt)}</p>
              </div>
              <StatusPill
                label={documentService.fileTypeLabels[document.fileType]}
                tone={documentService.documentToneByFileType[document.fileType]}
              />
            </Link>
          ))}
          {documents.length === 0 ? <EmptyState text="新着資料はありません。" /> : null}
        </div>
      </DashboardSection>

      <DashboardSection
        actionHref={currentFiscalYear ? `/assignments/${currentFiscalYear.id}` : "/assignments"}
        actionLabel="年度所属へ"
        title="自分の所属"
      >
        {currentAssignment ? (
          <article className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">{currentFiscalYear?.name}</p>
                <h3 className="mt-1 text-lg font-bold text-jc-navy">{currentAssignment.memberName}</h3>
              </div>
              <StatusPill label={annualRoleLabels[currentAssignment.role] ?? currentAssignment.role} tone="green" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              役職: {currentAssignment.positionName || "未設定"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentAssignment.committeeMemberships.map((membership) => (
                <Link
                  className="rounded-md border border-jc-line bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                  href={`/committees/${membership.committeeId}`}
                  key={membership.id}
                >
                  {membership.committeeName} / {committeeRoleLabels[membership.roleInCommittee]}
                  {membership.isPrimary ? "（主所属）" : ""}
                </Link>
              ))}
            </div>
            {currentAssignment.committeeMemberships.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">委員会所属は未設定です。</p>
            ) : null}
          </article>
        ) : (
          <EmptyState text="現在年度の所属情報が設定されていません。" />
        )}
      </DashboardSection>
    </AppShell>
  );
}

function uniqueDeadlineItems(attendance: AttendanceDashboard) {
  const todayKeys = new Set(attendance.dueTodayItems.map(({ event, row }) => `${event.id}-${row.memberId}`));
  return [
    ...attendance.dueTodayItems.map((item) => ({ ...item, dueToday: true })),
    ...attendance.dueThisWeekItems
      .filter(({ event, row }) => !todayKeys.has(`${event.id}-${row.memberId}`))
      .map((item) => ({ ...item, dueToday: false })),
  ].sort((a, b) =>
    (a.row.replyDeadline ?? a.event.attendanceDeadline ?? "9999").localeCompare(
      b.row.replyDeadline ?? b.event.attendanceDeadline ?? "9999",
    ),
  );
}

function EventList({ events, emptyText }: { events: ScheduleEvent[]; emptyText: string }) {
  if (events.length === 0) return <EmptyState text={emptyText} />;
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Link className="block rounded-md border border-jc-line bg-white p-4 shadow-sm" href={`/schedule/${event.id}`} key={event.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="break-words font-bold text-slate-900">{event.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{formatDate(event.date)} {event.startTime} - {event.endTime}</p>
              <p className="mt-1 text-sm text-slate-500">{event.venue || "会場未設定"}</p>
            </div>
            <StatusPill label={scheduleService.eventTypeLabels[event.eventType]} tone={scheduleService.eventTypeTones[event.eventType]} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <Link
      className={`block rounded-md border bg-white p-4 shadow-sm ${announcement.importance === "urgent" ? "border-rose-300" : "border-jc-line"}`}
      href={`/announcements/${announcement.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-bold text-slate-900">{announcement.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{announcement.body}</p>
          <p className="mt-2 text-xs text-slate-500">{formatDate(announcement.publishStartAt)}</p>
        </div>
        <StatusPill
          label={announcementService.announcementImportanceLabels[announcement.importance]}
          tone={announcementService.announcementImportanceTones[announcement.importance]}
        />
      </div>
    </Link>
  );
}

function DashboardSection({ title, actionLabel, actionHref, children }: { title: string; actionLabel: string; actionHref: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-jc-navy">{title}</h2>
        <Link className="flex min-h-10 shrink-0 items-center px-2 text-sm font-bold text-jc-blue" href={actionHref}>{actionLabel}</Link>
      </div>
      {children}
    </section>
  );
}

function SummaryLink({ href, label, value, tone }: { href: string; label: string; value: number; tone: "red" | "amber" | "blue" }) {
  const colors = {
    red: "text-rose-700 border-rose-200 bg-rose-50",
    amber: "text-amber-800 border-amber-200 bg-amber-50",
    blue: "text-jc-blue border-blue-200 bg-jc-sky",
  };
  return (
    <Link className={`rounded-md border p-3 text-center ${colors[tone]}`} href={href}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold">{label}</p>
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-jc-line bg-white p-5 text-center text-sm text-slate-500">{text}</p>;
}

function formatToday() {
  return new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" }).format(new Date());
}

function formatDate(value?: string) {
  if (!value) return "未設定";
  return new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric", timeZone: "Asia/Tokyo" }).format(new Date(value));
}
