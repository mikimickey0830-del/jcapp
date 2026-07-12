import { unstable_noStore as noStore } from "next/cache";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { announcementService } from "@/services/announcementService";

export const dynamic = "force-dynamic";

export default async function NewAnnouncementPage() {
  noStore();
  const optionsResult = await announcementService.getFormOptions();

  return (
    <AppShell>
      <PageHeader
        backHref="/announcements"
        description="年度、LOM、委員会、公開範囲を指定してお知らせを作成します。"
        title="お知らせ作成"
      />
      <DataSourceNotice error={optionsResult.error} source={optionsResult.source} />
      <AnnouncementForm mode="create" options={optionsResult.data} />
    </AppShell>
  );
}

function DataSourceNotice({ error, source }: { error: string | null; source: "supabase" | "fallback" }) {
  if (!error && source === "supabase") return null;
  return <section className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">{error}</section>;
}
