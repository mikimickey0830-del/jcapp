import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { useDocument } from "@/hooks/useDocuments";

export default function DocumentDetailPage({ params }: { params: { documentId: string } }) {
  const {
    document,
    categoryLabels,
    documentToneByFileType,
    fileTypeLabels,
    getDocumentUploader,
    getRelatedEventTitle,
    visibilityLabels
  } = useDocument(params.documentId);

  if (!document) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        action={{ href: `/documents/${document.id}/edit`, label: "編集" }}
        backHref="/documents"
        description="資料の紐づけ、公開範囲、保存先を確認します。"
        title={document.title}
      />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-500">{categoryLabels[document.category]}</p>
            <h2 className="mt-1 text-xl font-bold text-jc-navy">{document.fileName}</h2>
          </div>
          <StatusPill label={fileTypeLabels[document.fileType]} tone={documentToneByFileType[document.fileType]} />
        </div>

        <dl className="mt-5 grid gap-3">
          <InfoRow label="年度" value={`${document.fiscalYear}年度`} />
          <InfoRow label="関連イベント" value={getRelatedEventTitle(document)} />
          <InfoRow label="アップロード者" value={getDocumentUploader(document)} />
          <InfoRow label="公開範囲" value={visibilityLabels[document.visibility]} />
          <InfoRow label="アップロード日時" value={document.uploadedAt} />
        </dl>
      </section>

      <section className="mt-5 rounded-md border border-dashed border-jc-line bg-jc-sky p-4">
        <h2 className="text-base font-bold text-jc-navy">Storage保存先</h2>
        <p className="mt-2 break-words text-sm leading-6 text-slate-700">{document.storagePath}</p>
      </section>

      <button className="mt-5 min-h-12 w-full rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft" type="button">
        ダウンロード
      </button>
      <Link className="mt-3 flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700" href="/documents">
        資料一覧へ
      </Link>
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[104px_1fr] gap-3">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
