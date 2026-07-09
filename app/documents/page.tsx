import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { useDocuments } from "@/hooks/useDocuments";
import { useYears } from "@/hooks/useYears";

export default function DocumentsPage() {
  const {
    documents,
    categoryLabels,
    documentToneByFileType,
    fileTypeLabels,
    getDocumentUploader,
    getRelatedEventTitle,
    visibilityLabels
  } = useDocuments();
  const { fiscalYears } = useYears();

  return (
    <AppShell>
      <PageHeader
        action={{ href: "/documents/new", label: "アップロード" }}
        description="年度、イベント、カテゴリに紐づく資料を共有します。ファイル本体は将来 Supabase Storage に保存します。"
        title="資料共有"
      />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">資料検索</span>
          <input
            className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="タイトル・ファイル名で検索"
            type="search"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <select className="min-h-12 rounded-md border border-jc-line bg-slate-50 px-3 text-sm font-semibold text-slate-700">
            <option>すべてのカテゴリ</option>
            {Object.values(categoryLabels).map((label) => (
              <option key={label}>{label}</option>
            ))}
          </select>
          <select className="min-h-12 rounded-md border border-jc-line bg-slate-50 px-3 text-sm font-semibold text-slate-700">
            <option>すべての年度</option>
            {fiscalYears.map((year) => (
              <option key={year.year}>{year.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3">
        <SummaryCard label="資料数" value={String(documents.length)} />
        <SummaryCard label="2026年度" value={String(documents.filter((document) => document.fiscalYear === 2026).length)} />
        <SummaryCard label="イベント紐づき" value={String(documents.filter((document) => document.eventId).length)} />
      </section>

      <section className="mt-5 space-y-3">
        {documents.map((document) => (
          <Link
            className="block rounded-md border border-jc-line bg-white p-4 shadow-sm transition hover:border-jc-blue hover:shadow-soft"
            href={`/documents/${document.id}`}
            key={document.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">
                  {document.fiscalYear}年度 / {categoryLabels[document.category]}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{document.title}</h2>
              </div>
              <StatusPill label={fileTypeLabels[document.fileType]} tone={documentToneByFileType[document.fileType]} />
            </div>
            <div className="mt-3 grid gap-1 text-sm text-slate-600">
              <span>{document.fileName}</span>
              <span>関連: {getRelatedEventTitle(document)}</span>
              <span>公開範囲: {visibilityLabels[document.visibility]}</span>
              <span>アップロード者: {getDocumentUploader(document)}</span>
            </div>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-jc-line bg-white p-3 text-center shadow-sm">
      <p className="text-2xl font-bold text-jc-blue">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
    </article>
  );
}
