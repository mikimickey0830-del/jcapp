export type AttendanceStatus = "attending" | "absent" | "late" | "unanswered";

export type AttendanceResponse = {
  eventId: string;
  memberId: string;
  status: AttendanceStatus;
  comment: string;
  respondedAt?: string;
};
