import { notFound } from "next/navigation";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useAnnouncement } from "@/hooks/useAnnouncements";

export default function EditAnnouncementPage({ params }: { params: { id: string } }) {
  const { announcement } = useAnnouncement(params.id);

  if (!announcement) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        backHref={`/announcements/${announcement.id}`}
        description="お知らせ内容、公開期間、対象範囲を編集します。通知済みのお知らせは将来、再通知の扱いを選べる設計にします。"
        title="お知らせ編集"
      />
      <AnnouncementForm announcement={announcement} mode="edit" />
    </AppShell>
  );
}
