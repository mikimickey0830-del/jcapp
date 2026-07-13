import type { Announcement } from "@/types/announcement";
import type { AnnualMemberAssignmentView } from "@/types/assignment";
import type { AttendanceDashboard } from "@/types/attendance";
import type { SharedDocument } from "@/types/document";
import type { ScheduleEvent } from "@/types/schedule";
import type { FiscalYear } from "@/types/year";

export type DashboardData = {
  currentFiscalYear?: FiscalYear;
  currentMemberId: string;
  currentAssignment?: AnnualMemberAssignmentView;
  todayEvents: ScheduleEvent[];
  thisWeekEvents: ScheduleEvent[];
  attendance: AttendanceDashboard;
  announcements: Announcement[];
  documents: SharedDocument[];
};

export type DashboardResult = {
  data: DashboardData;
  errors: string[];
  usesFallback: boolean;
};
