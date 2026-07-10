import { NextResponse } from "next/server";
import { attendanceService } from "@/services/attendanceService";
import type { AttendanceMutationPayload } from "@/types/attendance";

export async function POST(request: Request, { params }: { params: { eventId: string } }) {
  const body = (await request.json()) as AttendanceMutationPayload;
  const result = await attendanceService.saveAttendanceResponse(params.eventId, body);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ eventId: result.eventId ?? params.eventId });
}
