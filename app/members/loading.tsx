import { AppShell } from "@/components/AppShell";

export default function MembersLoading() {
  return (
    <AppShell>
      <section className="rounded-md border border-jc-line bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-jc-navy">会員情報を読み込んでいます</p>
        <div className="mt-4 space-y-3">
          <div className="h-16 animate-pulse rounded-md bg-slate-100" />
          <div className="h-16 animate-pulse rounded-md bg-slate-100" />
          <div className="h-16 animate-pulse rounded-md bg-slate-100" />
        </div>
      </section>
    </AppShell>
  );
}
