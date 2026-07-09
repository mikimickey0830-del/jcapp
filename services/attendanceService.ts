import {
  attendanceStatusLabels,
  attendanceStatusTones,
  getAttendanceEvents,
  getAttendanceRows,
  getAttendanceSummary,
  getUnansweredAttendanceForMember
} from "@/lib/attendance";

// TODO: Supabase接続時にここを差し替える。
export const attendanceService = {
  getAttendanceEvents,
  getAttendanceRows,
  getAttendanceSummary,
  getUnansweredAttendanceForMember,
  attendanceStatusLabels,
  attendanceStatusTones
};
