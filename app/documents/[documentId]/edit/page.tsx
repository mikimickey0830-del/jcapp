import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DocumentForm } from "@/components/DocumentForm";
import { PageHeader } from "@/components/PageHeader";
import { documentService } from "@/services/documentService";

export const dynamic = "force-dynamic";

export default async function EditDocumentPage({
  params,
}: {
  params: { documentId: string };
}) {
  noStore();
  const result = await documentService.getDocumentById(params.documentId);
  const document = result.data;
  if (!document) notFound();

  return (
    <AppShell>
      <PageHeader
        backHref={`/documents/${document.id}`}
        description="資料情報、年度、関連イベント、公開範囲を編集します。"
        title="資料編集"
      />
      {result.error ? (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {result.error}
        </p>
      ) : null}
      <DocumentForm document={document} mode="edit" />
    </AppShell>
  );
}
