import { AnnouncementForm } from "@/components/AnnouncementForm";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

export default function NewAnnouncementPage() {
  return (
    <AppShell>
      <PageHeader
        backHref="/announcements"
        description="年度、LOM、委員会、公開範囲を指定してお知らせを作成します。保存処理はSupabase接続時に実装します。"
        title="お知らせ作成"
      />
      <AnnouncementForm mode="create" />
    </AppShell>
  );
}
