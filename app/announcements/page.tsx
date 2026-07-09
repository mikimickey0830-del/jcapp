import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { useAnnouncements } from "@/hooks/useAnnouncements";

export default function AnnouncementsPage() {
  const {
    announcements,
    announcementImportanceLabels,
    announcementImportanceTones,
    announcementTypeLabels,
    announcementTypeTones,
    announcementVisibilityLabels,
    getAnnouncementAuthor
  } = useAnnouncements();

  return (
    <AppShell>
      <PageHeader
        action={{ href: "/announcements/new", label: "新規作成" }}
        description="連絡事項、例会案内、締切案内、資料追加案内を年度・LOM・委員会に紐づけて管理します。"
        title="お知らせ"
      />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">お知らせ検索</span>
          <input
            className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="タイトル・本文で検索"
            type="search"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <select className="min-h-12 rounded-md border border-jc-line bg-slate-50 px-3 text-sm font-semibold text-slate-700">
            <option>すべての種別</option>
            {Object.values(announcementTypeLabels).map((label) => (
              <option key={label}>{label}</option>
            ))}
          </select>
          <select className="min-h-12 rounded-md border border-jc-line bg-slate-50 px-3 text-sm font-semibold text-slate-700">
            <option>すべての公開範囲</option>
            {Object.values(announcementVisibilityLabels).map((label) => (
              <option key={label}>{label}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3">
        <SummaryCard label="件数" value={String(announcements.length)} />
        <SummaryCard
          label="重要以上"
          value={String(announcements.filter((announcement) => announcement.importance !== "normal").length)}
        />
        <SummaryCard label="年度" value="2026" />
      </section>

      <section className="mt-5 space-y-3">
        {announcements.map((announcement) => (
          <Link
            className="block rounded-md border border-jc-line bg-white p-4 shadow-sm transition hover:border-jc-blue hover:shadow-soft"
            href={`/announcements/${announcement.id}`}
            key={announcement.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">
                  {announcement.fiscalYear}年度 / {announcement.targetLom}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{announcement.title}</h2>
              </div>
              <StatusPill
                label={announcementImportanceLabels[announcement.importance]}
                tone={announcementImportanceTones[announcement.importance]}
              />
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{announcement.body}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill label={announcementTypeLabels[announcement.type]} tone={announcementTypeTones[announcement.type]} />
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {announcementVisibilityLabels[announcement.visibility]}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              {announcement.publishStartAt} / {getAnnouncementAuthor(announcement)}
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
