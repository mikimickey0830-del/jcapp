import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { CommitteeForm } from "@/components/CommitteeForm";
import { PageHeader } from "@/components/PageHeader";
import { committeeService } from "@/services/committeeService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditCommitteePage({ params }: { params: { id: string } }) {
  noStore();
  const [{ data: committee, error: committeeError, source: committeeSource }, optionsResult] = await Promise.all([
    committeeService.getCommitteeById(params.id),
    committeeService.getFormOptions()
  ]);

  if (!committee) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        backHref={`/committees/${committee.id}`}
        description="委員会名、説明、担当役員、委員長、副委員長、委員一覧を編集します。"
        title="委員会編集"
      />
      <DataSourceNotice
        error={committeeError ?? optionsResult.error}
        source={committeeSource === "fallback" || optionsResult.source === "fallback" ? "fallback" : "supabase"}
      />
      <CommitteeForm committee={committee} mode="edit" options={optionsResult.data} />
    </AppShell>
  );
}

function DataSourceNotice({ error, source }: { error: string | null; source: "supabase" | "fallback" }) {
  if (!error && source === "supabase") {
    return null;
  }

  return (
    <section className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
      {error ?? "Supabaseに接続できないため、一部に仮データを表示しています。"}
    </section>
  );
}
