import { announcementService } from "@/services/announcementService";
import { assignmentService } from "@/services/assignmentService";
import { attendanceService } from "@/services/attendanceService";
import { documentService } from "@/services/documentService";
import { scheduleService } from "@/services/scheduleService";
import { yearService } from "@/services/yearService";
import type { Announcement } from "@/types/announcement";
import type { DashboardResult } from "@/types/dashboard";
import type { FiscalYear } from "@/types/year";

// TODO: Supabase Auth接続時に members.auth_user_id からログイン会員を特定する。
const DEFAULT_DASHBOARD_MEMBER_ID = "20000000-0000-0000-0000-000000000004";

const importanceOrder: Record<Announcement["importance"], number> = {
  urgent: 0,
  important: 1,
  normal: 2,
};

function findCurrentFiscalYear(years: FiscalYear[]) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    years.find((year) => year.status === "current") ??
    years.find((year) => year.startsOn <= today && year.endsOn >= today) ??
    [...years].sort((a, b) => b.year - a.year)[0]
  );
}

function sortAnnouncements(items: Announcement[]) {
  return [...items].sort((a, b) => {
    const importanceDifference =
      importanceOrder[a.importance] - importanceOrder[b.importance];
    if (importanceDifference !== 0) return importanceDifference;
    return b.publishStartAt.localeCompare(a.publishStartAt);
  });
}

async function getDashboard(): Promise<DashboardResult> {
  const currentMemberId = DEFAULT_DASHBOARD_MEMBER_ID;
  const [yearsResult, scheduleResult, announcementResult, documentResult] =
    await Promise.all([
      yearService.getYears(),
      scheduleService.getEvents(),
      announcementService.getLatestAnnouncements(8),
      documentService.getLatestDocuments(4),
    ]);

  const currentFiscalYear = findCurrentFiscalYear(yearsResult.data);
  const [attendanceResult, assignmentResult] = await Promise.all([
    attendanceService.getAttendanceDashboard(currentMemberId),
    currentFiscalYear
      ? assignmentService.getAssignmentYear(currentFiscalYear.id)
      : Promise.resolve(null),
  ]);

  const errors = [
    yearsResult.error,
    scheduleResult.error,
    announcementResult.error,
    documentResult.error,
    attendanceResult.error,
    assignmentResult?.error,
  ].filter((message): message is string => Boolean(message));

  const todayEvents = scheduleService.getTodayEvents(scheduleResult.data);
  const todayIds = new Set(todayEvents.map((event) => event.id));
  const thisWeekEvents = scheduleService
    .getThisWeekEvents(scheduleResult.data)
    .filter((event) => !todayIds.has(event.id))
    .slice(0, 6);

  return {
    data: {
      currentFiscalYear,
      currentMemberId,
      currentAssignment: assignmentResult?.data?.rows.find(
        (row) => row.memberId === currentMemberId && row.isActive,
      ),
      todayEvents,
      thisWeekEvents,
      attendance: attendanceResult.data,
      announcements: sortAnnouncements(announcementResult.data).slice(0, 4),
      documents: documentResult.data,
    },
    errors: Array.from(new Set(errors)),
    usesFallback: [
      yearsResult.source,
      scheduleResult.source,
      announcementResult.source,
      documentResult.source,
      attendanceResult.source,
      assignmentResult?.source,
    ].some((source) => source === "fallback"),
  };
}

export const dashboardService = { getDashboard };
