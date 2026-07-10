import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { EventForm } from "@/components/EventForm";
import { PageHeader } from "@/components/PageHeader";
import { scheduleService } from "@/services/scheduleService";

// Form options depend on the current fiscal-year master data.
export const dynamic = "force-dynamic";

export default async function NewScheduleEventPage() {
  noStore();
  const optionsResult = await scheduleService.getFormOptions();

  return (
    <AppShell>
      <PageHeader
        backHref="/schedule"
        description="年度、対象委員会、対象役職、個別会員を指定してイベントを作成します。"
        title="イベント作成"
      />
      <DataSourceNotice error={optionsResult.error} source={optionsResult.source} />
      <EventForm mode="create" options={optionsResult.data} />
    </AppShell>
  );
}

function DataSourceNotice({ error, source }: { error: string | null; source: "supabase" | "fallback" }) {
  if (!error && source === "supabase") return null;

  return (
    <section className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
      {error ?? "Supabaseに接続できないため、候補は仮データを表示しています。"}
    </section>
  );
}
