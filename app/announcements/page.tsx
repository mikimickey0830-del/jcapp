import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { announcementService } from "@/services/announcementService";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  noStore();
  const result = await announcementService.getAnnouncements();
  const announcements = result.data;
  const importantCount = announcements.filter((announcement) => announcement.importance !== "normal").length;
  const fiscalYearCount = new Set(announcements.map((announcement) => announcement.fiscalYearId)).size;

  return (
    <AppShell>
      <PageHeader
        action={{ href: "/announcements/new", label: "新規作成" }}
        description="全体連絡、例会案内、締切案内、資料追加案内を年度・LOM・委員会単位で管理します。"
        title="お知らせ"
      />

      <DataSourceNotice error={result.error} source={result.source} />

      <section className="grid grid-cols-3 gap-3">
        <SummaryCard label="お知らせ" value={String(announcements.length)} />
        <SummaryCard label="重要・至急" value={String(importantCount)} />
        <SummaryCard label="対象年度" value={String(fiscalYearCount)} />
      </section>

      <section className="mt-5 space-y-3">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <Link
              className="block rounded-md border border-jc-line bg-white p-4 shadow-sm transition hover:border-jc-blue hover:shadow-soft"
              href={`/announcements/${announcement.id}`}
              key={announcement.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">
                    {announcement.fiscalYearName} / {announcement.targetLom}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{announcement.title}</h2>
                </div>
                <StatusPill
                  label={announcementService.announcementImportanceLabels[announcement.importance]}
                  tone={announcementService.announcementImportanceTones[announcement.importance]}
                />
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{announcement.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill
                  label={announcementService.announcementTypeLabels[announcement.type]}
                  tone={announcementService.announcementTypeTones[announcement.type]}
                />
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {announcementService.announcementVisibilityLabels[announcement.visibility]}
                </span>
                {announcement.targetCommittee ? (
                  <span className="rounded-full bg-jc-sky px-2.5 py-1 text-xs font-semibold text-jc-blue">
                    {announcement.targetCommittee}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                {formatDateTime(announcement.publishStartAt)} / {announcement.authorMemberName}
              </p>
            </Link>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-jc-line bg-white p-4 text-sm leading-6 text-slate-600">
            表示できるお知らせはありません。
          </p>
        )}
      </section>
    </AppShell>
  );
}

function DataSourceNotice({ error, source }: { error: string | null; source: "supabase" | "fallback" }) {
  if (!error && source === "supabase") return null;
  return <section className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">{error}</section>;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-jc-line bg-white p-3 text-center shadow-sm">
      <p className="text-2xl font-bold text-jc-blue">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
    </article>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
