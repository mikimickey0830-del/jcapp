import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { useMember } from "@/hooks/useMembers";
import { useYear } from "@/hooks/useYears";

const statusTone = {
  current: "green",
  planned: "amber",
  closed: "blue"
} as const;

export default function YearDetailPage({ params }: { params: { year: string } }) {
  const { fiscalYear, getAssignmentRows, fiscalYearStatusLabels } = useYear(params.year);
  const { roleLabels } = useMember("m001");

  if (!fiscalYear) {
    notFound();
  }

  const assignmentRows = getAssignmentRows(fiscalYear);

  return (
    <AppShell>
      <PageHeader
        action={{ href: "/years/new", label: "次年度作成" }}
        backHref="/years"
        description="この年度だけで使う役職、委員会、会員ごとの所属・役職・権限を確認します。"
        title={fiscalYear.name}
      />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">{fiscalYear.lomName}</p>
            <h2 className="mt-1 text-xl font-bold text-jc-navy">{fiscalYear.name}</h2>
          </div>
          <StatusPill
            label={fiscalYearStatusLabels[fiscalYear.status]}
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
        <SummaryCard label="年度所属" value={String(fiscalYear.assignments.length)} />
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-jc-navy">役職</h2>
        <div className="mt-3 grid gap-2">
          {fiscalYear.positions.map((position) => (
            <div
              className="flex min-h-11 items-center justify-between rounded-md border border-jc-line bg-white px-3"
              key={position.id}
            >
              <span className="text-sm font-bold text-slate-800">{position.name}</span>
              <span className="text-xs font-semibold text-slate-500">#{position.sortOrder}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-jc-navy">委員会</h2>
        <div className="mt-3 grid gap-2">
          {fiscalYear.committees.map((committee) => (
            <div
              className="flex min-h-11 items-center justify-between rounded-md border border-jc-line bg-white px-3"
              key={committee.id}
            >
              <span className="text-sm font-bold text-slate-800">{committee.name}</span>
              <span className="text-xs font-semibold text-slate-500">#{committee.sortOrder}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-jc-navy">会員ごとの年度情報</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          会員基本情報は共通で、所属、役職、権限だけを年度ごとに持ちます。
        </p>
        <div className="mt-3 space-y-3">
          {assignmentRows.map((assignment) => (
            <article className="rounded-md border border-jc-line bg-white p-4 shadow-sm" key={assignment.memberId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{assignment.memberKana}</p>
                  <h3 className="mt-1 font-bold text-slate-900">{assignment.memberName}</h3>
                </div>
                <StatusPill label={roleLabels[assignment.role]} />
              </div>
              <dl className="mt-3 grid gap-2">
                <InfoRow label="委員会" value={assignment.committeeName} />
                <InfoRow label="役職" value={assignment.positionName} />
                <InfoRow label="理事" value={assignment.isBoardMember ? "対象" : "対象外"} />
              </dl>
            </article>
          ))}
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
