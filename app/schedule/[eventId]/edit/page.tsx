import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EventForm } from "@/components/EventForm";
import { PageHeader } from "@/components/PageHeader";
import { useScheduleEvent } from "@/hooks/useSchedule";

export default function EditScheduleEventPage({ params }: { params: { eventId: string } }) {
  const { event } = useScheduleEvent(params.eventId);

  if (!event) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        backHref={`/schedule/${event.id}`}
        description="イベント情報と出欠設定を編集します。"
        title="イベント編集"
      />
      <EventForm event={event} mode="edit" />
    </AppShell>
  );
}
