import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { announcementService } from "@/services/announcementService";

export const dynamic = "force-dynamic";

export default async function EditAnnouncementPage({ params }: { params: { id: string } }) {
  noStore();
  const [announcementResult, optionsResult] = await Promise.all([
    announcementService.getAnnouncementById(params.id),
    announcementService.getFormOptions()
  ]);
  const announcement = announcementResult.data;

  if (!announcement) notFound();

  return (
    <AppShell>
      <PageHeader
        backHref={`/announcements/${announcement.id}`}
        description="お知らせの内容、公開設定、対象者設定を更新します。"
        title="お知らせ編集"
      />
      <DataSourceNotice error={announcementResult.error ?? optionsResult.error} source={announcementResult.source} />
      <AnnouncementForm announcement={announcement} mode="edit" options={optionsResult.data} />
    </AppShell>
  );
}

function DataSourceNotice({ error, source }: { error: string | null; source: "supabase" | "fallback" }) {
  if (!error && source === "supabase") return null;
  return <section className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">{error}</section>;
}
