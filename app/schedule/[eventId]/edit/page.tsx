import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { EventForm } from "@/components/EventForm";
import { PageHeader } from "@/components/PageHeader";
import { scheduleService } from "@/services/scheduleService";

export default async function EditScheduleEventPage({ params }: { params: { eventId: string } }) {
  noStore();
  const [eventResult, optionsResult] = await Promise.all([
    scheduleService.getEventById(params.eventId),
    scheduleService.getFormOptions()
  ]);
  const event = eventResult.data;

  if (!event) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        backHref={`/schedule/${event.id}`}
        description="イベント情報、対象者、出欠期限、運営情報を編集します。"
        title="イベント編集"
      />
      <DataSourceNotice
        error={eventResult.error ?? optionsResult.error}
        source={eventResult.source === "fallback" || optionsResult.source === "fallback" ? "fallback" : "supabase"}
      />
      <EventForm event={event} mode="edit" options={optionsResult.data} />
    </AppShell>
  );
}

function DataSourceNotice({ error, source }: { error: string | null; source: "supabase" | "fallback" }) {
  if (!error && source === "supabase") return null;

  return (
    <section className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
      {error ?? "Supabaseに接続できないため、一部に仮データを表示しています。"}
    </section>
  );
}
