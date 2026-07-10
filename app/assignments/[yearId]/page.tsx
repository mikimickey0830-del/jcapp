import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { assignmentService } from "@/services/assignmentService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssignmentYearPage({ params }: { params: { yearId: string } }) {
  noStore();
  const { data: assignmentYear, error, source } = await assignmentService.getAssignmentYear(params.yearId);

  if (!assignmentYear) {
    notFound();
  }

  const activeCount = assignmentYear.rows.filter((row) => row.isActive).length;

  return (
    <AppShell>
      <PageHeader
        backHref="/assignments"
        description="会員を選んで、この年度の所属委員会、役職、権限を編集します。"
        title={`${assignmentYear.fiscalYearName} 所属`}
      />

      <DataSourceNotice error={error} source={source} />

      <section className="grid grid-cols-3 gap-3">
        <SummaryCard label="会員" value={String(assignmentYear.rows.length)} />
        <SummaryCard label="有効" value={String(activeCount)} />
        <SummaryCard label="未設定" value={String(assignmentYear.rows.length - activeCount)} />
      </section>

      <section className="mt-5 space-y-3">
        {assignmentYear.rows.map((row) => (
          <Link
            className="block rounded-md border border-jc-line bg-white p-4 shadow-sm transition hover:border-jc-blue hover:shadow-soft"
            href={`/assignments/${assignmentYear.fiscalYearId}/${row.memberId}/edit`}
            key={row.memberId}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">{row.memberKana}</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{row.memberName}</h2>
                <p className="mt-1 truncate text-xs text-slate-500">{row.memberEmail}</p>
              </div>
              <StatusPill label={row.isActive ? "有効" : "未設定"} tone={row.isActive ? "green" : "amber"} />
            </div>

            <div className="mt-3 grid gap-2 rounded-md bg-slate-50 p-3 text-sm">
              <InfoLine label="委員会" value={row.committeeName} />
              <InfoLine label="役職" value={row.positionName} />
              <InfoLine label="権限" value={assignmentService.roleLabels[row.role]} />
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-jc-line bg-white p-3 text-center shadow-sm">
      <p className="text-2xl font-bold text-jc-blue">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
    </article>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="grid grid-cols-[64px_1fr] gap-2">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="min-w-0 break-words font-bold text-jc-navy">{value}</span>
    </p>
  );
}
