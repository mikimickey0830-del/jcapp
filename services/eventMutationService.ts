import { supabase } from "@/lib/supabase/client";
import type { EventMutationPayload, EventType } from "@/types/schedule";

const validEventTypes: EventType[] = [
  "regular_meeting",
  "board_meeting",
  "committee",
  "project",
  "block",
  "jci_japan",
  "other"
];

export function validateEventInput(body: EventMutationPayload) {
  if (!body.fiscalYearId) return "対象年度を選択してください。";
  if (!body.title?.trim()) return "イベント名を入力してください。";
  if (!body.eventType || !validEventTypes.includes(body.eventType)) return "イベント種別を選択してください。";
  if (!body.startsAt) return "開始日時を入力してください。";
  if (!body.endsAt) return "終了日時を入力してください。";
  if (body.startsAt && body.endsAt && body.startsAt > body.endsAt) return "終了日時は開始日時以降にしてください。";
  return null;
}

export async function getFiscalYearLomId(fiscalYearId: string) {
  if (!supabase) throw new Error("Supabase環境変数が未設定です。");

  const { data, error } = await supabase.from("fiscal_years").select("lom_id").eq("id", fiscalYearId).single();
  if (error || !data) throw new Error("年度情報を取得できませんでした。");

  return data.lom_id as string;
}

export function toEventPayload(body: EventMutationPayload, lomId: string) {
  return {
    lom_id: lomId,
    fiscal_year_id: body.fiscalYearId,
    title: body.title?.trim(),
    event_type: body.eventType,
    starts_at: body.startsAt,
    ends_at: body.endsAt,
    venue: body.venue?.trim() ?? "",
    address: body.address?.trim() ?? "",
    google_map_url: body.googleMapUrl?.trim() ?? "",
    target_audience: body.targetAudience?.trim() ?? "",
    description: body.description?.trim() ?? "",
    requires_attendance: Boolean(body.requiresAttendance),
    attendance_deadline: body.attendanceDeadline || null,
    reminder_at: body.reminderAt || null,
    google_calendar_event_id: body.googleCalendarEventId?.trim() || null,
    target_committee_ids: body.targetCommitteeIds ?? [],
    target_position_ids: body.targetPositionIds ?? [],
    target_member_ids: body.targetMemberIds ?? [],
    operating_committee_id: body.operatingCommitteeId || null,
    contact_member_id: body.contactMemberId || null,
    bring_items: body.bringItems?.trim() ?? "",
    dress_code: body.dressCode?.trim() ?? "",
    notes: body.notes?.trim() ?? ""
  };
}

async function resolveTargetMemberIds(body: EventMutationPayload) {
  if (!supabase || !body.fiscalYearId) return [];

  const memberIds = new Set<string>(body.targetMemberIds ?? []);

  if ((body.targetCommitteeIds ?? []).length > 0) {
    const { data, error } = await supabase
      .from("committee_memberships")
      .select("member_id")
      .eq("fiscal_year_id", body.fiscalYearId)
      .in("committee_id", body.targetCommitteeIds ?? [])
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
    (data ?? []).forEach((row) => memberIds.add(row.member_id as string));
  }

  if ((body.targetPositionIds ?? []).length > 0) {
    const { data, error } = await supabase
      .from("annual_member_assignments")
      .select("member_id")
      .eq("fiscal_year_id", body.fiscalYearId)
      .in("position_id", body.targetPositionIds ?? [])
      .eq("is_active", true);

    if (error) throw new Error(error.message);
    (data ?? []).forEach((row) => memberIds.add(row.member_id as string));
  }

  if (memberIds.size === 0) {
    const { data, error } = await supabase.from("members").select("id").eq("status", "active");
    if (error) throw new Error(error.message);
    (data ?? []).forEach((row) => memberIds.add(row.id as string));
  }

  return Array.from(memberIds);
}

export async function syncAttendanceResponses(eventId: string, lomId: string, body: EventMutationPayload) {
  if (!supabase || !body.requiresAttendance) return;

  const memberIds = await resolveTargetMemberIds(body);
  if (memberIds.length === 0) return;

  const now = new Date().toISOString();
  const { error } = await supabase.from("attendance_responses").upsert(
    memberIds.map((memberId) => ({
      lom_id: lomId,
      event_id: eventId,
      member_id: memberId,
      status: "unanswered",
      comment: "",
      reply_deadline: body.attendanceDeadline || null,
      is_overdue: false,
      updated_at: now
    })),
    { onConflict: "event_id,member_id" }
  );

  if (error) throw new Error(error.message);
}
