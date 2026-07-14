import { NextResponse } from "next/server";
import { isValidMemberPassword, passwordRequirementMessage } from "@/lib/auth/passwordPolicy";
import { createClient } from "@/lib/supabase/server";
import { memberInvitationService } from "@/services/memberInvitationService";

export const dynamic = "force-dynamic";

type RequestBody = { password?: string };

export async function POST(request: Request) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabaseの設定が見つかりません。" }, { status: 500 });
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "招待リンクが無効か期限切れです。" }, { status: 401 });
  }

  const body = (await request.json()) as RequestBody;
  if (!body.password || !isValidMemberPassword(body.password)) {
    return NextResponse.json({ error: passwordRequirementMessage }, { status: 400 });
  }

  // The invite session is stored in the request cookies. Updating through the
  // server keeps the same password policy on both invitation and initial-use flows.
  const { error: passwordError } = await supabase.auth.updateUser({ password: body.password });
  if (passwordError) {
    return NextResponse.json({ error: "パスワードを設定できませんでした。入力内容を確認してください。" }, { status: 400 });
  }

  const result = await memberInvitationService.activateInvitation({
    authUserId: data.user.id,
    email: data.user.email,
    userMetadata: data.user.user_metadata,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ memberId: result.memberId, alreadyActive: result.alreadyActive });
}
