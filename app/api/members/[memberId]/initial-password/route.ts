import { NextResponse } from "next/server";
import { requireManagement } from "@/lib/auth/requireManagement";
import { accountProvisioningService } from "@/services/accountProvisioningService";

type RequestBody = { action?: "issue" | "reissue" };

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { memberId: string } }) {
  const guard = await requireManagement();
  if (guard.response) return guard.response;
  if (!guard.authContext.member || !guard.authContext.userId) {
    return NextResponse.json({ error: "管理者情報を確認できませんでした。" }, { status: 403 });
  }

  const body = (await request.json()) as RequestBody;
  const result = body.action === "reissue"
    ? await accountProvisioningService.reissueInitialPassword(params.memberId, guard.authContext.member.lomId)
    : await accountProvisioningService.issueInitialPassword(
        params.memberId,
        guard.authContext.member.lomId,
        guard.authContext.userId,
      );

  if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });

  // The password is returned only to the requesting manager. The UI holds it
  // in component state and never persists it in a URL, cookie, or database.
  return NextResponse.json({ credentials: result.value });
}
