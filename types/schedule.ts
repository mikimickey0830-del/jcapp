export type EventType =
  | "regular_meeting"
  | "board_meeting"
  | "committee"
  | "project"
  | "block"
  | "jci_japan"
  | "other";

export type ScheduleEvent = {
  id: string;
  fiscalYear: number;
  lomName: string;
  title: string;
  eventType: EventType;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  targetAudience: string;
  description: string;
  requiresAttendance: boolean;
  attendanceDeadline?: string;
};
