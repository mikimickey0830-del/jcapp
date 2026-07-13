import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { documentService } from "@/services/documentService";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
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
        action={{ href: `/documents/${document.id}/edit`, label: "編集" }}
        backHref="/documents"
        description="資料の関連情報と公開範囲を確認できます。"
        title={document.title}
      />

      {result.error ? (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {result.error}
        </p>
      ) : null}

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-500">
              {documentService.categoryLabels[document.category]}
            </p>
            <h2 className="mt-1 break-all text-lg font-bold text-jc-navy">
              {document.fileName}
            </h2>
          </div>
          <StatusPill
            label={documentService.fileTypeLabels[document.fileType]}
            tone={documentService.documentToneByFileType[document.fileType]}
          />
        </div>
        <dl className="mt-5 space-y-3">
          <InfoRow label="年度" value={`${document.fiscalYear}年度`} />
          <InfoRow
            label="関連イベント"
            value={documentService.getRelatedEventTitle(document)}
          />
          <InfoRow
            label="登録者"
            value={documentService.getDocumentUploader(document)}
          />
          <InfoRow
            label="公開範囲"
            value={documentService.visibilityLabels[document.visibility]}
          />
          <InfoRow label="登録日時" value={formatDateTime(document.uploadedAt)} />
        </dl>
      </section>

      <section className="mt-4 rounded-md border border-dashed border-jc-line bg-jc-sky p-4">
        <h2 className="text-sm font-bold text-jc-navy">保存先</h2>
        <p className="mt-2 break-all text-sm leading-6 text-slate-700">
          {document.storagePath}
        </p>
      </section>

      <button
        className="mt-5 min-h-12 w-full rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft"
        type="button"
      >
        ダウンロード
      </button>
      <Link
        className="mt-3 flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700"
        href="/documents"
      >
        資料一覧へ
      </Link>
    </AppShell>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-slate-900">
        {value || "未設定"}
      </dd>
    </div>
  );
}
