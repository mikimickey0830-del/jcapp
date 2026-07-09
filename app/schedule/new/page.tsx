import { AppShell } from "@/components/AppShell";
import { EventForm } from "@/components/EventForm";
import { PageHeader } from "@/components/PageHeader";

export default function NewScheduleEventPage() {
  return (
    <AppShell>
      <PageHeader
        backHref="/schedule"
        description="年度とLOMに紐づくイベントを作成します。"
        title="イベント作成"
      />
      <EventForm mode="create" />
    </AppShell>
  );
}
