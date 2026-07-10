"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { eventTypeLabels } from "@/lib/schedule";
import type { EventFormOptions, EventType, ScheduleEvent } from "@/types/schedule";

type EventFormProps = {
  mode: "create" | "edit";
  event?: ScheduleEvent;
  options: EventFormOptions;
};

type FormErrors = {
  form?: string;
  title?: string;
  fiscalYearId?: string;
  startsAt?: string;
  endsAt?: string;
};

export function EventForm({ mode, event, options }: EventFormProps) {
  const router = useRouter();
  const defaultYear = options.fiscalYears[0];
  const [fiscalYearId, setFiscalYearId] = useState(event?.fiscalYearId ?? defaultYear?.id ?? "");
  const [title, setTitle] = useState(event?.title ?? "");
  const [eventType, setEventType] = useState<EventType>(event?.eventType ?? "regular_meeting");
  const [date, setDate] = useState(event?.date ?? new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(event?.startTime ?? "19:00");
  const [endTime, setEndTime] = useState(event?.endTime ?? "21:00");
  const [venue, setVenue] = useState(event?.venue ?? "");
  const [address, setAddress] = useState(event?.address ?? "");
  const [googleMapUrl, setGoogleMapUrl] = useState(event?.googleMapUrl ?? "");
  const [targetAudience, setTargetAudience] = useState(event?.targetAudience ?? "全会員");
  const [description, setDescription] = useState(event?.description ?? "");
  const [requiresAttendance, setRequiresAttendance] = useState(event?.requiresAttendance ?? true);
  const [attendanceDeadline, setAttendanceDeadline] = useState(event?.attendanceDeadline ?? date);
  const [reminderAt, setReminderAt] = useState(event?.reminderAt?.slice(0, 16) ?? "");
  const [googleCalendarEventId, setGoogleCalendarEventId] = useState(event?.googleCalendarEventId ?? "");
  const [targetCommitteeIds, setTargetCommitteeIds] = useState(event?.targetCommitteeIds ?? []);
  const [targetPositionIds, setTargetPositionIds] = useState(event?.targetPositionIds ?? []);
  const [targetMemberIds, setTargetMemberIds] = useState(event?.targetMemberIds ?? []);
  const [operatingCommitteeId, setOperatingCommitteeId] = useState(event?.operatingCommitteeId ?? "");
  const [contactMemberId, setContactMemberId] = useState(event?.contactMemberId ?? "");
  const [bringItems, setBringItems] = useState(event?.bringItems ?? "");
  const [dressCode, setDressCode] = useState(event?.dressCode ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const yearCommittees = useMemo(
    () => options.committees.filter((committee) => committee.fiscalYearId === fiscalYearId),
    [fiscalYearId, options.committees]
  );
  const yearPositions = useMemo(
    () => options.positions.filter((position) => position.fiscalYearId === fiscalYearId),
    [fiscalYearId, options.positions]
  );

  function validate() {
    const nextErrors: FormErrors = {};
    if (!fiscalYearId) nextErrors.fiscalYearId = "対象年度を選択してください。";
    if (!title.trim()) nextErrors.title = "イベント名を入力してください。";
    if (!date || !startTime) nextErrors.startsAt = "開始日時を入力してください。";
    if (!date || !endTime) nextErrors.endsAt = "終了日時を入力してください。";
    if (date && startTime && endTime && `${date}T${startTime}` > `${date}T${endTime}`) {
      nextErrors.endsAt = "終了日時は開始日時以降にしてください。";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function toggle(list: string[], id: string, setter: (value: string[]) => void) {
    setter(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  async function handleSubmit(eventSubmit: FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    setErrors({});

    try {
      const endpoint = mode === "create" ? "/api/events" : `/api/events/${event?.id}`;
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fiscalYearId,
          title: title.trim(),
          eventType,
          startsAt: `${date}T${startTime}:00+09:00`,
          endsAt: `${date}T${endTime}:00+09:00`,
          venue,
          address,
          googleMapUrl,
          targetAudience,
          description,
          requiresAttendance,
          attendanceDeadline: requiresAttendance ? `${attendanceDeadline}T23:59:00+09:00` : null,
          reminderAt: reminderAt ? `${reminderAt}:00+09:00` : null,
          googleCalendarEventId,
          targetCommitteeIds,
          targetPositionIds,
          targetMemberIds,
          operatingCommitteeId,
          contactMemberId,
          bringItems,
          dressCode,
          notes
        })
      });
      const result = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !result.id) {
        setErrors({ form: result.error ?? "イベントを保存できませんでした。" });
        return;
      }
      router.push(`/schedule/${result.id}`);
      router.refresh();
    } catch {
      setErrors({ form: "通信エラーが発生しました。時間をおいて再度お試しください。" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {errors.form ? <ErrorMessage message={errors.form} /> : null}

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">イベント基本情報</h2>
        <div className="mt-4 space-y-3">
          <Select label="対象年度" value={fiscalYearId} onChange={setFiscalYearId} error={errors.fiscalYearId}>
            {options.fiscalYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name} / {year.lomName}
              </option>
            ))}
          </Select>
          <TextField label="イベント名" value={title} onChange={setTitle} error={errors.title} />
          <Select label="種別" value={eventType} onChange={(value) => setEventType(value as EventType)}>
            {Object.entries(eventTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <TextField label="開催日" type="date" value={date} onChange={setDate} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="開始時間" type="time" value={startTime} onChange={setStartTime} error={errors.startsAt} />
            <TextField label="終了時間" type="time" value={endTime} onChange={setEndTime} error={errors.endsAt} />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">開催情報</h2>
        <div className="mt-4 space-y-3">
          <TextField label="会場" value={venue} onChange={setVenue} />
          <TextField label="住所" value={address} onChange={setAddress} />
          <TextField label="Google Map URL" value={googleMapUrl} onChange={setGoogleMapUrl} />
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">対象者</h2>
        <div className="mt-4 space-y-3">
          <TextField label="対象者メモ" value={targetAudience} onChange={setTargetAudience} />
          <CheckGroup
            label="対象委員会"
            items={yearCommittees}
            selected={targetCommitteeIds}
            onToggle={(id) => toggle(targetCommitteeIds, id, setTargetCommitteeIds)}
          />
          <CheckGroup
            label="対象役職"
            items={yearPositions}
            selected={targetPositionIds}
            onToggle={(id) => toggle(targetPositionIds, id, setTargetPositionIds)}
          />
          <CheckGroup
            label="対象会員（個別追加）"
            items={options.members}
            selected={targetMemberIds}
            onToggle={(id) => toggle(targetMemberIds, id, setTargetMemberIds)}
          />
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">運営情報</h2>
        <div className="mt-4 space-y-3">
          <Select label="担当委員会" value={operatingCommitteeId} onChange={setOperatingCommitteeId}>
            <option value="">未設定</option>
            {yearCommittees.map((committee) => (
              <option key={committee.id} value={committee.id}>
                {committee.name}
              </option>
            ))}
          </Select>
          <Select label="担当者" value={contactMemberId} onChange={setContactMemberId}>
            <option value="">未設定</option>
            {options.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
          <TextField label="持参物" value={bringItems} onChange={setBringItems} />
          <TextField label="服装" value={dressCode} onChange={setDressCode} />
          <TextArea label="備考" value={notes} onChange={setNotes} />
        </div>
      </section>

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">説明・出欠・通知</h2>
        <div className="mt-4 space-y-3">
          <TextArea label="説明" value={description} onChange={setDescription} />
          <CheckRow checked={requiresAttendance} label="出欠確認を行う" onChange={setRequiresAttendance} />
          {requiresAttendance ? (
            <TextField label="返信期限" type="date" value={attendanceDeadline} onChange={setAttendanceDeadline} />
          ) : null}
          <TextField label="締切通知日時" type="datetime-local" value={reminderAt} onChange={setReminderAt} />
          <TextField label="Googleカレンダー連携ID" value={googleCalendarEventId} onChange={setGoogleCalendarEventId} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          className="flex min-h-12 items-center justify-center rounded-md border border-jc-line bg-white px-4 text-sm font-bold text-slate-700"
          href={mode === "edit" && event ? `/schedule/${event.id}` : "/schedule"}
        >
          キャンセル
        </Link>
        <button
          className="min-h-12 rounded-md bg-jc-blue px-4 text-sm font-bold text-white shadow-soft disabled:bg-slate-400"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "保存中..." : mode === "edit" ? "更新する" : "作成する"}
        </button>
      </div>
    </form>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <section className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{message}</section>;
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  error
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        className="min-h-28 w-full rounded-md border border-jc-line bg-slate-50 px-3 py-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
  error
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <select
        className="min-h-12 w-full rounded-md border border-jc-line bg-slate-50 px-3 text-base outline-none focus:border-jc-blue focus:bg-white focus:ring-4 focus:ring-blue-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function CheckGroup({
  label,
  items,
  selected,
  onToggle
}: {
  label: string;
  items: Array<{ id: string; name: string; kana?: string }>;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
      <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
        {items.length > 0 ? (
          items.map((item) => (
            <label className="flex min-h-11 items-center gap-3 rounded-md border border-jc-line bg-slate-50 px-3" key={item.id}>
              <input checked={selected.includes(item.id)} className="size-5 accent-jc-blue" onChange={() => onToggle(item.id)} type="checkbox" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-700">{item.name}</span>
                {item.kana ? <span className="block truncate text-xs text-slate-500">{item.kana}</span> : null}
              </span>
            </label>
          ))
        ) : (
          <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">候補がありません。</p>
        )}
      </div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-md border border-jc-line bg-slate-50 px-3">
      <input checked={checked} className="size-5 accent-jc-blue" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </label>
  );
}
