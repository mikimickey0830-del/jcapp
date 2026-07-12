"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Announcement,
  AnnouncementFormOptions,
  AnnouncementImportance,
  AnnouncementType,
  AnnouncementVisibility
} from "@/types/announcement";

type AnnouncementFormProps = {
  mode: "create" | "edit";
  announcement?: Announcement;
  options: AnnouncementFormOptions;
};

type FormErrors = Partial<Record<"title" | "body" | "fiscalYearId" | "targetLom" | "publishStartAt" | "publishEndAt" | "authorMemberId" | "form", string>>;

const announcementTypeLabels: Record<AnnouncementType, string> = {
  general: "全体連絡",
  regular_meeting: "例会案内",
  board_meeting: "理事会案内",
  committee: "委員会連絡",
  deadline: "締切案内",
  document_added: "資料追加",
  other: "その他"
};

const announcementVisibilityLabels: Record<AnnouncementVisibility, string> = {
  all: "全体公開",
  members: "会員のみ",
  board: "理事・役員",
  committee: "対象委員会",
  admins: "管理者のみ"
};

const announcementImportanceLabels: Record<AnnouncementImportance, string> = {
  normal: "通常",
  important: "重要",
  urgent: "至急"
};

export function AnnouncementForm({ mode, announcement, options }: AnnouncementFormProps) {
  const router = useRouter();
  const defaultFiscalYear = options.fiscalYears[0];
  const [fiscalYearId, setFiscalYearId] = useState(announcement?.fiscalYearId ?? defaultFiscalYear?.id ?? "");
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [type, setType] = useState<AnnouncementType>(announcement?.type ?? "general");
  const [targetLom, setTargetLom] = useState(announcement?.targetLom ?? defaultFiscalYear?.lomName ?? options.loms[0]?.name ?? "");
  const [targetCommitteeId, setTargetCommitteeId] = useState(announcement?.targetCommitteeId ?? "");
  const [visibility, setVisibility] = useState<AnnouncementVisibility>(announcement?.visibility ?? "members");
  const [importance, setImportance] = useState<AnnouncementImportance>(announcement?.importance ?? "normal");
  const [publishStartAt, setPublishStartAt] = useState(toDateTimeLocal(announcement?.publishStartAt));
  const [publishEndAt, setPublishEndAt] = useState(toDateTimeLocal(announcement?.publishEndAt));
  const [authorMemberId, setAuthorMemberId] = useState(announcement?.authorMemberId ?? options.members[0]?.id ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const fiscalYearCommittees = useMemo(
    () => options.committees.filter((committee) => committee.fiscalYearId === fiscalYearId),
    [fiscalYearId, options.committees]
  );

  function handleFiscalYearChange(nextFiscalYearId: string) {
    setFiscalYearId(nextFiscalYearId);
    setTargetCommitteeId("");
    const fiscalYear = options.fiscalYears.find((year) => year.id === nextFiscalYearId);
    if (fiscalYear) setTargetLom(fiscalYear.lomName);
  }

  function validate() {
    const nextErrors: FormErrors = {};
    if (!fiscalYearId) nextErrors.fiscalYearId = "対象年度を選択してください。";
    if (!title.trim()) nextErrors.title = "タイトルを入力してください。";
    if (!body.trim()) nextErrors.body = "本文を入力してください。";
    if (!targetLom) nextErrors.targetLom = "対象LOMを選択してください。";
    if (!publishStartAt) nextErrors.publishStartAt = "公開開始日時を入力してください。";
    if (publishStartAt && publishEndAt && new Date(publishEndAt) < new Date(publishStartAt)) {
      nextErrors.publishEndAt = "公開終了日時は公開開始日時より後にしてください。";
    }
    if (!authorMemberId) nextErrors.authorMemberId = "作成者を選択してください。";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setErrors({});

    const endpoint = mode === "create" ? "/api/announcements" : `/api/announcements/${announcement?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fiscalYearId,
          title: title.trim(),
          body: body.trim(),
          type,
          targetLom,
          targetCommitteeId: targetCommitteeId || undefined,
          visibility,
          importance,
          publishStartAt: new Date(publishStartAt).toISOString(),
          publishEndAt: publishEndAt ? new Date(publishEndAt).toISOString() : undefined,
          authorMemberId
        })
      });
      const result = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !result.id) {
        setErrors({ form: result.error ?? "お知らせを保存できませんでした。" });
        return;
      }

      router.push(`/announcements/${result.id}`);
      router.refresh();
    } catch {
      setErrors({ form: "通信エラーが発生しました。時間をおいて再度お試しください。" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {errors.form ? (
        <section className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{errors.form}</section>
      ) : null}

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">お知らせ内容</h2>
        <div className="mt-4 space-y-3">
          <TextField error={errors.title} label="タイトル" onChange={setTitle} value={title} />
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">本文</span>
            <textarea
              className="min-h-40 w-full rounded-md border border-jc-line bg-slate-50 px-3 py-3 text-base leading-7 outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setBody(event.target.value)}
              placeholder="連絡事項、依頼内容、締切などを入力"
              value={body}
            />
            {errors.body ? <span className="mt-1 block text-xs font-semibold text-red-600">{errors.body}</span> : null}
          </label>
          <SelectField label="種別" onChange={(value) => setType(value as AnnouncementType)} options={announcementTypeLabels} value={type} />
          <SelectField
            label="重要度"
            onChange={(value) => setImportance(value as AnnouncementImportance)}
            options={announcementImportanceLabels}
            value={importance}
          />
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">公開設定</h2>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">対象年度</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              onChange={(event) => handleFiscalYearChange(event.target.value)}
              value={fiscalYearId}
            >
              <option value="">対象年度を選択</option>
              {options.fiscalYears.map((fiscalYear) => (
                <option key={fiscalYear.id} value={fiscalYear.id}>
                  {fiscalYear.name} / {fiscalYear.lomName}
                </option>
              ))}
            </select>
            {errors.fiscalYearId ? <span className="mt-1 block text-xs font-semibold text-red-600">{errors.fiscalYearId}</span> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">対象LOM</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setTargetLom(event.target.value)}
              value={targetLom}
            >
              <option value="">対象LOMを選択</option>
              {options.loms.map((lom) => (
                <option key={lom.id} value={lom.name}>
                  {lom.name}
                </option>
              ))}
            </select>
            {errors.targetLom ? <span className="mt-1 block text-xs font-semibold text-red-600">{errors.targetLom}</span> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">対象委員会</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setTargetCommitteeId(event.target.value)}
              value={targetCommitteeId}
            >
              <option value="">指定なし</option>
              {fiscalYearCommittees.map((committee) => (
                <option key={committee.id} value={committee.id}>
                  {committee.name}
                </option>
              ))}
            </select>
          </label>

          <SelectField
            label="公開範囲"
            onChange={(value) => setVisibility(value as AnnouncementVisibility)}
            options={announcementVisibilityLabels}
            value={visibility}
          />
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">公開期間・作成者</h2>
        <div className="mt-4 space-y-3">
          <DateTimeField error={errors.publishStartAt} label="公開開始日時" onChange={setPublishStartAt} value={publishStartAt} />
          <DateTimeField error={errors.publishEndAt} label="公開終了日時" onChange={setPublishEndAt} value={publishEndAt} />
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">作成者</span>
            <select
              className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setAuthorMemberId(event.target.value)}
              value={authorMemberId}
            >
              <option value="">作成者を選択</option>
              {options.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            {errors.authorMemberId ? <span className="mt-1 block text-xs font-semibold text-red-600">{errors.authorMemberId}</span> : null}
          </label>
        </div>
      </section>

      <section className="rounded-md border border-dashed border-jc-line bg-jc-sky p-4">
        <h2 className="text-base font-bold text-jc-navy">通知連動</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          保存時に通知を作成する処理は、対象者の権限・委員会所属を判定できる認証実装後に追加します。
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          className="flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700"
          href={mode === "edit" && announcement ? `/announcements/${announcement.id}` : "/announcements"}
        >
          キャンセル
        </Link>
        <button
          className="min-h-12 rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "保存中..." : mode === "create" ? "お知らせを作成" : "変更を保存"}
        </button>
      </div>
    </form>
  );
}

function TextField({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Record<string, string> }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <select
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {Object.entries(options).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateTimeField({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        type="datetime-local"
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function toDateTimeLocal(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}
