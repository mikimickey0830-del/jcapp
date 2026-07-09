import { attendanceService } from "@/services/attendanceService";

export function useAttendance() {
  return {
    attendanceEvents: attendanceService.getAttendanceEvents(),
    getAttendanceSummary: attendanceService.getAttendanceSummary
  };
}

export function useAttendanceEvent(eventId: string) {
  return {
    rows: attendanceService.getAttendanceRows(eventId),
    summary: attendanceService.getAttendanceSummary(eventId),
    attendanceStatusLabels: attendanceService.attendanceStatusLabels,
    attendanceStatusTones: attendanceService.attendanceStatusTones
  };
}

export function useUnansweredAttendance(memberId: string) {
  return {
    unansweredAttendance: attendanceService.getUnansweredAttendanceForMember(memberId)
  };
}
