import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { useAnnouncement } from "@/hooks/useAnnouncements";

export default function AnnouncementDetailPage({ params }: { params: { id: string } }) {
  const {
    announcement,
    announcementImportanceLabels,
    announcementImportanceTones,
    announcementTypeLabels,
    announcementTypeTones,
    announcementVisibilityLabels,
    getAnnouncementAuthor
  } = useAnnouncement(params.id);

  if (!announcement) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        action={{ href: `/announcements/${announcement.id}/edit`, label: "編集" }}
        backHref="/announcements"
        description="公開範囲、対象年度、対象委員会、通知連動に必要な情報を確認します。"
        title={announcement.title}
      />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <StatusPill label={announcementTypeLabels[announcement.type]} tone={announcementTypeTones[announcement.type]} />
          <StatusPill
            label={announcementImportanceLabels[announcement.importance]}
            tone={announcementImportanceTones[announcement.importance]}
          />
        </div>

        <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-slate-800">{announcement.body}</p>

        <dl className="mt-6 grid gap-3">
          <InfoRow label="対象年度" value={`${announcement.fiscalYear}年度`} />
          <InfoRow label="対象LOM" value={announcement.targetLom} />
          <InfoRow label="対象委員会" value={announcement.targetCommittee ?? "指定なし"} />
          <InfoRow label="公開範囲" value={announcementVisibilityLabels[announcement.visibility]} />
          <InfoRow label="公開開始" value={announcement.publishStartAt} />
          <InfoRow label="公開終了" value={announcement.publishEndAt ?? "指定なし"} />
          <InfoRow label="作成者" value={getAnnouncementAuthor(announcement)} />
          <InfoRow label="作成日時" value={announcement.createdAt} />
          <InfoRow label="更新日時" value={announcement.updatedAt} />
        </dl>
      </section>

      <section className="mt-5 rounded-md border border-dashed border-jc-line bg-jc-sky p-4">
        <h2 className="text-base font-bold text-jc-navy">通知連動</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          通知作成時は notificationType: {announcement.notificationType}、relatedHref: /announcements/{announcement.id} を利用します。
        </p>
      </section>

      <Link
        className="mt-5 flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700"
        href="/announcements"
      >
        お知らせ一覧へ
      </Link>
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[104px_1fr] gap-3">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
