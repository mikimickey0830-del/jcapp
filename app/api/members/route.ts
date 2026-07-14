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
  issueAccount?: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validStatuses: MemberStatus[] = ["active", "inactive", "graduated"];

function validateMemberInput(body: MemberRequestBody) {
  if (!body.lastName?.trim() || !body.firstName?.trim()) return "氏名は必須です。";
  if (!body.email || !emailPattern.test(body.email.trim())) return "メールアドレスの形式を確認してください。";
  if (!Number.isInteger(body.joinedYear)) return "入会年度は数値で入力してください。";
  if (body.status && !validStatuses.includes(body.status)) return "ステータスの値が正しくありません。";
  return null;
}

export async function POST(request: Request) {
  const guard = await requireManagement();
  if (guard.response) return guard.response;
  if (!isSupabaseConfigured || !supabase || !guard.authContext.member || !guard.authContext.userId) {
    return NextResponse.json({ error: "Supabaseの設定を確認できませんでした。" }, { status: 500 });
  }

  const body = (await request.json()) as MemberRequestBody;
  const validationError = validateMemberInput(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  try {
    // Always create members in the authenticated manager's LOM. This keeps
    // the endpoint safe when JC-App is later used by multiple LOMs.
    const lomId = guard.authContext.member.lomId;

    const input = {
      lastName: body.lastName!.trim(),
      firstName: body.firstName!.trim(),
      lastNameKana: body.lastNameKana?.trim() ?? "",
      firstNameKana: body.firstNameKana?.trim() ?? "",
      email: body.email!.trim(),
      phone: body.phone?.trim() ?? "",
      joinedYear: body.joinedYear!,
      status: body.status ?? "active",
    };

    if (body.issueAccount !== false) {
      const result = await accountProvisioningService.createMemberWithInitialAccount(input, lomId, guard.authContext.userId);
      if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
      return NextResponse.json({ id: result.value.memberId, credentials: result.value });
    }

    const result = await accountProvisioningService.createMemberWithoutAccount(input, lomId);
    if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
    return NextResponse.json({ id: result.value.memberId });
  } catch {
    return NextResponse.json({ error: "会員情報を保存できませんでした。" }, { status: 500 });
  }
}
