import Link from "next/link";
import { useDocuments } from "@/hooks/useDocuments";
import { useMembers } from "@/hooks/useMembers";
import { useSchedule } from "@/hooks/useSchedule";
import { useYears } from "@/hooks/useYears";
import type { SharedDocument } from "@/types/document";

type DocumentFormProps = {
  mode: "create" | "edit";
  document?: SharedDocument;
};

export function DocumentForm({ mode, document }: DocumentFormProps) {
  const isEdit = mode === "edit";
  const { categoryLabels, fileTypeLabels, visibilityLabels } = useDocuments();
  const { members } = useMembers();
  const { events } = useSchedule();
  const { fiscalYears } = useYears();

  return (
    <form className="space-y-5">
      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">資料情報</h2>
        <div className="mt-4 space-y-3">
          <TextField defaultValue={document?.title ?? ""} label="資料タイトル" name="title" />
          <TextField defaultValue={document?.fileName ?? ""} label="ファイル名" name="fileName" />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">ファイル種別</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={document?.fileType ?? "pdf"}
              name="fileType"
            >
              {Object.entries(fileTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">カテゴリ</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={document?.category ?? "meeting"}
              name="category"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">紐づけ</h2>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">年度</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={String(document?.fiscalYear ?? 2026)}
              name="fiscalYear"
            >
              {fiscalYears.map((year) => (
                <option key={year.year} value={year.year}>
                  {year.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">関連イベント</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={document?.eventId ?? ""}
              name="eventId"
            >
              <option value="">年度共通</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">アップロード者</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={document?.uploadedByMemberId ?? "m001"}
              name="uploadedByMemberId"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.lastName} {member.firstName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">公開範囲</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={document?.visibility ?? "all"}
              name="visibility"
            >
              {Object.entries(visibilityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-md border border-dashed border-jc-line bg-jc-sky p-4">
        <h2 className="text-base font-bold text-jc-navy">アップロード</h2>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          実ファイルは後続フェーズで Supabase Storage に保存します。保存先は年度・イベント単位の path を想定します。
        </p>
        <label className="mt-4 flex min-h-28 flex-col items-center justify-center rounded-md border border-dashed border-jc-blue bg-white px-4 text-center">
          <span className="text-sm font-bold text-jc-blue">ファイルを選択</span>
          <span className="mt-1 text-xs text-slate-500">PDF, Word, Excel, PowerPoint, 画像</span>
          <input className="sr-only" name="file" type="file" />
        </label>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          className="flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700"
          href={isEdit && document ? `/documents/${document.id}` : "/documents"}
        >
          キャンセル
        </Link>
        <button className="min-h-12 rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft" type="button">
          {isEdit ? "更新する" : "アップロード"}
        </button>
      </div>
    </form>
  );
}

function TextField({
  label,
  name,
  defaultValue
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        defaultValue={defaultValue}
        name={name}
        type="text"
      />
    </label>
  );
}
