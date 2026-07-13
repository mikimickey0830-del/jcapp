import {
  eventTypeLabels,
  eventTypeTones,
  formatEventDate,
  getEventsForFiscalYear as getFallbackEventsForFiscalYear,
  getScheduleEvent,
  getThisWeekEvents,
  getTodayEvents,
  getUpcomingEvents,
  scheduleEvents
} from "@/lib/schedule";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/service";
import type { EventFormOptions, EventType, ScheduleEvent } from "@/types/schedule";

type Source = "supabase" | "fallback";

export type QueryResult<T> = {
  data: T;
  error: string | null;
  source: Source;
};

type SupabaseRelation<T> = T | T[] | null;

type EventRow = {
  id: string;
  lom_id: string;
  fiscal_year_id: string;
  title: string;
  event_type: EventType;
  starts_at: string;
  ends_at: string;
  venue: string | null;
  address: string | null;
  google_map_url: string | null;
  target_audience: string | null;
  description: string | null;
  requires_attendance: boolean;
  attendance_deadline: string | null;
  reminder_at: string | null;
  google_calendar_event_id: string | null;
  target_committee_ids: string[] | null;
  target_position_ids: string[] | null;
  target_member_ids: string[] | null;
  operating_committee_id: string | null;
  contact_member_id: string | null;
  bring_items: string | null;
  dress_code: string | null;
  notes: string | null;
  deleted_at: string | null;
  fiscal_years: SupabaseRelation<{
    id: string;
    year: number;
    name: string;
    loms: SupabaseRelation<{ id: string; name: string | null }>;
  }>;
};

type CommitteeRow = {
  id: string;
  fiscal_year_id: string;
  name: string;
};

type PositionRow = {
  id: string;
  fiscal_year_id: string;
  name: string;
};

type MemberRow = {
  id: string;
  last_name: string;
  first_name: string;
  last_name_kana: string;
  first_name_kana: string;
};

type FiscalYearRow = {
  id: string;
  year: number;
  name: string;
  loms: SupabaseRelation<{ id: string; name: string | null }>;
};

function firstRelation<T>(relation: SupabaseRelation<T>) {
  return Array.isArray(relation) ? relation[0] : relation;
}

function datePart(value: string | null | undefined) {
  return value ? value.slice(0, 10) : undefined;
}

function timePart(value: string) {
  return value.slice(11, 16);
}

function memberName(member: MemberRow) {
  return `${member.last_name} ${member.first_name}`;
}

function toEvent(
  row: EventRow,
  committees: CommitteeRow[],
  positions: PositionRow[],
  members: MemberRow[]
): ScheduleEvent {
  const fiscalYear = firstRelation(row.fiscal_years);
  const lom = firstRelation(fiscalYear?.loms ?? null);
  const targetCommitteeIds = row.target_committee_ids ?? [];
  const targetPositionIds = row.target_position_ids ?? [];
  const targetMemberIds = row.target_member_ids ?? [];
  const committeeById = new Map(committees.map((committee) => [committee.id, committee]));
  const positionById = new Map(positions.map((position) => [position.id, position]));
  const memberById = new Map(members.map((member) => [member.id, member]));
  const operatingCommittee = row.operating_committee_id ? committeeById.get(row.operating_committee_id) : undefined;
  const contactMember = row.contact_member_id ? memberById.get(row.contact_member_id) : undefined;

  return {
    id: row.id,
    fiscalYearId: row.fiscal_year_id,
    fiscalYear: fiscalYear?.year ?? 0,
    lomId: row.lom_id,
    lomName: lom?.name ?? "未設定",
    title: row.title,
    eventType: row.event_type,
    date: row.starts_at.slice(0, 10),
    startTime: timePart(row.starts_at),
    endTime: timePart(row.ends_at),
    venue: row.venue ?? "",
    address: row.address ?? "",
    googleMapUrl: row.google_map_url ?? "",
    targetAudience: row.target_audience ?? "",
    description: row.description ?? "",
    requiresAttendance: row.requires_attendance,
    attendanceDeadline: datePart(row.attendance_deadline),
    reminderAt: row.reminder_at ?? undefined,
    googleCalendarEventId: row.google_calendar_event_id ?? undefined,
    targetCommitteeIds,
    targetPositionIds,
    targetMemberIds,
    targetCommittees: targetCommitteeIds.map((id) => ({ id, name: committeeById.get(id)?.name ?? "未設定" })),
    targetPositions: targetPositionIds.map((id) => ({ id, name: positionById.get(id)?.name ?? "未設定" })),
    targetMembers: targetMemberIds.map((id) => {
      const member = memberById.get(id);
      return { id, name: member ? memberName(member) : "未設定" };
    }),
    operatingCommitteeId: row.operating_committee_id ?? "",
    operatingCommitteeName: operatingCommittee?.name ?? "未設定",
    contactMemberId: row.contact_member_id ?? "",
    contactMemberName: contactMember ? memberName(contactMember) : "未設定",
    bringItems: row.bring_items ?? "",
    dressCode: row.dress_code ?? "",
    notes: row.notes ?? "",
    deletedAt: row.deleted_at
  };
}

