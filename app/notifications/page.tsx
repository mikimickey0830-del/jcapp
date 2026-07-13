import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { createClient } from "@/lib/supabase/server";
import { authService } from "@/services/authService";
import { notificationService } from "@/services/notificationService";

const notificationTypeTones = {
  attendance_deadline: "red",
  event_today: "amber",
  document_added: "green",
  announcement: "blue",
  system: "blue",
} as const;

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  noStore();
  const authContext = await authService.getCurrentAuthContext();
  const result = await notificationService.getNotifications(authContext.member?.id, createClient());
  const unreadCount = result.data.filter((item) => item.status === "unread").length;

  return (
    <AppShell>
      <PageHeader description="ログイン中の会員に届いた通知を表示します。" title="通知" />
      {!authContext.member ? (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          会員情報との紐付けがないため通知を表示できません。管理者へご連絡ください。
        </p>
      ) : null}
      {result.error ? (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{result.error}</p>
      ) : null}
      <section className="grid grid-cols-2 gap-3">
        <SummaryCard label="通知数" value={String(result.data.length)} />
        <SummaryCard label="未読" value={String(unreadCount)} />
      </section>
      <section className="mt-5 space-y-3">
        {result.data.map((notification) => (
          <Link className="block rounded-md border border-jc-line bg-white p-4 shadow-sm" href={notification.relatedHref ?? "/notifications"} key={notification.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">{formatDate(notification.createdAt)}</p>
                <h2 className="mt-1 text-base font-bold text-slate-900">{notification.title}</h2>
              </div>
              <StatusPill label={notificationService.notificationTypeLabels[notification.type]} tone={notificationTypeTones[notification.type]} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{notification.body}</p>
            <p className="mt-3 text-xs font-bold text-jc-blue">{notificationService.notificationStatusLabels[notification.status]}</p>
          </Link>
        ))}
        {result.data.length === 0 ? (
          <p className="rounded-md border border-dashed border-jc-line bg-white p-5 text-center text-sm text-slate-500">通知はありません。</p>
        ) : null}
      </section>
    </AppShell>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-jc-line bg-white p-3 text-center shadow-sm">
      <p className="text-2xl font-bold text-jc-blue">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
    </article>
  );
}
