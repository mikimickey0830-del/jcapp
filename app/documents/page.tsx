import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { documentService } from "@/services/documentService";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  noStore();
  const result = await documentService.getDocuments();
  const documents = result.data;

  return (
    <AppShell>
      <PageHeader
        action={{ href: "/documents/new", label: "アップロード" }}
        description="年度・イベント・カテゴリに紐づく資料を確認できます。"
        title="資料共有"
      />

      {result.error ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          {result.error}
        </p>
      ) : null}

      <section className="mt-4 grid grid-cols-3 gap-2">
        <SummaryCard label="資料数" value={documents.length} />
        <SummaryCard
          label="今年度"
          value={documents.filter((document) => document.fiscalYear === 2026).length}
        />
        <SummaryCard
          label="イベント関連"
          value={documents.filter((document) => document.eventId).length}
        />
      </section>

      <section className="mt-5 space-y-3">
        {documents.map((document) => (
          <Link
            className="block rounded-md border border-jc-line bg-white p-4 shadow-sm transition hover:border-jc-blue"
            href={`/documents/${document.id}`}
            key={document.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">
                  {document.fiscalYear}年度 / {documentService.categoryLabels[document.category]}
                </p>
                <h2 className="mt-1 break-words text-base font-bold text-slate-900">
                  {document.title}
                </h2>
              </div>
              <StatusPill
                label={documentService.fileTypeLabels[document.fileType]}
                tone={documentService.documentToneByFileType[document.fileType]}
              />
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p className="break-all">{document.fileName}</p>
              <p>関連: {documentService.getRelatedEventTitle(document)}</p>
              <p>公開範囲: {documentService.visibilityLabels[document.visibility]}</p>
              <p>アップロード: {formatDate(document.uploadedAt)}</p>
            </div>
          </Link>
        ))}
        {documents.length === 0 ? (
          <EmptyState text="登録されている資料はありません。" />
        ) : null}
      </section>
    </AppShell>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-md border border-jc-line bg-white p-3 text-center shadow-sm">
      <p className="text-2xl font-bold text-jc-blue">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-dashed border-jc-line bg-white p-5 text-center text-sm text-slate-500">
      {text}
    </p>
  );
}
