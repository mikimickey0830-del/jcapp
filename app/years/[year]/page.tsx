import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { yearService } from "@/services/yearService";
import type { AnnualRole } from "@/types/common";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusTone = {
  current: "green",
  planned: "amber",
  closed: "blue"
} as const;

const roleLabels: Record<AnnualRole, string> = {
  member: "会員",
  vice_chair: "副委員長",
  chair: "委員長",
  secretary: "専務理事",
  president: "理事長",
  admin: "管理者",
  owner: "管理者",
  committee_manager: "委員長"
};

export default async function YearDetailPage({ params }: { params: { year: string } }) {
  noStore();
  const { data: fiscalYear, error, source } = await yearService.getYearByValue(params.year);

  if (!fiscalYear) {
    notFound();
  }

  const assignmentRows = yearService.getAssignmentRows(fiscalYear);

  return (
    <AppShell>
      <PageHeader
        action={{ href: "/years/new", label: "次年度作成" }}
        backHref="/years"
        description="この年度だけで使う役職、委員会、会員ごとの所属と権限を確認します。"
        title={fiscalYear.name}
      />

      <DataSourceNotice error={error} source={source} />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">{fiscalYear.lomName}</p>
            <h2 className="mt-1 text-xl font-bold text-jc-navy">{fiscalYear.name}</h2>
          </div>
          <StatusPill
            label={yearService.fiscalYearStatusLabels[fiscalYear.status]}
            tone={statusTone[fiscalYear.status]}
          />
        </div>
        <dl className="mt-4 grid gap-3">
          <InfoRow label="期間" value={`${fiscalYear.startsOn} - ${fiscalYear.endsOn}`} />
          <InfoRow
            label="コピー元"
            value={fiscalYear.copiedFromYear ? `${fiscalYear.copiedFromYear}年度` : "なし"}
          />
        </dl>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3">
        <SummaryCard label="役職" value={String(fiscalYear.positions.length)} />
        <SummaryCard label="委員会" value={String(fiscalYear.committees.length)} />
        <SummaryCard label="所属" value={String(fiscalYear.assignments.length)} />
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-jc-navy">役職</h2>
        <div className="mt-3 grid gap-2">
          {fiscalYear.positions.length > 0 ? (
            fiscalYear.positions.map((position) => (
              <div
                className="flex min-h-11 items-center justify-between rounded-md border border-jc-line bg-white px-3"
                key={position.id}
              >
                <span className="text-sm font-bold text-slate-800">{position.name}</span>
                <span className="text-xs font-semibold text-slate-500">#{position.sortOrder}</span>
              </div>
            ))
          ) : (
            <EmptyMessage text="この年度には役職がまだ登録されていません。" />
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-jc-navy">委員会</h2>
        <div className="mt-3 grid gap-2">
          {fiscalYear.committees.length > 0 ? (
            fiscalYear.committees.map((committee) => (
              <div
                className="flex min-h-11 items-center justify-between rounded-md border border-jc-line bg-white px-3"
                key={committee.id}
              >
                <span className="text-sm font-bold text-slate-800">{committee.name}</span>
                <span className="text-xs font-semibold text-slate-500">#{committee.sortOrder}</span>
              </div>
            ))
          ) : (
            <EmptyMessage text="この年度には委員会がまだ登録されていません。" />
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-jc-navy">会員ごとの年度情報</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          会員基本情報は共通のまま、所属、役職、権限だけを年度ごとに持ちます。
        </p>
        <div className="mt-3 space-y-3">
          {assignmentRows.length > 0 ? (
            assignmentRows.map((assignment) => (
              <article className="rounded-md border border-jc-line bg-white p-4 shadow-sm" key={assignment.memberId}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">{assignment.memberKana}</p>
                    <h3 className="mt-1 font-bold text-slate-900">{assignment.memberName}</h3>
                  </div>
                  <StatusPill label={roleLabels[assignment.role]} />
                </div>
                <dl className="mt-3 grid gap-2">
                  <InfoRow label="委員会" value={assignment.committeeName ?? "未設定"} />
                  <InfoRow label="役職" value={assignment.positionName ?? "未設定"} />
                  <InfoRow label="理事" value={assignment.isBoardMember ? "対象" : "対象外"} />
                </dl>
              </article>
            ))
          ) : (
            <EmptyMessage text="この年度には会員所属がまだ登録されていません。" />
          )}
        </div>
      </section>

      <Link
        className="mt-5 flex min-h-12 items-center justify-center rounded-md bg-jc-navy px-4 text-sm font-bold text-white"
        href="/years"
      >
        年度一覧へ
      </Link>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-3">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-dashed border-jc-line bg-slate-50 p-3 text-sm leading-6 text-slate-600">
      {text}
    </p>
  );
}
