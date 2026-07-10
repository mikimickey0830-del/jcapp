import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { assignmentService } from "@/services/assignmentService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssignmentsPage() {
  noStore();
  const { data: years, error, source } = await assignmentService.getAssignmentSummaries();

  return (
    <AppShell>
      <PageHeader
        description="年度を選んで、会員ごとの所属委員会、役職、権限、有効状態を管理します。"
        title="年度所属管理"
      />

      <DataSourceNotice error={error} source={source} />

      <section className="space-y-3">
        {years.map((year) => (
          <Link
            className="block rounded-md border border-jc-line bg-white p-4 shadow-sm transition hover:border-jc-blue hover:shadow-soft"
            href={`/assignments/${year.fiscalYearId}`}
            key={year.fiscalYearId}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">{year.lomName}</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{year.fiscalYearName}</h2>
              </div>
              <StatusPill label={`${year.activeCount}名有効`} tone="green" />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <MiniStat label="会員" value={String(year.memberCount)} />
              <MiniStat label="設定済" value={String(year.assignmentCount)} />
              <MiniStat label="無効" value={String(year.inactiveCount)} />
            </div>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}

function DataSourceNotice({ error, source }: { error: string | null; source: "supabase" | "fallback" }) {
  if (!error && source === "supabase") {
    return null;
  }

  return (
    <section className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
      {error ?? "Supabaseに該当データがないため、仮データを表示しています。"}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2 text-center">
      <p className="text-base font-bold text-jc-navy">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}
