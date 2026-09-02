import { announcementService } from "@/services/announcementService";
import { assignmentService } from "@/services/assignmentService";
import { attendanceService } from "@/services/attendanceService";
import { scheduleService } from "@/services/scheduleService";
import { yearService } from "@/services/yearService";
import type { Announcement } from "@/types/announcement";
import type { AttendanceDashboard } from "@/types/attendance";
import type { DashboardResult, DashboardViewer } from "@/types/dashboard";
import type { ScheduleEvent } from "@/types/schedule";
import type { FiscalYear } from "@/types/year";

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

const emptyAttendance: AttendanceDashboard = {
  events: [],
  unansweredItems: [],
  dueTodayItems: [],
  dueThisWeekItems: [],
};

function isTargetEvent(
  event: ScheduleEvent,
  viewer: DashboardViewer | undefined,
  assignment: DashboardResult["data"]["currentAssignment"],
) {
  if (!viewer) return false;
  if (event.lomId && event.lomId !== viewer.lomId) return false;
  const hasTargets =
    event.targetMemberIds.length > 0 ||
    event.targetPositionIds.length > 0 ||
    event.targetCommitteeIds.length > 0;
  if (!hasTargets) return true;
  if (event.targetMemberIds.includes(viewer.memberId)) return true;
  if (assignment?.positionId && event.targetPositionIds.includes(assignment.positionId)) return true;
  return Boolean(
    assignment?.committeeMemberships.some((membership) =>
      event.targetCommitteeIds.includes(membership.committeeId),
    ),
  );
}

async function getDashboard(viewer?: DashboardViewer): Promise<DashboardResult> {
  const currentMemberId = viewer?.memberId;
  const [yearsResult, scheduleResult, announcementResult] =
    await Promise.all([
      yearService.getYears(),
      scheduleService.getEvents(),
      announcementService.getLatestAnnouncements(8),
    ]);

  const currentFiscalYear = findCurrentFiscalYear(yearsResult.data);
  const [attendanceResult, assignmentResult] = await Promise.all([
    currentMemberId
      ? attendanceService.getAttendanceDashboard(currentMemberId)
      : Promise.resolve({ data: emptyAttendance, error: null, source: "supabase" as const }),
    currentFiscalYear
      ? assignmentService.getAssignmentYear(currentFiscalYear.id)
      : Promise.resolve(null),
  ]);

  const errors = [
    yearsResult.error,
    scheduleResult.error,
    announcementResult.error,
    attendanceResult.error,
    assignmentResult?.error,
  ].filter((message): message is string => Boolean(message));

  const currentAssignment = assignmentResult?.data?.rows.find(
    (row) => row.memberId === currentMemberId && row.isActive,
  );
  const visibleEvents = scheduleResult.data.filter((event) =>
    isTargetEvent(event, viewer, currentAssignment),
  );
  const visibleAnnouncements = announcementResult.data.filter(
    (announcement) =>
      viewer &&
      announcement.lomId === viewer.lomId &&
      (!announcement.targetCommitteeId ||
        currentAssignment?.committeeMemberships.some(
          (membership) => membership.committeeId === announcement.targetCommitteeId,
        )),
  );
  const todayEvents = scheduleService.getTodayEvents(visibleEvents);
  const todayIds = new Set(todayEvents.map((event) => event.id));
  const thisWeekEvents = scheduleService
    .getThisWeekEvents(visibleEvents)
    .filter((event) => !todayIds.has(event.id))
    .slice(0, 6);

  return {
    data: {
      currentFiscalYear,
      currentMemberId,
      currentAssignment,
      todayEvents,
      thisWeekEvents,
      attendance: attendanceResult.data,
      announcements: sortAnnouncements(visibleAnnouncements).slice(0, 4),
    },
    errors: Array.from(new Set(errors)),
    usesFallback: [
      yearsResult.source,
      scheduleResult.source,
      announcementResult.source,
      attendanceResult.source,
      assignmentResult?.source,
    ].some((source) => source === "fallback"),
  };
}

export const dashboardService = { getDashboard };
