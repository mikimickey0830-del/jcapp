import { AppShell } from "@/components/AppShell";

export default function AttendanceEventLoading() {
  return (
    <AppShell>
      <div className="space-y-3">
        <div className="h-8 w-40 animate-pulse rounded-md bg-slate-200" />
        <div className="h-32 animate-pulse rounded-md bg-white" />
        <div className="h-24 animate-pulse rounded-md bg-white" />
        <div className="h-24 animate-pulse rounded-md bg-white" />
      </div>
    </AppShell>
  );
}