async function fetchOptions(): Promise<QueryResult<EventFormOptions>> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: fallbackOptions(),
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  try {
    // TODO: Supabase接続を本番化する際は、LOMと権限に応じた絞り込みへ差し替える。
    const [years, committees, positions, members] = await Promise.all([
      supabase.from("fiscal_years").select("id, year, name, loms(id, name)").order("year", { ascending: false }),
      supabase.from("committees").select("id, fiscal_year_id, name").is("deleted_at", null).order("sort_order", { ascending: true }),
      supabase.from("positions").select("id, fiscal_year_id, name").order("sort_order", { ascending: true }),
      supabase.from("members").select("id, last_name, first_name, last_name_kana, first_name_kana").order("last_name_kana", { ascending: true })
    ]);
    const error = years.error ?? committees.error ?? positions.error ?? members.error;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: {
        fiscalYears: ((years.data ?? []) as unknown as FiscalYearRow[]).map((year) => ({
          id: year.id,
          year: year.year,
          name: year.name,
          lomId: firstRelation(year.loms)?.id ?? "",
          lomName: firstRelation(year.loms)?.name ?? "未設定"
        })),
        committees: ((committees.data ?? []) as unknown as CommitteeRow[]).map((committee) => ({
          id: committee.id,
          fiscalYearId: committee.fiscal_year_id,
          name: committee.name
        })),
        positions: ((positions.data ?? []) as unknown as PositionRow[]).map((position) => ({
          id: position.id,
          fiscalYearId: position.fiscal_year_id,
          name: position.name
        })),
        members: ((members.data ?? []) as unknown as MemberRow[]).map((member) => ({
          id: member.id,
          name: memberName(member),
          kana: `${member.last_name_kana} ${member.first_name_kana}`
        }))
      },
      error: null,
      source: "supabase"
    };
  } catch (error) {
    return {
      data: fallbackOptions(),
      error: `Supabaseから候補データを取得できませんでした。仮データを表示しています。(${
        error instanceof Error ? error.message : "unknown"
      })`,
      source: "fallback"
    };
  }
}

