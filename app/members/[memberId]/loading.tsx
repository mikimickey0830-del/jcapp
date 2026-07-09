import { AppShell } from "@/components/AppShell";

export default function MemberDetailLoading() {
  return (
    <AppShell>
      <section className="rounded-md border border-jc-line bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-jc-navy">会員詳細を読み込んでいます</p>
        <div className="mt-4 space-y-3">
          <div className="h-8 animate-pulse rounded-md bg-slate-100" />
          <div className="h-28 animate-pulse rounded-md bg-slate-100" />
          <div className="h-20 animate-pulse rounded-md bg-slate-100" />
        </div>
      </section>
    </AppShell>
  );
}
