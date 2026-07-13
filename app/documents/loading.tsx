import { AppShell } from "@/components/AppShell";

export default function DocumentsLoading() {
  return (
    <AppShell>
      <div className="animate-pulse space-y-4" aria-label="資料を読み込み中">
        <div className="h-8 w-40 rounded-md bg-slate-200" />
        <div className="h-28 rounded-md bg-slate-200" />
        <div className="h-28 rounded-md bg-slate-200" />
        <div className="h-28 rounded-md bg-slate-200" />
      </div>
    </AppShell>
  );
}
