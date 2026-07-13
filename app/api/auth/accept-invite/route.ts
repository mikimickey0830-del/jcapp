import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { memberInvitationService } from "@/services/memberInvitationService";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabaseの設定が見つかりません。" }, { status: 500 });
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "招待リンクが無効か期限切れです。" }, { status: 401 });
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
