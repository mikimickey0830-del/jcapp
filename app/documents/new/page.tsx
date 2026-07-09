import { AppShell } from "@/components/AppShell";
import { DocumentForm } from "@/components/DocumentForm";
import { PageHeader } from "@/components/PageHeader";

export default function NewDocumentPage() {
  return (
    <AppShell>
      <PageHeader
        backHref="/documents"
        description="資料情報と紐づけを登録します。実ファイルの保存は後続フェーズで実装します。"
        title="資料アップロード"
      />
      <DocumentForm mode="create" />
    </AppShell>
  );
}
