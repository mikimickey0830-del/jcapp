import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { memberService } from "@/services/memberService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusTone = {
  active: "green",
  inactive: "amber",
  graduated: "blue"
} as const;

export default async function MemberDetailPage({ params }: { params: { memberId: string } }) {
  noStore();
  const { data: member, error, source } = await memberService.getMemberById(params.memberId);
  const { roleLabels, statusLabels } = memberService;

  if (!member) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        action={{ href: `/members/${member.id}/edit`, label: "編集" }}
        backHref="/members"
        description="会員基本情報と年度別情報を分けて確認できます。役職、委員会、権限は年度ごとに管理します。"
        title={`${member.lastName} ${member.firstName}`}
      />

      <DataSourceNotice error={error} source={source} />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {member.lastNameKana} {member.firstNameKana}
            </p>
            <h2 className="mt-1 text-xl font-bold text-jc-navy">
              {member.lastName} {member.firstName}
            </h2>
          </div>
          <StatusPill label={statusLabels[member.status]} tone={statusTone[member.status]} />
        </div>

        <dl className="mt-5 grid gap-3">
          <InfoRow label="メール" value={member.email} />
          <InfoRow label="電話番号" value={member.phone} />
          <InfoRow label="所属LOM" value={member.lomName} />
          <InfoRow label="入会年度" value={`${member.joinedYear}年度`} />
        </dl>
      </section>

      <section className="mt-5">
        <h2 className="text-lg font-bold text-jc-navy">年度別情報</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          役職、委員会、権限は年度ごとに管理します。新年度作成時は前年度コピーの対象になります。
        </p>
        <div className="mt-3 space-y-3">
          {member.annualProfiles.map((profile) => (
            <article className="rounded-md border border-jc-line bg-white p-4 shadow-sm" key={profile.fiscalYear}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-slate-900">{profile.fiscalYear}年度</h3>
                <StatusPill label={roleLabels[profile.role]} />
              </div>
              <dl className="mt-3 grid gap-2 text-sm">
                <InfoRow label="委員会" value={profile.committee} />
                <InfoRow label="役職" value={profile.position} />
              </dl>
            </article>
          ))}
        </div>
      </section>

      <Link
        className="mt-5 flex min-h-12 items-center justify-center rounded-md bg-jc-navy px-4 text-sm font-bold text-white"
        href="/members"
      >
        会員一覧へ
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
