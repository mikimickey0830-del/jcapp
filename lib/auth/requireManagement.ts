import "server-only";
import { NextResponse } from "next/server";
import { authService } from "@/services/authService";

/** Use at the start of every LOM management Route Handler. */
export async function requireManagement() {
  const authContext = await authService.getCurrentAuthContext();
  if (!authContext.isAuthenticated) {
    return { authContext, response: NextResponse.json({ error: "ログインが必要です。" }, { status: 401 }) };
  }
  if (!authContext.member || !authContext.canManage) {
    return { authContext, response: NextResponse.json({ error: "管理操作を実行する権限がありません。" }, { status: 403 }) };
  }
  return { authContext, response: null };
}
