import { NextResponse } from "next/server";
import { requireManagement } from "@/lib/auth/requireManagement";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/service";
import { accountProvisioningService } from "@/services/accountProvisioningService";
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

function databaseErrorResponse(error: { code?: string; message: string }) {
  // 同一LOM内でのメールアドレス重複は、画面で対応方法が分かる形にする。
  if (error.code === "23505" || error.message.includes("members_lom_id_email_key")) {
    return NextResponse.json(
      { error: "このメールアドレスは、すでに別の会員に登録されています。別のメールアドレスを入力してください。" },
      { status: 409 }
    );
  }

  return NextResponse.json({ error: "会員情報を保存できませんでした。時間をおいて再度お試しください。" }, { status: 500 });
}

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

export async function PATCH(request: Request, { params }: { params: { memberId: string } }) {
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

  const { data: existingMember, error: existingMemberError } = await supabase
    .from("members")
    .select("id, lom_id, email, auth_user_id")
    .eq("id", params.memberId)
    .maybeSingle();

  if (existingMemberError) return databaseErrorResponse(existingMemberError);
  if (!existingMember || existingMember.lom_id !== guard.authContext.member?.lomId) {
    return NextResponse.json({ error: "対象会員が見つかりません。" }, { status: 404 });
  }

  const nextEmail = body.email!.trim().toLowerCase();
  const emailSync = await accountProvisioningService.synchronizeManagedAccountEmail(
    params.memberId,
    existingMember.lom_id,
    nextEmail,
  );
  if (!emailSync.ok) {
    return NextResponse.json({ error: emailSync.message }, { status: emailSync.status });
  }

  const { error } = await supabase
    .from("members")
    .update({
      last_name: body.lastName?.trim(),
      first_name: body.firstName?.trim(),
      last_name_kana: body.lastNameKana?.trim() ?? "",
      first_name_kana: body.firstNameKana?.trim() ?? "",
      email: nextEmail,
      phone: body.phone?.trim() ?? "",
      joined_year: body.joinedYear,
      status: body.status ?? "active",
      updated_at: new Date().toISOString()
    })
    .eq("id", params.memberId);

  if (error) {
    // When the database update fails after changing an Auth login ID, restore
    // the previous Auth email so the member record and login ID stay aligned.
    await accountProvisioningService.restoreManagedAccountEmail(
      params.memberId,
      existingMember.lom_id,
      emailSync.value.previousEmail,
    );
    return databaseErrorResponse(error);
  }

  return NextResponse.json({ id: params.memberId });
}
