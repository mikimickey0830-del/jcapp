import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { useNotifications } from "@/hooks/useNotifications";

const notificationTypeTones = {
  attendance_deadline: "red",
  event_today: "amber",
  document_added: "green",
  announcement: "blue",
  system: "blue"
} as const;

export default function NotificationsPage() {
  const { notifications, unreadNotifications, notificationTypeLabels, notificationStatusLabels } = useNotifications();

  return (
    <AppShell>
      <PageHeader
        description="出欠期限、イベント当日、資料追加、お知らせ、システム通知を確認します。"
        title="通知"
      />

      <section className="grid grid-cols-3 gap-3">
        <SummaryCard label="通知数" value={String(notifications.length)} />
        <SummaryCard label="未読" value={String(unreadNotifications.length)} />
        <SummaryCard label="年度" value="2026" />
      </section>

      <section className="mt-5 space-y-3">
        {notifications.map((notification) => (
          <Link
            className="block rounded-md border border-jc-line bg-white p-4 shadow-sm transition hover:border-jc-blue hover:shadow-soft"
            href={notification.relatedHref ?? "/notifications"}
            key={notification.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">{notification.createdAt}</p>
                <h2 className="mt-1 text-base font-bold text-slate-900">{notification.title}</h2>
              </div>
              <StatusPill
                label={notificationTypeLabels[notification.type]}
                tone={notificationTypeTones[notification.type]}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{notification.body}</p>
            <p className="mt-3 text-xs font-bold text-jc-blue">
              {notificationStatusLabels[notification.status]}
            </p>
          </Link>
        ))}
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
