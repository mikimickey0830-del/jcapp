import { supabase } from "@/lib/supabase/service";
import type {
  AnnouncementImportance,
  AnnouncementMutationPayload,
  AnnouncementType,
  AnnouncementVisibility
} from "@/types/announcement";

const announcementTypes: AnnouncementType[] = [
  "general",
  "regular_meeting",
  "board_meeting",
  "committee",
  "deadline",
  "document_added",
  "other"
];

const announcementVisibilities: AnnouncementVisibility[] = ["all", "members", "board", "committee", "admins"];
const announcementImportances: AnnouncementImportance[] = ["normal", "important", "urgent"];

export function validateAnnouncementInput(body: AnnouncementMutationPayload) {
  if (!body.fiscalYearId) return "対象年度を選択してください。";
  if (!body.title?.trim()) return "タイトルを入力してください。";
  if (!body.body?.trim()) return "本文を入力してください。";
  if (!body.type || !announcementTypes.includes(body.type)) return "種別の値が不正です。";
  if (!body.targetLom?.trim()) return "対象LOMを選択してください。";
  if (!body.visibility || !announcementVisibilities.includes(body.visibility)) return "公開範囲の値が不正です。";
  if (!body.importance || !announcementImportances.includes(body.importance)) return "重要度の値が不正です。";
  if (!body.publishStartAt || Number.isNaN(Date.parse(body.publishStartAt))) {
    return "公開開始日時を入力してください。";
  }
  if (body.publishEndAt && Number.isNaN(Date.parse(body.publishEndAt))) {
    return "公開終了日時の形式が正しくありません。";
  }
  if (body.publishEndAt && body.publishStartAt && new Date(body.publishEndAt) < new Date(body.publishStartAt)) {
    return "公開終了日時は公開開始日時より後にしてください。";
  }
  if (!body.authorMemberId) return "作成者を選択してください。";
  return null;
}

export async function getAnnouncementLomId(fiscalYearId: string) {
  if (!supabase) throw new Error("Supabase環境変数が未設定です。");

  const { data, error } = await supabase.from("fiscal_years").select("lom_id").eq("id", fiscalYearId).single();
  if (error || !data) throw new Error("年度情報を取得できませんでした。");

  return data.lom_id as string;
}

export async function validateTargetCommittee(fiscalYearId: string, committeeId?: string) {
  if (!committeeId) return;
  if (!supabase) throw new Error("Supabase環境変数が未設定です。");

  const { data, error } = await supabase
    .from("committees")
    .select("id")
    .eq("id", committeeId)
    .eq("fiscal_year_id", fiscalYearId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) throw new Error("対象委員会が対象年度に存在しません。");
}

export function toAnnouncementPayload(body: AnnouncementMutationPayload, lomId: string) {
  return {
    lom_id: lomId,
    fiscal_year_id: body.fiscalYearId as string,
    title: body.title?.trim(),
    body: body.body?.trim(),
    announcement_type: body.type,
    target_lom: body.targetLom?.trim(),
    target_committee_id: body.targetCommitteeId || null,
    visibility: body.visibility,
    importance: body.importance,
    publish_start_at: body.publishStartAt,
    publish_end_at: body.publishEndAt || null,
    author_member_id: body.authorMemberId || null
  };
}
