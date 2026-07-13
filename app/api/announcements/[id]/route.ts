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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

    const { error } = await supabase
      .from("announcements")
      .update({ ...toAnnouncementPayload(body, lomId), updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
    return NextResponse.json({ id: params.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "お知らせを更新できませんでした。" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const guard = await requireManagement();
  if (guard.response) return guard.response;
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("announcements")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", params.id)
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: params.id });
}
