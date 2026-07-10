import { AppShell } from "@/components/AppShell";

export default function AttendanceLoading() {
  return (
    <AppShell>
      <div className="space-y-3">
        <div className="h-8 w-32 animate-pulse rounded-md bg-slate-200" />
        <div className="h-20 animate-pulse rounded-md bg-white" />
        <div className="h-28 animate-pulse rounded-md bg-white" />
        <div className="h-28 animate-pulse rounded-md bg-white" />
      </div>
    </AppShell>
  );
}
