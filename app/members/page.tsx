import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { memberService } from "@/services/memberService";

export const dynamic = "force-dynamic";

const statusTone = {
  active: "green",
  inactive: "amber",
  graduated: "blue"
} as const;

export default async function MembersPage() {
  const { data: members, error, source } = await memberService.getMembers();
  const { getCurrentAnnualProfile, roleLabels, statusLabels } = memberService;
  const activeCount = members.filter((member) => member.status === "active").length;

  return (
    <AppShell>
      <PageHeader
        action={{ href: "/members/new", label: "新規登録" }}
        description="会員の基本情報を管理します。年度ごとの役職、委員会、権限は年度管理側で別管理します。"
        title="会員管理"
      />

      <DataSourceNotice error={error} source={source} />

      <section className="grid grid-cols-3 gap-3">
        <SummaryCard label="会員数" value={String(members.length)} />
        <SummaryCard label="在籍" value={String(activeCount)} />
        <SummaryCard label="年度" value="2026" />
      </section>

      <section className="mt-5 space-y-3">
        {members.map((member) => {
          const annualProfile = getCurrentAnnualProfile(member);

          return (
            <Link
              className="block rounded-md border border-jc-line bg-white p-4 shadow-sm transition hover:border-jc-blue hover:shadow-soft"
              href={`/members/${member.id}`}
              key={member.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    {member.lastNameKana} {member.firstNameKana}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {member.lastName} {member.firstName}
                  </h2>
                </div>
                <StatusPill label={statusLabels[member.status]} tone={statusTone[member.status]} />
              </div>

              <div className="mt-3 rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">2026年度情報</p>
                <p className="mt-1 text-sm font-bold text-jc-navy">
                  {annualProfile?.committee ?? "未設定"} / {annualProfile?.position ?? "未設定"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  権限: {annualProfile ? roleLabels[annualProfile.role] : "未設定"}
                </p>
              </div>

              <div className="mt-3 grid gap-1 text-sm text-slate-600">
                <span>{member.email}</span>
                <span>{member.phone}</span>
              </div>
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
