import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import {
  getFiscalYearLomId,
  syncAttendanceResponses,
  toEventPayload,
  validateEventInput
} from "@/services/eventMutationService";
import type { EventMutationPayload } from "@/types/schedule";

export async function PATCH(request: Request, { params }: { params: { eventId: string } }) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  const body = (await request.json()) as EventMutationPayload;
  const validationError = validateEventInput(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  try {
    const lomId = await getFiscalYearLomId(body.fiscalYearId as string);
    const { error } = await supabase
      .from("events")
      .update({ ...toEventPayload(body, lomId), updated_at: new Date().toISOString() })
      .eq("id", params.eventId);

    if (error) throw new Error(error.message);

    await syncAttendanceResponses(params.eventId, lomId, body);
    return NextResponse.json({ id: params.eventId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "イベントを更新できませんでした。" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { eventId: string } }) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  const { error } = await supabase
    .from("events")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", params.eventId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: params.eventId });
}
