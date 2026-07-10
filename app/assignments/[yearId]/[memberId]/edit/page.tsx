import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AssignmentForm } from "@/components/AssignmentForm";
import { PageHeader } from "@/components/PageHeader";
import { assignmentService } from "@/services/assignmentService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditAssignmentPage({
  params
}: {
  params: { yearId: string; memberId: string };
}) {
  const [yearResult, optionsResult] = await Promise.all([
    assignmentService.getAssignmentYear(params.yearId),
    assignmentService.getAssignmentFormOptions(params.yearId, params.memberId)
  ]);

  const assignment = yearResult.data?.rows.find((row) => row.memberId === params.memberId);

  if (!assignment || !optionsResult.data) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        backHref={`/assignments/${assignment.fiscalYearId}`}
        description="会員の年度ごとの所属委員会、役職、権限、有効状態を編集します。"
        title="年度所属編集"
      />
      <DataSourceNotice
        error={yearResult.error ?? optionsResult.error}
        source={yearResult.source === "fallback" || optionsResult.source === "fallback" ? "fallback" : "supabase"}
      />
      <AssignmentForm assignment={assignment} options={optionsResult.data} />
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
