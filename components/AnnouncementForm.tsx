import Link from "next/link";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useMembers } from "@/hooks/useMembers";
import { useYears } from "@/hooks/useYears";
import type { Announcement } from "@/types/announcement";

type AnnouncementFormProps = {
  mode: "create" | "edit";
  announcement?: Announcement;
};

export function AnnouncementForm({ mode, announcement }: AnnouncementFormProps) {
  const isEdit = mode === "edit";
  const {
    announcementImportanceLabels,
    announcementTypeLabels,
    announcementVisibilityLabels
  } = useAnnouncements();
  const { members } = useMembers();
  const { fiscalYears } = useYears();

  return (
    <form className="space-y-5">
      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">お知らせ内容</h2>
        <div className="mt-4 space-y-3">
          <TextField defaultValue={announcement?.title ?? ""} label="タイトル" name="title" />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">本文</span>
            <textarea
              className="min-h-40 w-full rounded-md border border-jc-line bg-slate-50 px-3 py-3 text-base leading-7 outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={announcement?.body ?? ""}
              name="body"
              placeholder="連絡事項、依頼内容、締切などを入力"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">種別</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={announcement?.type ?? "general"}
              name="type"
            >
              {Object.entries(announcementTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">重要度</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={announcement?.importance ?? "normal"}
              name="importance"
            >
              {Object.entries(announcementImportanceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">公開設定</h2>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">対象年度</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={String(announcement?.fiscalYear ?? 2026)}
              name="fiscalYear"
            >
              {fiscalYears.map((year) => (
                <option key={year.year} value={year.year}>
                  {year.name}
                </option>
              ))}
            </select>
          </label>

          <TextField defaultValue={announcement?.targetLom ?? "玉島青年会議所"} label="対象LOM" name="targetLom" />
          <TextField defaultValue={announcement?.targetCommittee ?? ""} label="対象委員会" name="targetCommittee" />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">公開範囲</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={announcement?.visibility ?? "members"}
              name="visibility"
            >
              {Object.entries(announcementVisibilityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">公開期間・作成者</h2>
        <div className="mt-4 space-y-3">
          <DateTimeField defaultValue={announcement?.publishStartAt} label="公開開始日時" name="publishStartAt" />
          <DateTimeField defaultValue={announcement?.publishEndAt} label="公開終了日時" name="publishEndAt" />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">作成者</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              defaultValue={announcement?.authorMemberId ?? "m001"}
              name="authorMemberId"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.lastName} {member.firstName}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-md border border-dashed border-jc-line bg-jc-sky p-4">
        <h2 className="text-base font-bold text-jc-navy">通知連動メモ</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          保存後に通知を作成する場合は、このお知らせIDと通知種別 announcement を通知サービスへ渡す設計です。
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          className="flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700"
          href={isEdit && announcement ? `/announcements/${announcement.id}` : "/announcements"}
        >
          キャンセル
        </Link>
        <button className="min-h-12 rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft" type="button">
          {isEdit ? "更新する" : "作成する"}
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

function DateTimeField({
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
        defaultValue={defaultValue?.replace(" ", "T") ?? ""}
        name={name}
        type="datetime-local"
      />
    </label>
  );
}
