import { NextResponse } from "next/server";
import { requireManagement } from "@/lib/auth/requireManagement";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/service";
import {
  getAnnouncementLomId,
  toAnnouncementPayload,
  validateAnnouncementInput,
  validateTargetCommittee
} from "@/services/announcementMutationService";
import type { AnnouncementMutationPayload } from "@/types/announcement";

export async function POST(request: Request) {
  const guard = await requireManagement();
  if (guard.response) return guard.response;
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  const body = (await request.json()) as AnnouncementMutationPayload;
  const validationError = validateAnnouncementInput(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  try {
    const fiscalYearId = body.fiscalYearId as string;
    const lomId = await getAnnouncementLomId(fiscalYearId);
    await validateTargetCommittee(fiscalYearId, body.targetCommitteeId);

    const { data, error } = await supabase
      .from("announcements")
      .insert(toAnnouncementPayload(body, lomId))
      .select("id")
      .single();

    if (error || !data) throw new Error(error?.message ?? "お知らせを保存できませんでした。");

    // TODO: Authと対象者判定を実装後、公開対象の会員ごとにnotificationsへ
    // notification_type: "announcement"、related_href: `/announcements/${data.id}` を登録する。
    return NextResponse.json({ id: data.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "お知らせを保存できませんでした。" },
      { status: 500 }
    );
  }
}
