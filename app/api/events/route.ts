import { NextResponse } from "next/server";
import { requireManagement } from "@/lib/auth/requireManagement";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/service";
import {
  getFiscalYearLomId,
  syncAttendanceResponses,
  toEventPayload,
  validateEventInput
} from "@/services/eventMutationService";
import type { EventMutationPayload } from "@/types/schedule";

export async function POST(request: Request) {
  const guard = await requireManagement();
  if (guard.response) return guard.response;
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  const body = (await request.json()) as EventMutationPayload;
  const validationError = validateEventInput(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  try {
    const lomId = await getFiscalYearLomId(body.fiscalYearId as string);
    const { data, error } = await supabase
      .from("events")
      .insert(toEventPayload(body, lomId))
      .select("id")
      .single();

    if (error || !data) throw new Error(error?.message ?? "イベントを保存できませんでした。");

    await syncAttendanceResponses(data.id, lomId, body);
    return NextResponse.json({ id: data.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "イベントを保存できませんでした。" },
      { status: 500 }
    );
  }
}
