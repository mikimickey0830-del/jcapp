import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { committeeService } from "@/services/committeeService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CommitteesPage() {
  noStore();
  const { data: committees, error, source } = await committeeService.getCommittees();
  const currentYear = committees.find((committee) => committee.fiscalYear)?.fiscalYear;

  return (
    <AppShell>
      <PageHeader
        action={{ href: "/committees/new", label: "新規作成" }}
        description="年度ごとに委員会、担当役員、委員長、副委員長、委員一覧を管理します。"
        title="委員会管理"
      />

      <DataSourceNotice error={error} source={source} />

      <section className="grid grid-cols-3 gap-3">
        <SummaryCard label="委員会" value={String(committees.length)} />
        <SummaryCard label="年度" value={currentYear ? String(currentYear) : "-"} />
        <SummaryCard label="LOM" value={String(new Set(committees.map((item) => item.lomName)).size)} />
      </section>

      <section className="mt-5 space-y-3">
        {committees.map((committee) => {
          const chair = committee.members.find((member) => member.role === "chair");

          return (
            <Link
              className="block rounded-md border border-jc-line bg-white p-4 shadow-sm transition hover:border-jc-blue hover:shadow-soft"
              href={`/committees/${committee.id}`}
              key={committee.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    {committee.fiscalYearName} / {committee.lomName}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{committee.name}</h2>
                </div>
                <StatusPill label={`${committee.members.length}名`} tone="blue" />
              </div>

              <div className="mt-3 rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">委員長</p>
                <p className="mt-1 text-sm font-bold text-jc-navy">
                  {chair ? `${chair.lastName} ${chair.firstName}` : "未設定"}
                </p>
              </div>

              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                {committee.description || "説明は未設定です。"}
              </p>
            </Link>
          );
        })}
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-jc-line bg-white p-3 text-center shadow-sm">
      <p className="text-2xl font-bold text-jc-blue">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
    </article>
  );
}
