import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { YearForm } from "@/components/YearForm";
import { yearService } from "@/services/yearService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewYearPage() {
  const { data: fiscalYears, error, source } = await yearService.getYears();

  return (
    <AppShell>
      <PageHeader
        backHref="/years"
        description="前年度をコピーして、新年度の役職、委員会、会員所属、年度権限の土台を作成します。"
        title="新年度作成"
      />
      <DataSourceNotice error={error} source={source} />
      <YearForm fiscalYears={fiscalYears} />
    </AppShell>
  );
}

function DataSourceNotice({ error, source }: { error: string | null; source: "supabase" | "fallback" }) {
  if (!error && source === "supabase") {
    return null;
  }

  return (
    <section className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
      {error ?? "Supabaseに接続できないため、コピー元の候補は仮データを表示しています。"}
    </section>
  );
}
