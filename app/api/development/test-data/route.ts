import { NextResponse } from "next/server";
import { isDevelopmentEnvironment } from "@/lib/environment";
import { requireManagement } from "@/lib/auth/requireManagement";
import { developmentTestDataService } from "@/services/developmentTestDataService";

function developmentOnlyResponse() {
  return NextResponse.json({ error: "開発環境でのみ利用できる機能です。" }, { status: 404 });
}

export async function GET() {
  if (!isDevelopmentEnvironment()) return developmentOnlyResponse();
  const guard = await requireManagement();
  if (guard.response) return guard.response;
  const member = guard.authContext.member;
  if (!member) return NextResponse.json({ error: "会員情報を確認できませんでした。" }, { status: 403 });

  const result = await developmentTestDataService.getStatus(member);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result.data);
}

export async function POST() {
  if (!isDevelopmentEnvironment()) return developmentOnlyResponse();
  const guard = await requireManagement();
  if (guard.response) return guard.response;
  const member = guard.authContext.member;
  if (!member) return NextResponse.json({ error: "会員情報を確認できませんでした。" }, { status: 403 });

  const result = await developmentTestDataService.create(member);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE() {
  if (!isDevelopmentEnvironment()) return developmentOnlyResponse();
  const guard = await requireManagement();
  if (guard.response) return guard.response;
  const member = guard.authContext.member;
  if (!member) return NextResponse.json({ error: "会員情報を確認できませんでした。" }, { status: 403 });

  const result = await developmentTestDataService.remove(member);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