async function fetchEvents(): Promise<QueryResult<ScheduleEvent[]>> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: scheduleEvents,
      error: "Supabase環境変数が未設定のため、仮データを表示しています。",
      source: "fallback"
    };
  }

  try {
    // TODO: Supabase接続を本番化する際は、LOMと権限に応じた絞り込みへ差し替える。
    const [events, committees, positions, members] = await Promise.all([
      supabase
        .from("events")
        .select(
          "id, lom_id, fiscal_year_id, title, event_type, starts_at, ends_at, venue, address, google_map_url, target_audience, description, requires_attendance, attendance_deadline, reminder_at, google_calendar_event_id, target_committee_ids, target_position_ids, target_member_ids, operating_committee_id, contact_member_id, bring_items, dress_code, notes, deleted_at, fiscal_years(id, year, name, loms(id, name))"
        )
        .is("deleted_at", null)
        .order("starts_at", { ascending: true }),
      supabase.from("committees").select("id, fiscal_year_id, name").is("deleted_at", null),
      supabase.from("positions").select("id, fiscal_year_id, name"),
      supabase.from("members").select("id, last_name, first_name, last_name_kana, first_name_kana")
    ]);
    const error = events.error ?? committees.error ?? positions.error ?? members.error;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: ((events.data ?? []) as unknown as EventRow[]).map((event) =>
        toEvent(
          event,
          (committees.data ?? []) as unknown as CommitteeRow[],
          (positions.data ?? []) as unknown as PositionRow[],
          (members.data ?? []) as unknown as MemberRow[]
        )
      ),
      error: null,
      source: "supabase"
    };
  } catch (error) {
    return {
      data: scheduleEvents,
      error: `Supabaseからイベントを取得できませんでした。仮データを表示しています。(${
        error instanceof Error ? error.message : "unknown"
      })`,
      source: "fallback"
    };
  }
}

async function fetchEvent(eventId: string): Promise<QueryResult<ScheduleEvent | undefined>> {
  const result = await fetchEvents();
  return {
    data: result.data.find((event) => event.id === eventId) ?? getScheduleEvent(eventId),
    error: result.error,
    source: result.source
  };
}

function eventsForFiscalYear(events: ScheduleEvent[], fiscalYear: number) {
  return events.filter((event) => event.fiscalYear === fiscalYear);
}

function todayEvents(events: ScheduleEvent[], now = new Date()) {
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
  return events.filter((event) => event.date === today);
}

function thisWeekEvents(events: ScheduleEvent[], now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return events.filter((event) => {
    const eventDate = new Date(`${event.date}T00:00:00`);
    return eventDate >= start && eventDate < end;
  });
}

function fallbackOptions(): EventFormOptions {
  return {
    fiscalYears: [
      {
        id: "10000000-0000-0000-0000-000000002026",
        year: 2026,
        name: "2026年度",
        lomId: "00000000-0000-0000-0000-000000000001",
        lomName: "玉島青年会議所"
      }
    ],
    committees: [
      { id: "30000000-0000-0000-0000-000000000001", fiscalYearId: "10000000-0000-0000-0000-000000002026", name: "総務広報委員会" },
      { id: "30000000-0000-0000-0000-000000000003", fiscalYearId: "10000000-0000-0000-0000-000000002026", name: "地域事業委員会" }
    ],
    positions: [
      { id: "40000000-0000-0000-0000-000000000001", fiscalYearId: "10000000-0000-0000-0000-000000002026", name: "理事長" },
      { id: "40000000-0000-0000-0000-000000000003", fiscalYearId: "10000000-0000-0000-0000-000000002026", name: "委員長" }
    ],
    members: [
      { id: "20000000-0000-0000-0000-000000000001", name: "山田 太郎", kana: "ヤマダ タロウ" },
      { id: "20000000-0000-0000-0000-000000000003", name: "佐藤 花子", kana: "サトウ ハナコ" }
    ]
  };
}

export const scheduleService = {
  getEvents: fetchEvents,
  getEventById: fetchEvent,
  getFormOptions: fetchOptions,
  getFallbackEvents: () => scheduleEvents,
  getFallbackEventById: (eventId: string) => getScheduleEvent(eventId),
  getFallbackEventsForFiscalYear,
  getFallbackUpcomingEvents: getUpcomingEvents,
  getFallbackTodayEvents: getTodayEvents,
  getFallbackThisWeekEvents: getThisWeekEvents,
  getEventsForFiscalYear: eventsForFiscalYear,
  getTodayEvents: todayEvents,
  getThisWeekEvents: thisWeekEvents,
  formatEventDate,
  eventTypeLabels,
  eventTypeTones
};
