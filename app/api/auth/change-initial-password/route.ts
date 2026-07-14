import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createClient();
  if (!supabase) return NextResponse.json({ error: "Supabaseの設定を確認できませんでした。" }, { status: 500 });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("complete_initial_password_change");
  if (error || data !== true) {
    return NextResponse.json({ error: "初回パスワード変更を完了できませんでした。" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
