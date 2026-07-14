import { NextResponse } from "next/server";
import { isValidMemberPassword, passwordRequirementMessage } from "@/lib/auth/passwordPolicy";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RequestBody = {
  currentPassword?: string;
  newPassword?: string;
};

export async function POST(request: Request) {
  const supabase = createClient();
  if (!supabase) return NextResponse.json({ error: "Supabaseの設定を確認できませんでした。" }, { status: 500 });

  const body = (await request.json()) as RequestBody;
  if (!body.currentPassword) {
    return NextResponse.json({ error: "現在の初期パスワードを入力してください。" }, { status: 400 });
  }
  if (!body.newPassword || !isValidMemberPassword(body.newPassword)) {
    return NextResponse.json({ error: passwordRequirementMessage }, { status: 400 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  // Supabase verifies the current password inside the authenticated server
  // request. The new value is never logged or stored by JC-App.
  const { error: passwordError } = await supabase.auth.updateUser({
    current_password: body.currentPassword,
    password: body.newPassword,
  });
  if (passwordError) {
    return NextResponse.json({ error: "パスワードを変更できませんでした。入力内容を確認してください。" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("complete_initial_password_change");
  if (error || data !== true) {
    return NextResponse.json({ error: "初回パスワード変更を完了できませんでした。" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
