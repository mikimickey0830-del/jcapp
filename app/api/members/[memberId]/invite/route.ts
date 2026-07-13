import { NextResponse } from "next/server";
import { authService } from "@/services/authService";
import { memberInvitationService } from "@/services/memberInvitationService";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { memberId: string } }) {
  const authContext = await authService.getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.member || !authContext.canManage) {
    return NextResponse.json({ error: "招待を実行する権限がありません。" }, { status: 403 });
  }

  let resend = false;
  try {
    const body = (await request.json()) as { resend?: unknown };
    resend = body.resend === true;
  } catch {
    // An empty request body is the normal first-invitation request.
  }

  const result = await memberInvitationService.inviteMember(params.memberId, authContext.member, resend);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ status: result.status, message: result.message });
}
