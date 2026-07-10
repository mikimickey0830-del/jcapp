import {
  attendanceStatusLabels,
  attendanceStatusSymbols,
  attendanceStatusTones,
  getAttendanceEvents as getFallbackAttendanceEvents,
  getAttendanceRows as getFallbackAttendanceRows,
  getAttendanceSummary as getFallbackAttendanceSummary,
  getUnansweredAttendanceForMember as getFallbackUnansweredAttendanceForMember
} from "@/lib/attendance";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { scheduleService } from "@/services/scheduleService";
import type {
  AttendanceDashboard,
  AttendanceEventDetail,
  AttendanceEventListItem,
  AttendanceGroupSummary,
  AttendanceMutationPayload,
  AttendanceRow,
  AttendanceStatus,
  AttendanceSummary
} from "@/types/attendance";
import type { ScheduleEvent } from "@/types/schedule";

type Source = "supabase" | "fallback";

export type AttendanceQueryResult<T> = {
  data: T;
  error: string | null;
  source: Source;
};

type SupabaseRelation<T> = T | T[] | null;

type AttendanceResponseRow = {
  id: string;
  event_id: string;
  member_id: string;
  status: AttendanceStatus;
  comment: string | null;
  responded_at: string | null;
  reply_deadline: string | null;
  is_overdue: boolean;
  members: SupabaseRelation<MemberRow>;
};

type MemberRow = {
  id: string;
  last_name: string;
  first_name: string;
  last_name_kana: string;
  first_name_kana: string;
  email: string | null;
};

type AssignmentRow = {
  member_id: string;
  position_id: string | null;
  positions: SupabaseRelation<{ id: string; name: string | null }>;
};

type MembershipRow = {
  member_id: string;
  committee_id: string;
  role_in_committee: string;
  committees: SupabaseRelation<{ id: string; name: string | null }>;
};

const legacyEventIds: Record<string, string> = {
  e001: "60000000-0000-0000-0000-000000000001",
  e002: "60000000-0000-0000-0000-000000000002",
  e003: "60000000-0000-0000-0000-000000000003"
};

function firstRelation<T>(relation: SupabaseRelation<T>) {
  return Array.isArray(relation) ? relation[0] : relation;
}

function normalizeEventId(eventId: string) {
  return legacyEventIds[eventId] ?? eventId;
}

function isDeadlineOver(event: ScheduleEvent) {
  if (!event.attendanceDeadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(`${event.attendanceDeadline}T23:59:59`);
  return deadline < today;
}

function toDateKey(value: Date) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0")
  ].join("-");
}

function summarizeGroup(id: string, name: string, rows: AttendanceRow[]): AttendanceGroupSummary {
  const attending = rows.filter((row) => row.status === "attending").length;
  const absent = rows.filter((row) => row.status === "absent").length;
  const late = rows.filter((row) => row.status === "late").length;
  const unanswered = rows.filter((row) => row.status === "unanswered").length;
  const answered = rows.length - unanswered;

  return {
    id,
    name,
    total: rows.length,
    attending,
    absent,
    late,
    unanswered,
    responseRate: rows.length === 0 ? 0 : Math.round((answered / rows.length) * 100)
  };
}

function summarizeRows(rows: AttendanceRow[], event: ScheduleEvent): AttendanceSummary {
  const attending = rows.filter((row) => row.status === "attending").length;
  const absent = rows.filter((row) => row.status === "absent").length;
  const late = rows.filter((row) => row.status === "late").length;
  const unanswered = rows.filter((row) => row.status === "unanswered").length;
  const answered = rows.length - unanswered;

  const committeeMap = new Map<string, { name: string; rows: AttendanceRow[] }>();
  const positionMap = new Map<string, { name: string; rows: AttendanceRow[] }>();

  rows.forEach((row) => {
    if (row.committees.length === 0) {
      const current = committeeMap.get("none") ?? { name: "委員会未設定", rows: [] };
      committeeMap.set("none", { ...current, rows: [...current.rows, row] });
    } else {
      row.committees.forEach((committee) => {
        const current = committeeMap.get(committee.id) ?? { name: committee.name, rows: [] };
        committeeMap.set(committee.id, { ...current, rows: [...current.rows, row] });
      });
    }

    const positionId = row.position?.id ?? "none";
    const positionName = row.position?.name ?? "役職未設定";
    const current = positionMap.get(positionId) ?? { name: positionName, rows: [] };
    positionMap.set(positionId, { ...current, rows: [...current.rows, row] });
  });

  return {
    attending,
    absent,
    late,
    unanswered,
    answered,
    total: rows.length,
    responseRate: rows.length === 0 ? 0 : Math.round((answered / rows.length) * 100),
    isDeadlineOver: isDeadlineOver(event),
    unansweredRows: rows.filter((row) => row.status === "unanswered"),
    committeeSummaries: Array.from(committeeMap.entries()).map(([id, group]) => summarizeGroup(id, group.name, group.rows)),
    positionSummaries: Array.from(positionMap.entries()).map(([id, group]) => summarizeGroup(id, group.name, group.rows))
  };
}

