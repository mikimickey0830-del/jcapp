import { attendanceService } from "@/services/attendanceService";

export function useAttendance() {
  return {
    attendanceEvents: attendanceService.getFallbackAttendanceEvents(),
    getAttendanceSummary: attendanceService.getFallbackAttendanceSummary
  };
}

export function useAttendanceEvent(eventId: string) {
  return {
    rows: attendanceService.getFallbackAttendanceRows(eventId),
    summary: attendanceService.getFallbackAttendanceSummary(eventId),
    attendanceStatusLabels: attendanceService.attendanceStatusLabels,
    attendanceStatusTones: attendanceService.attendanceStatusTones
  };
}

export function useUnansweredAttendance(memberId: string) {
  return {
    unansweredAttendance: attendanceService.getUnansweredAttendanceForMember(memberId)
  };
}
