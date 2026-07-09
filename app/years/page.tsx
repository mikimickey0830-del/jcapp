import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { useYears } from "@/hooks/useYears";

const statusTone = {
  current: "green",
  planned: "amber",
  closed: "blue"
} as const;

export default function YearsPage() {
  const { fiscalYears, fiscalYearStatusLabels } = useYears();

  return (
    <AppShell>
      <PageHeader
        action={{ href: "/years/new", label: "新年度作成" }}
        description="年度ごとの役職、委員会、会員所属、権限を管理します。会員基本情報は年度をまたいで共通です。"
        title="年度管理"
      />

      <section className="grid grid-cols-3 gap-3">
        <SummaryCard label="年度数" value={String(fiscalYears.length)} />
        <SummaryCard label="現在" value="2026" />
        <SummaryCard label="LOM" value="1" />
      </section>

      <section className="mt-5 space-y-3">
        {fiscalYears.map((fiscalYear) => (
          <Link
            className="block rounded-md border border-jc-line bg-white p-4 shadow-sm transition hover:border-jc-blue hover:shadow-soft"
            href={`/years/${fiscalYear.year}`}
            key={fiscalYear.year}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">{fiscalYear.lomName}</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{fiscalYear.name}</h2>
              </div>
              <StatusPill
                label={fiscalYearStatusLabels[fiscalYear.status]}
                tone={statusTone[fiscalYear.status]}
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <MiniStat label="役職" value={String(fiscalYear.positions.length)} />
              <MiniStat label="委員会" value={String(fiscalYear.committees.length)} />
              <MiniStat label="年度所属" value={String(fiscalYear.assignments.length)} />
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              {fiscalYear.startsOn} - {fiscalYear.endsOn}
              {fiscalYear.copiedFromYear ? ` / ${fiscalYear.copiedFromYear}年度からコピー` : ""}
            </p>
          </Link>
        ))}
      </section>
    </AppShell>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2 text-center">
      <p className="text-base font-bold text-jc-navy">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}
