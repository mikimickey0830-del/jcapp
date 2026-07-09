import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DocumentForm } from "@/components/DocumentForm";
import { PageHeader } from "@/components/PageHeader";
import { useDocument } from "@/hooks/useDocuments";

export default function EditDocumentPage({ params }: { params: { documentId: string } }) {
  const { document } = useDocument(params.documentId);

  if (!document) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        backHref={`/documents/${document.id}`}
        description="資料情報、カテゴリ、年度、関連イベント、公開範囲を編集します。"
        title="資料編集"
      />
      <DocumentForm document={document} mode="edit" />
    </AppShell>
  );
}
