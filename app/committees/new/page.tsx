import { AppShell } from "@/components/AppShell";
import { CommitteeForm } from "@/components/CommitteeForm";
import { PageHeader } from "@/components/PageHeader";
import { committeeService } from "@/services/committeeService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewCommitteePage() {
  const { data: options, error, source } = await committeeService.getFormOptions();

  return (
    <AppShell>
      <PageHeader
        backHref="/committees"
        description="年度に紐づく委員会を作成し、委員長や委員を会員から選択します。"
        title="委員会作成"
      />
      <DataSourceNotice error={error} source={source} />
      <CommitteeForm mode="create" options={options} />
    </AppShell>
  );
}

function DataSourceNotice({ error, source }: { error: string | null; source: "supabase" | "fallback" }) {
  if (!error && source === "supabase") {
    return null;
  }

  return (
    <section className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
      {error ?? "Supabaseに接続できないため、候補は仮データを表示しています。"}
    </section>
  );
}
