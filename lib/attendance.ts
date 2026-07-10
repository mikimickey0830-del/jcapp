import { members } from "@/lib/members";
import { getScheduleEvent, scheduleEvents } from "@/lib/schedule";
import type { AttendanceResponse, AttendanceRow, AttendanceStatus, AttendanceSummary } from "@/types/attendance";

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  attending: "出席",
  absent: "欠席",
  late: "遅刻",
  unanswered: "未回答"
};

export const attendanceStatusSymbols: Record<AttendanceStatus, string> = {
  attending: "○",
  late: "△",
  absent: "×",
  unanswered: "-"
};

export const attendanceStatusTones: Record<AttendanceStatus, "blue" | "green" | "amber" | "red"> = {
  attending: "green",
  absent: "red",
  late: "amber",
  unanswered: "blue"
};

export const attendanceResponses: AttendanceResponse[] = [
  {
    id: "fallback-att-001",
    eventId: "60000000-0000-0000-0000-000000000001",
    memberId: "m001",
    status: "attending",
    comment: "参加します。",
    respondedAt: "2026-07-05 09:20",
    replyDeadline: "2026-07-08",
    isOverdue: false
  },
  {
    id: "fallback-att-002",
    eventId: "60000000-0000-0000-0000-000000000001",
    memberId: "m002",
    status: "late",
    comment: "仕事のため20分ほど遅れます。",
    respondedAt: "2026-07-06 18:10",
    replyDeadline: "2026-07-08",
    isOverdue: false
  },
  {
    id: "fallback-att-003",
    eventId: "60000000-0000-0000-0000-000000000001",
    memberId: "m003",
    status: "absent",
    comment: "所用のため欠席します。",
    respondedAt: "2026-07-07 12:05",
    replyDeadline: "2026-07-08",
    isOverdue: false
  },
  {
    id: "fallback-att-004",
    eventId: "60000000-0000-0000-0000-000000000001",
    memberId: "m004",
    status: "unanswered",
    comment: "",
    replyDeadline: "2026-07-08",
    isOverdue: true
  }
];

const today = "2026-07-10";

export function getAttendanceEvents() {
  return scheduleEvents.filter((event) => event.requiresAttendance);
}

export function isAttendanceDeadlineOver(eventId: string) {
  const event = getScheduleEvent(eventId);

  if (!event?.attendanceDeadline) {
    return false;
  }

  return event.attendanceDeadline < today;
}

export function getAttendanceRows(eventId: string): AttendanceRow[] {
  const event = getScheduleEvent(eventId);
  const eventResponses = attendanceResponses.filter((response) => response.eventId === event?.id || response.eventId === eventId);

  return members.map((member) => {
    const response = eventResponses.find((item) => item.memberId === member.id);
    const status = response?.status ?? "unanswered";

    return {
      responseId: response?.id ?? "",
      eventId: event?.id ?? eventId,
      memberId: member.id,
      memberName: `${member.lastName} ${member.firstName}`,
      memberKana: `${member.lastNameKana} ${member.firstNameKana}`,
      memberEmail: member.email,
      status,
      comment: response?.comment ?? "",
      respondedAt: response?.respondedAt,
      replyDeadline: response?.replyDeadline ?? event?.attendanceDeadline,
      isOverdue: isAttendanceDeadlineOver(event?.id ?? eventId) && status === "unanswered",
      committees: [],
      position: undefined
    };
  });
}

export function summarizeRows(rows: AttendanceRow[], isDeadlineOver: boolean): AttendanceSummary {
  const attending = rows.filter((row) => row.status === "attending").length;
  const absent = rows.filter((row) => row.status === "absent").length;
  const late = rows.filter((row) => row.status === "late").length;
  const unanswered = rows.filter((row) => row.status === "unanswered").length;
  const answered = rows.length - unanswered;
  const responseRate = rows.length === 0 ? 0 : Math.round((answered / rows.length) * 100);

  return {
    attending,
    absent,
    late,
    unanswered,
    answered,
    total: rows.length,
    responseRate,
    isDeadlineOver,
    unansweredRows: rows.filter((row) => row.status === "unanswered"),
    committeeSummaries: [],
    positionSummaries: []
  };
}

export function getAttendanceSummary(eventId: string) {
  return summarizeRows(getAttendanceRows(eventId), isAttendanceDeadlineOver(eventId));
}

export function getUnansweredAttendanceForMember(memberId: string) {
  return getAttendanceEvents()
    .map((event) => {
      const rows = getAttendanceRows(event.id);
      const row = rows.find((item) => item.memberId === memberId);

      return row && row.status === "unanswered"
        ? {
            event,
            row,
            isOverdue: row.isOverdue
          }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}
