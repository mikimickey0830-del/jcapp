import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { CommitteeDeleteButton } from "@/components/CommitteeDeleteButton";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { committeeRoleLabels } from "@/lib/assignments";
import { committeeService } from "@/services/committeeService";
import type { CommitteeDetail, CommitteeMemberRole } from "@/types/committee";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CommitteeDetailPage({ params }: { params: { id: string } }) {
  noStore();
  const { data: committee, error, source } = await committeeService.getCommitteeById(params.id);

  if (!committee) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        action={{ href: `/committees/${committee.id}/edit`, label: "編集" }}
        backHref="/committees"
        description="委員会に所属する会員、委員会内の区分、主所属、備考を確認します。"
        title={committee.name}
      />

      <DataSourceNotice error={error} source={source} />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {committee.fiscalYearName} / {committee.lomName}
            </p>
            <h2 className="mt-1 text-xl font-bold text-jc-navy">{committee.name}</h2>
          </div>
          <StatusPill label={`${committee.members.length}名`} tone="blue" />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-700">{committee.description || "説明は未設定です。"}</p>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3">
        <SummaryCard label="委員長" value={personName(committee, "chair")} />
        <SummaryCard label="副委員長" value={personName(committee, "vice_chair")} />
        <SummaryCard label="主所属" value={String(committee.members.filter((member) => member.isPrimary).length)} />
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-jc-navy">所属会員一覧</h2>
        <div className="mt-3 space-y-3">
          {committee.members.length > 0 ? (
            committee.members.map((member) => (
              <article className="rounded-md border border-jc-line bg-white p-4 shadow-sm" key={member.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500">
                      {member.lastNameKana} {member.firstNameKana}
                    </p>
                    <h3 className="mt-1 font-bold text-slate-900">
                      {member.lastName} {member.firstName}
                    </h3>
                    <p className="mt-1 truncate text-xs text-slate-500">{member.email}</p>
                  </div>
                  <StatusPill
                    label={committeeRoleLabels[member.role]}
                    tone={member.role === "member" ? "blue" : "green"}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {member.isPrimary ? (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">主所属</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">兼任</span>
                  )}
                  {member.note ? (
                    <span className="rounded-full bg-jc-sky px-3 py-1 text-xs font-bold text-jc-blue">
                      {member.note}
                    </span>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-md border border-dashed border-jc-line bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              所属会員はまだ登録されていません。
            </p>
          )}
        </div>
      </section>

      <Link
        className="mt-5 flex min-h-12 items-center justify-center rounded-md bg-jc-navy px-4 text-sm font-bold text-white"
        href="/committees"
      >
        委員会一覧へ
      </Link>
      <CommitteeDeleteButton committeeId={committee.id} />
    </AppShell>
  );
}

function personName(committee: CommitteeDetail, role: CommitteeMemberRole) {
  const member = committee.members.find((item) => item.role === role);
  return member ? `${member.lastName}` : "-";
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
      <p className="truncate text-base font-bold text-jc-blue">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
    </article>
  );
}
