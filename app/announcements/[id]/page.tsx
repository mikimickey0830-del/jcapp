import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { AnnouncementDeleteButton } from "@/components/AnnouncementDeleteButton";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { announcementService } from "@/services/announcementService";

export const dynamic = "force-dynamic";

export default async function AnnouncementDetailPage({ params }: { params: { id: string } }) {
  noStore();
  const result = await announcementService.getAnnouncementById(params.id);
  const announcement = result.data;

  if (!announcement) notFound();

  return (
    <AppShell>
      <PageHeader
        action={{ href: `/announcements/${announcement.id}/edit`, label: "編集" }}
        backHref="/announcements"
        description="対象年度、対象LOM、対象委員会、公開範囲を確認できます。"
        title={announcement.title}
      />

      <DataSourceNotice error={result.error} source={result.source} />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <StatusPill
            label={announcementService.announcementTypeLabels[announcement.type]}
            tone={announcementService.announcementTypeTones[announcement.type]}
          />
          <StatusPill
            label={announcementService.announcementImportanceLabels[announcement.importance]}
            tone={announcementService.announcementImportanceTones[announcement.importance]}
          />
        </div>

        <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-slate-800">{announcement.body}</p>

        <dl className="mt-6 grid gap-3">
          <InfoRow label="対象年度" value={announcement.fiscalYearName} />
          <InfoRow label="対象LOM" value={announcement.targetLom} />
          <InfoRow label="対象委員会" value={announcement.targetCommittee ?? "指定なし"} />
          <InfoRow label="公開範囲" value={announcementService.announcementVisibilityLabels[announcement.visibility]} />
          <InfoRow label="公開開始" value={formatDateTime(announcement.publishStartAt)} />
          <InfoRow label="公開終了" value={announcement.publishEndAt ? formatDateTime(announcement.publishEndAt) : "指定なし"} />
          <InfoRow label="作成者" value={announcement.authorMemberName} />
          <InfoRow label="作成日時" value={formatDateTime(announcement.createdAt)} />
          <InfoRow label="更新日時" value={formatDateTime(announcement.updatedAt)} />
        </dl>
      </section>

      <section className="mt-5 rounded-md border border-dashed border-jc-line bg-jc-sky p-4">
        <h2 className="text-base font-bold text-jc-navy">通知連動</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          通知機能を接続する際は、このお知らせIDと通知種別 announcement を使って対象会員ごとの通知を作成します。
        </p>
      </section>

      <Link
        className="mt-5 flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700"
        href="/announcements"
      >
        お知らせ一覧へ
      </Link>
      <AnnouncementDeleteButton announcementId={announcement.id} />
    </AppShell>
  );
}

function DataSourceNotice({ error, source }: { error: string | null; source: "supabase" | "fallback" }) {
  if (!error && source === "supabase") return null;
  return <section className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">{error}</section>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[104px_1fr] gap-3">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
