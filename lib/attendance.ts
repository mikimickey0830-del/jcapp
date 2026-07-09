import { members } from "@/lib/members";
import { getScheduleEvent, scheduleEvents } from "@/lib/schedule";
import type { AttendanceResponse, AttendanceStatus } from "@/types/attendance";

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  attending: "出席",
  absent: "欠席",
  late: "遅刻",
  unanswered: "未回答"
};

export const attendanceStatusTones: Record<AttendanceStatus, "blue" | "green" | "amber" | "red"> = {
  attending: "green",
  absent: "red",
  late: "amber",
  unanswered: "blue"
};

export const attendanceResponses: AttendanceResponse[] = [
  {
    eventId: "e001",
    memberId: "m001",
    status: "attending",
    comment: "参加します。",
    respondedAt: "2026-07-05 09:20"
  },
  {
    eventId: "e001",
    memberId: "m002",
    status: "late",
    comment: "仕事のため20分ほど遅れます。",
    respondedAt: "2026-07-06 18:10"
  },
  {
    eventId: "e001",
    memberId: "m003",
    status: "absent",
    comment: "所用のため欠席します。",
    respondedAt: "2026-07-07 12:05"
  },
  {
    eventId: "e001",
    memberId: "m004",
    status: "unanswered",
    comment: ""
  },
  {
    eventId: "e002",
    memberId: "m001",
    status: "attending",
    comment: "",
    respondedAt: "2026-07-10 08:30"
  },
  {
    eventId: "e002",
    memberId: "m002",
    status: "unanswered",
    comment: ""
  },
  {
    eventId: "e002",
    memberId: "m003",
    status: "attending",
    comment: "",
    respondedAt: "2026-07-11 11:00"
  },
  {
    eventId: "e002",
    memberId: "m004",
    status: "unanswered",
    comment: ""
  },
  {
    eventId: "e003",
    memberId: "m001",
    status: "unanswered",
    comment: ""
  },
  {
    eventId: "e003",
    memberId: "m002",
    status: "attending",
    comment: "",
    respondedAt: "2026-07-21 17:45"
  },
  {
    eventId: "e003",
    memberId: "m003",
    status: "unanswered",
    comment: ""
  },
  {
    eventId: "e003",
    memberId: "m004",
    status: "unanswered",
    comment: ""
  },
  {
    eventId: "e005",
    memberId: "m001",
    status: "attending",
    comment: "",
    respondedAt: "2026-07-30 10:00"
  },
  {
    eventId: "e005",
    memberId: "m002",
    status: "unanswered",
    comment: ""
  },
  {
    eventId: "e005",
    memberId: "m003",
    status: "unanswered",
    comment: ""
  },
  {
    eventId: "e005",
    memberId: "m004",
    status: "unanswered",
    comment: ""
  }
];

const today = "2026-07-09";

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

export function getAttendanceRows(eventId: string) {
  const eventResponses = attendanceResponses.filter((response) => response.eventId === eventId);

  return members.map((member) => {
    const response = eventResponses.find((item) => item.memberId === member.id);

    return {
      eventId,
      memberId: member.id,
      memberName: `${member.lastName} ${member.firstName}`,
      memberKana: `${member.lastNameKana} ${member.firstNameKana}`,
      status: response?.status ?? "unanswered",
      comment: response?.comment ?? "",
      respondedAt: response?.respondedAt,
      isOverdue: isAttendanceDeadlineOver(eventId) && (response?.status ?? "unanswered") === "unanswered"
    };
  });
}

export function getAttendanceSummary(eventId: string) {
  const rows = getAttendanceRows(eventId);
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
    isDeadlineOver: isAttendanceDeadlineOver(eventId),
    unansweredRows: rows.filter((row) => row.status === "unanswered")
  };
}

export function getUnansweredAttendanceForMember(memberId: string) {
  return getAttendanceEvents()
    .filter((event) => {
      const response = attendanceResponses.find(
        (item) => item.eventId === event.id && item.memberId === memberId
      );

      return (response?.status ?? "unanswered") === "unanswered";
    })
    .map((event) => ({
      event,
      isOverdue: isAttendanceDeadlineOver(event.id)
    }));
}
