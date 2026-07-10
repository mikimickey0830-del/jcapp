import type { CommitteeMemberRole } from "@/types/committee";

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
  fiscalYearId: string;
  fiscalYear: number;
  lomId: string;
  lomName: string;
  title: string;
  eventType: EventType;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  googleMapUrl: string;
  targetAudience: string;
  description: string;
  requiresAttendance: boolean;
  attendanceDeadline?: string;
  reminderAt?: string;
  googleCalendarEventId?: string;
  targetCommitteeIds: string[];
  targetPositionIds: string[];
  targetMemberIds: string[];
  targetCommittees: Array<{ id: string; name: string }>;
  targetPositions: Array<{ id: string; name: string }>;
  targetMembers: Array<{ id: string; name: string }>;
  operatingCommitteeId: string;
  operatingCommitteeName: string;
  contactMemberId: string;
  contactMemberName: string;
  bringItems: string;
  dressCode: string;
  notes: string;
  deletedAt: string | null;
};

export type EventFormOptions = {
  fiscalYears: Array<{
    id: string;
    year: number;
    name: string;
    lomId: string;
    lomName: string;
  }>;
  committees: Array<{
    id: string;
    fiscalYearId: string;
    name: string;
  }>;
  positions: Array<{
    id: string;
    fiscalYearId: string;
    name: string;
  }>;
  members: Array<{
    id: string;
    name: string;
    kana: string;
  }>;
};

export type EventMutationPayload = {
  fiscalYearId?: string;
  title?: string;
  eventType?: EventType;
  startsAt?: string;
  endsAt?: string;
  venue?: string;
  address?: string;
  googleMapUrl?: string;
  targetAudience?: string;
  description?: string;
  requiresAttendance?: boolean;
  attendanceDeadline?: string;
  reminderAt?: string;
  googleCalendarEventId?: string;
  targetCommitteeIds?: string[];
  targetPositionIds?: string[];
  targetMemberIds?: string[];
  operatingCommitteeId?: string;
  contactMemberId?: string;
  bringItems?: string;
  dressCode?: string;
  notes?: string;
};

export type CommitteeTargetRole = CommitteeMemberRole;
