import type { ScheduleEvent } from "@/types/schedule";

export type AttendanceStatus = "attending" | "absent" | "late" | "unanswered";

export type AttendanceResponse = {
  id?: string;
  eventId: string;
  memberId: string;
  status: AttendanceStatus;
  comment: string;
  respondedAt?: string;
  replyDeadline?: string;
  isOverdue?: boolean;
};

export type AttendanceRow = {
  responseId: string;
  eventId: string;
  memberId: string;
  memberName: string;
  memberKana: string;
  memberEmail: string;
  status: AttendanceStatus;
  comment: string;
  respondedAt?: string;
  replyDeadline?: string;
  isOverdue: boolean;
  committees: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  position?: {
    id: string;
    name: string;
  };
};

export type AttendanceGroupSummary = {
  id: string;
  name: string;
  total: number;
  attending: number;
  absent: number;
  late: number;
  unanswered: number;
  responseRate: number;
};

export type AttendanceSummary = {
  attending: number;
  absent: number;
  late: number;
  unanswered: number;
  answered: number;
  total: number;
  responseRate: number;
  isDeadlineOver: boolean;
  unansweredRows: AttendanceRow[];
  committeeSummaries: AttendanceGroupSummary[];
  positionSummaries: AttendanceGroupSummary[];
};

export type AttendanceEventDetail = {
  event: ScheduleEvent;
  rows: AttendanceRow[];
  summary: AttendanceSummary;
};

export type AttendanceEventListItem = {
  event: ScheduleEvent;
  summary: AttendanceSummary;
};

export type AttendanceDashboard = {
  events: AttendanceEventListItem[];
  unansweredItems: Array<{
    event: ScheduleEvent;
    row: AttendanceRow;
    isOverdue: boolean;
  }>;
  dueTodayItems: Array<{
    event: ScheduleEvent;
    row: AttendanceRow;
  }>;
  dueThisWeekItems: Array<{
    event: ScheduleEvent;
    row: AttendanceRow;
  }>;
};

export type AttendanceMutationPayload = {
  memberId?: string;
  status?: AttendanceStatus;
  comment?: string;
};
