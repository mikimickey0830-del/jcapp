import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { attendanceService } from "@/services/attendanceService";
import { authService } from "@/services/authService";
import type { AttendanceMutationPayload } from "@/types/attendance";

export async function POST(request: Request, { params }: { params: { eventId: string } }) {
  const authContext = await authService.getCurrentAuthContext();
  if (!authContext.isAuthenticated) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  if (!authContext.member) return NextResponse.json({ error: "会員情報が紐付いていません。" }, { status: 403 });

  const body = (await request.json()) as AttendanceMutationPayload;
  const requestedMemberId = body.memberId ?? authContext.member.id;
  if (requestedMemberId !== authContext.member.id && !authContext.canManage) {
    return NextResponse.json({ error: "他の会員の出欠は更新できません。" }, { status: 403 });
  }

  const result = await attendanceService.saveAttendanceResponse(
    params.eventId,
    { ...body, memberId: requestedMemberId },
    createClient(),
  );
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ eventId: result.eventId ?? params.eventId });
}
