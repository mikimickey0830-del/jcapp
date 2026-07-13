import { NextResponse } from "next/server";
import { requireManagement } from "@/lib/auth/requireManagement";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/service";
import type { MemberStatus } from "@/types/member";

type MemberRequestBody = {
  lastName?: string;
  firstName?: string;
  lastNameKana?: string;
  firstNameKana?: string;
  email?: string;
  phone?: string;
  joinedYear?: number;
  status?: MemberStatus;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validStatuses: MemberStatus[] = ["active", "inactive", "graduated"];

function validateMemberInput(body: MemberRequestBody) {
  if (!body.lastName?.trim() || !body.firstName?.trim()) {
    return "氏名は必須です。";
  }

  if (!body.email || !emailPattern.test(body.email.trim())) {
    return "メールアドレスの形式を確認してください。";
  }

  if (!Number.isInteger(body.joinedYear)) {
    return "入会年度は数値で入力してください。";
  }

  if (body.status && !validStatuses.includes(body.status)) {
    return "ステータスの値が不正です。";
  }

  return null;
}

async function getDefaultLomId() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("loms")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id as string | undefined;
}

export async function POST(request: Request) {
  const guard = await requireManagement();
  if (guard.response) return guard.response;
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Supabase環境変数が未設定です。" }, { status: 500 });
  }

  const body = (await request.json()) as MemberRequestBody;
  const validationError = validateMemberInput(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const lomId = await getDefaultLomId();

    if (!lomId) {
      return NextResponse.json({ error: "登録先LOMが見つかりません。" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("members")
      .insert({
        lom_id: lomId,
        last_name: body.lastName?.trim(),
        first_name: body.firstName?.trim(),
        last_name_kana: body.lastNameKana?.trim() ?? "",
        first_name_kana: body.firstNameKana?.trim() ?? "",
        email: body.email?.trim(),
        phone: body.phone?.trim() ?? "",
        joined_year: body.joinedYear,
        status: body.status ?? "active"
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