async function fetchAttendanceRows(event: ScheduleEvent): Promise<AttendanceRow[]> {
  if (!supabase) return getFallbackAttendanceRows(event.id);

  const [responses, assignments, memberships] = await Promise.all([
    supabase
      .from("attendance_responses")
      .select(
        "id, event_id, member_id, status, comment, responded_at, reply_deadline, is_overdue, members(id, last_name, first_name, last_name_kana, first_name_kana, email)"
      )
      .eq("event_id", event.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("annual_member_assignments")
      .select("member_id, position_id, positions(id, name)")
      .eq("fiscal_year_id", event.fiscalYearId)
      .eq("is_active", true),
    supabase
      .from("committee_memberships")
      .select("member_id, committee_id, role_in_committee, committees(id, name)")
      .eq("fiscal_year_id", event.fiscalYearId)
      .is("deleted_at", null)
  ]);

  const error = responses.error ?? assignments.error ?? memberships.error;
  if (error) throw new Error(error.message);

  const assignmentByMember = new Map<string, AssignmentRow>();
  ((assignments.data ?? []) as unknown as AssignmentRow[]).forEach((assignment) => {
    assignmentByMember.set(assignment.member_id, assignment);
  });

  const membershipsByMember = new Map<string, MembershipRow[]>();
  ((memberships.data ?? []) as unknown as MembershipRow[]).forEach((membership) => {
    membershipsByMember.set(membership.member_id, [...(membershipsByMember.get(membership.member_id) ?? []), membership]);
  });

  return ((responses.data ?? []) as unknown as AttendanceResponseRow[]).map((response) => {
    const member = firstRelation(response.members);
    const assignment = assignmentByMember.get(response.member_id);
    const position = firstRelation(assignment?.positions ?? null);
    const committees = (membershipsByMember.get(response.member_id) ?? []).map((membership) => {
      const committee = firstRelation(membership.committees);
      return {
        id: membership.committee_id,
        name: committee?.name ?? "委員会未設定",
        role: membership.role_in_committee
      };
    });
    const status = response.status;

    return {
      responseId: response.id,
      eventId: response.event_id,
      memberId: response.member_id,
      memberName: member ? `${member.last_name} ${member.first_name}` : "会員未設定",
      memberKana: member ? `${member.last_name_kana} ${member.first_name_kana}` : "",
      memberEmail: member?.email ?? "",
      status,
      comment: response.comment ?? "",
      respondedAt: response.responded_at ?? undefined,
      replyDeadline: response.reply_deadline?.slice(0, 10) ?? event.attendanceDeadline,
      isOverdue: isDeadlineOver(event) && status === "unanswered",
      committees,
      position: position && assignment?.position_id ? { id: assignment.position_id, name: position.name ?? "役職未設定" } : undefined
    };
  });
}

async function fetchAttendanceDetail(eventId: string): Promise<AttendanceQueryResult<AttendanceEventDetail | undefined>> {
  const normalizedId = normalizeEventId(eventId);
  const eventResult = await scheduleService.getEventById(normalizedId);
  const event = eventResult.data;

  if (!event) {
    return { data: undefined, error: eventResult.error, source: eventResult.source };
  }

  if (!isSupabaseConfigured || !supabase) {
    const rows = getFallbackAttendanceRows(event.id);
    return {
      data: { event, rows, summary: getFallbackAttendanceSummary(event.id) },
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  try {
    // TODO: Supabase接続を本番化する際は、ログイン会員のLOMと権限で絞り込む。
    const rows = await fetchAttendanceRows(event);
    return {
      data: { event, rows, summary: summarizeRows(rows, event) },
      error: eventResult.error,
      source: eventResult.source
    };
  } catch (error) {
    const rows = getFallbackAttendanceRows(event.id);
    return {
      data: { event, rows, summary: getFallbackAttendanceSummary(event.id) },
      error: `Supabaseから出欠を取得できませんでした。仮データを表示しています。(${
        error instanceof Error ? error.message : "unknown"
      })`,
      source: "fallback"
    };
  }
}

async function fetchAttendanceEvents(): Promise<AttendanceQueryResult<AttendanceEventListItem[]>> {
  const eventResult = await scheduleService.getEvents();
  const events = eventResult.data.filter((event) => event.requiresAttendance);

  if (!isSupabaseConfigured || !supabase) {
    return {
      data: getFallbackAttendanceEvents().map((event) => ({ event, summary: getFallbackAttendanceSummary(event.id) })),
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  try {
    const details = await Promise.all(events.map((event) => fetchAttendanceDetail(event.id)));
    return {
      data: details.map((detail) => detail.data).filter((detail): detail is AttendanceEventDetail => Boolean(detail)),
      error: eventResult.error,
      source: eventResult.source
    };
  } catch (error) {
    return {
      data: getFallbackAttendanceEvents().map((event) => ({ event, summary: getFallbackAttendanceSummary(event.id) })),
      error: `Supabaseから出欠一覧を取得できませんでした。仮データを表示しています。(${
        error instanceof Error ? error.message : "unknown"
      })`,
      source: "fallback"
    };
  }
}

async function fetchDashboard(memberId?: string): Promise<AttendanceQueryResult<AttendanceDashboard>> {
  const eventsResult = await fetchAttendanceEvents();
  const details = await Promise.all(eventsResult.data.map((item) => fetchAttendanceDetail(item.event.id)));
  const today = toDateKey(new Date());
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndKey = toDateKey(weekEnd);

  const unansweredItems = details
    .map((detail) => detail.data)
    .filter((detail): detail is AttendanceEventDetail => Boolean(detail))
    .flatMap((detail) =>
      detail.rows
        .filter((row) => row.status === "unanswered")
        .filter((row) => (memberId ? row.memberId === memberId : true))
        .map((row) => ({ event: detail.event, row, isOverdue: row.isOverdue }))
    );

  return {
    data: {
      events: eventsResult.data,
      unansweredItems,
      dueTodayItems: unansweredItems.filter((item) => item.row.replyDeadline === today),
      dueThisWeekItems: unansweredItems.filter((item) => {
        const deadline = item.row.replyDeadline;
        return Boolean(deadline && deadline >= today && deadline <= weekEndKey);
      })
    },
    error: eventsResult.error,
    source: eventsResult.source
  };
}

async function saveAttendanceResponse(eventId: string, payload: AttendanceMutationPayload) {
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase環境変数が未設定です。" };
  }

  const status = payload.status;
  if (!payload.memberId) return { error: "回答する会員を選択してください。" };
  if (!status || !["attending", "absent", "late"].includes(status)) {
    return { error: "出席、遅刻、欠席のいずれかを選択してください。" };
  }

  const normalizedId = normalizeEventId(eventId);
  const eventResult = await scheduleService.getEventById(normalizedId);
  const event = eventResult.data;
  if (!event) return { error: "イベントが見つかりません。" };

  const now = new Date().toISOString();
  const { error } = await supabase.from("attendance_responses").upsert(
    {
      lom_id: event.lomId,
      event_id: event.id,
      member_id: payload.memberId,
      status,
      comment: payload.comment?.trim() ?? "",
      responded_at: now,
      reply_deadline: event.attendanceDeadline ? `${event.attendanceDeadline}T23:59:00+09:00` : null,
      is_overdue: false,
      updated_at: now
    },
    { onConflict: "event_id,member_id" }
  );

  return { error: error?.message ?? null, eventId: event.id };
}

function getUnansweredAttendanceForMember(memberId: string) {
  return getFallbackUnansweredAttendanceForMember(memberId);
}

export const attendanceService = {
  getAttendanceEvents: fetchAttendanceEvents,
  getAttendanceDetail: fetchAttendanceDetail,
  getAttendanceDashboard: fetchDashboard,
  saveAttendanceResponse,
  getFallbackAttendanceEvents,
  getFallbackAttendanceRows,
  getFallbackAttendanceSummary,
  getUnansweredAttendanceForMember,
  attendanceStatusLabels,
  attendanceStatusSymbols,
  attendanceStatusTones
};
