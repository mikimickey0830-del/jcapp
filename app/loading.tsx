import { AppShell } from "@/components/AppShell";

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="animate-pulse space-y-5" aria-label="ダッシュボードを読み込み中">
        <div className="h-24 rounded-md bg-slate-200" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-20 rounded-md bg-slate-200" />
          <div className="h-20 rounded-md bg-slate-200" />
          <div className="h-20 rounded-md bg-slate-200" />
        </div>
        <div className="h-28 rounded-md bg-slate-200" />
        <div className="h-28 rounded-md bg-slate-200" />
        <div className="h-28 rounded-md bg-slate-200" />
      </div>
    </AppShell>
  );
}
