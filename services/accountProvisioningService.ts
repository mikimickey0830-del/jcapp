import "server-only";
import { randomInt } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MemberStatus } from "@/types/member";

type MemberInput = {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  email: string;
  phone: string;
  joinedYear: number;
  status: MemberStatus;
};

type CredentialResult = {
  memberId: string;
  memberName: string;
  loginId: string;
  initialPassword: string;
};

type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: number; message: string };

type MemberAccountRow = {
  id: string;
  lom_id: string;
  auth_user_id: string | null;
  email: string;
  last_name: string;
  first_name: string;
};

const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const lowercase = "abcdefghijkmnopqrstuvwxyz";
const digits = "23456789";
const symbols = "!@#$%*+-_";
const allPasswordCharacters = `${uppercase}${lowercase}${digits}${symbols}`;

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

function randomCharacter(characters: string) {
  return characters[randomInt(characters.length)];
}

/** Generates a one-time credential without persisting or logging its plaintext. */
export function generateInitialPassword() {
  const characters = [
    randomCharacter(uppercase),
    randomCharacter(lowercase),
    randomCharacter(digits),
    randomCharacter(symbols),
    ...Array.from({ length: 12 }, () => randomCharacter(allPasswordCharacters)),
  ];

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }

  return characters.join("");
}

async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  if (!admin) return { user: null, error: "account_service_unavailable" as const };

  const expectedEmail = normalizedEmail(email);
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return { user: null, error: "account_service_unavailable" as const };

    const user = data.users.find((candidate) => normalizedEmail(candidate.email ?? "") === expectedEmail);
    if (user) return { user, error: null };
    if (data.users.length < 1000) break;
  }

  return { user: null, error: null };
}

async function loadManagedMember(memberId: string, lomId: string) {
  const supabase = createClient();
  if (!supabase) return { member: null, error: "Supabase is not configured." };

  const { data, error } = await supabase
    .from("members")
    .select("id, lom_id, auth_user_id, email, last_name, first_name")
    .eq("id", memberId)
    .eq("lom_id", lomId)
    .maybeSingle();

  return { member: data as MemberAccountRow | null, error: error?.message ?? null };
}

async function createAuthAccount(email: string, password: string, lomId: string, actorAuthUserId: string, memberId?: string) {
  const admin = createAdminClient();
  if (!admin) return { user: null, error: "account_service_unavailable" as const };

  const { data, error } = await admin.auth.admin.createUser({
    email: normalizedEmail(email),
    password,
    email_confirm: true,
    user_metadata: {
      ...(memberId ? { member_id: memberId } : {}),
      lom_id: lomId,
      issued_by: actorAuthUserId,
    },
  });

  return { user: data.user, error: error ? "create_failed" as const : null };
}

async function deleteAuthAccount(userId: string) {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.auth.admin.deleteUser(userId);
}

async function saveAuthMetadata(userId: string, memberId: string, lomId: string, actorAuthUserId: string) {
  const admin = createAdminClient();
  if (!admin) return;

  // Metadata supports the optional invitation fallback. The direct auth_user_id
  // link has already been saved before this best-effort update runs.
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { member_id: memberId, lom_id: lomId, issued_by: actorAuthUserId },
  });
}

async function recordCredentialEvent(memberId: string, action: "account_issued" | "initial_password_reissued") {
  const supabase = createClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("record_account_credential_event", {
    p_member_id: memberId,
    p_action: action,
  });
  return !error && data === true;
}

async function createMemberWithInitialAccount(
  input: MemberInput,
  lomId: string,
  actorAuthUserId: string,
): Promise<ServiceResult<CredentialResult>> {
  const existingAuth = await findAuthUserByEmail(input.email);
  if (existingAuth.error) {
    return { ok: false, status: 500, message: "認証アカウントの確認ができませんでした。" };
  }
  if (existingAuth.user) {
    return { ok: false, status: 409, message: "このメールアドレスは、すでに認証アカウントとして使用されています。" };
  }

  const password = generateInitialPassword();
  const authAccount = await createAuthAccount(input.email, password, lomId, actorAuthUserId);
  if (!authAccount.user || authAccount.error) {
    return { ok: false, status: 409, message: "認証アカウントを作成できませんでした。メールアドレスの重複を確認してください。" };
  }

  const supabase = createClient();
  if (!supabase) {
    await deleteAuthAccount(authAccount.user.id);
    return { ok: false, status: 500, message: "Supabaseの設定を確認できませんでした。" };
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .insert({
      lom_id: lomId,
      auth_user_id: authAccount.user.id,
      invitation_status: "active",
      activated_at: new Date().toISOString(),
      must_change_password: true,
      last_name: input.lastName.trim(),
      first_name: input.firstName.trim(),
      last_name_kana: input.lastNameKana.trim(),
      first_name_kana: input.firstNameKana.trim(),
      email: normalizedEmail(input.email),
      phone: input.phone.trim(),
      joined_year: input.joinedYear,
      status: input.status,
    })
    .select("id, last_name, first_name, email")
    .single();

  if (memberError || !member) {
    // Auth is created first, so a member insert failure can be compensated
    // without leaving an account that has no owner in JC-App.
    await deleteAuthAccount(authAccount.user.id);
    return { ok: false, status: 409, message: "会員情報を保存できませんでした。メールアドレスの重複を確認してください。" };
  }

  await saveAuthMetadata(authAccount.user.id, member.id, lomId, actorAuthUserId);
  const auditRecorded = await recordCredentialEvent(member.id, "account_issued");
  if (!auditRecorded) {
    return { ok: false, status: 500, message: "アカウント発行の監査記録に失敗しました。初期パスワードは表示しないため、管理者へ連絡してください。" };
  }

  return {
    ok: true,
    value: {
      memberId: member.id,
      memberName: `${member.last_name} ${member.first_name}`,
      loginId: member.email,
      initialPassword: password,
    },
  };
}

async function createMemberWithoutAccount(input: MemberInput, lomId: string): Promise<ServiceResult<{ memberId: string }>> {
  const supabase = createClient();
  if (!supabase) return { ok: false, status: 500, message: "Supabaseの設定を確認できませんでした。" };

  const { data, error } = await supabase
    .from("members")
    .insert({
      lom_id: lomId,
      last_name: input.lastName.trim(),
      first_name: input.firstName.trim(),
      last_name_kana: input.lastNameKana.trim(),
      first_name_kana: input.firstNameKana.trim(),
      email: normalizedEmail(input.email),
      phone: input.phone.trim(),
      joined_year: input.joinedYear,
      status: input.status,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, status: 409, message: "会員情報を保存できませんでした。メールアドレスの重複を確認してください。" };
  }

  return { ok: true, value: { memberId: data.id } };
}

async function issueInitialPassword(
  memberId: string,
  lomId: string,
  actorAuthUserId: string,
): Promise<ServiceResult<CredentialResult>> {
  const loaded = await loadManagedMember(memberId, lomId);
  const member = loaded.member;
  if (loaded.error || !member) return { ok: false, status: 404, message: "対象会員が見つかりません。" };
  if (member.auth_user_id) return { ok: false, status: 409, message: "この会員はすでにアカウント利用を開始しています。再発行を使用してください。" };

  const existingAuth = await findAuthUserByEmail(member.email);
  if (existingAuth.error) return { ok: false, status: 500, message: "認証アカウントの確認ができませんでした。" };
  if (existingAuth.user) {
    return { ok: false, status: 409, message: "このメールアドレスはすでに認証アカウントとして使用されています。メールアドレスを確認してください。" };
  }

  const password = generateInitialPassword();
  const authAccount = await createAuthAccount(member.email, password, member.lom_id, actorAuthUserId, member.id);
  if (!authAccount.user || authAccount.error) {
    return { ok: false, status: 409, message: "認証アカウントを作成できませんでした。メールアドレスを確認してください。" };
  }

  const supabase = createClient();
  if (!supabase) {
    await deleteAuthAccount(authAccount.user.id);
    return { ok: false, status: 500, message: "Supabaseの設定を確認できませんでした。" };
  }

  const { data: linked, error: linkError } = await supabase.rpc("link_issued_member_account", {
    p_member_id: member.id,
    p_auth_user_id: authAccount.user.id,
    p_action: "account_issued",
  });

  if (linkError || linked !== true) {
    await deleteAuthAccount(authAccount.user.id);
    return { ok: false, status: 500, message: "会員アカウントを紐付けできませんでした。" };
  }

  return {
    ok: true,
    value: {
      memberId: member.id,
      memberName: `${member.last_name} ${member.first_name}`,
      loginId: member.email,
      initialPassword: password,
    },
  };
}

async function reissueInitialPassword(
  memberId: string,
  lomId: string,
): Promise<ServiceResult<CredentialResult>> {
  const loaded = await loadManagedMember(memberId, lomId);
  const member = loaded.member;
  if (loaded.error || !member) return { ok: false, status: 404, message: "対象会員が見つかりません。" };
  if (!member.auth_user_id) return { ok: false, status: 409, message: "アカウント未発行の会員です。初期パスワードを発行してください。" };

  const admin = createAdminClient();
  if (!admin) return { ok: false, status: 500, message: "認証アカウントの設定を確認できませんでした。" };

  const password = generateInitialPassword();
  const { error } = await admin.auth.admin.updateUserById(member.auth_user_id, { password });
  if (error) {
    return { ok: false, status: 500, message: "初期パスワードを再発行できませんでした。" };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, status: 500, message: "Supabaseの設定を確認できませんでした。" };
  const { data: marked, error: markError } = await supabase.rpc("link_issued_member_account", {
    p_member_id: member.id,
    p_auth_user_id: member.auth_user_id,
    p_action: "initial_password_reissued",
  });
  if (markError || marked !== true) {
    return { ok: false, status: 500, message: "再発行後の利用開始状態を保存できませんでした。管理者へ連絡してください。" };
  }

  return {
    ok: true,
    value: {
      memberId: member.id,
      memberName: `${member.last_name} ${member.first_name}`,
      loginId: member.email,
      initialPassword: password,
    },
  };
}

async function synchronizeManagedAccountEmail(
  memberId: string,
  lomId: string,
  nextEmail: string,
): Promise<ServiceResult<{ previousEmail: string | null }>> {
  const loaded = await loadManagedMember(memberId, lomId);
  const member = loaded.member;
  if (loaded.error || !member) return { ok: false, status: 404, message: "対象会員が見つかりません。" };
  if (!member.auth_user_id || normalizedEmail(member.email) === normalizedEmail(nextEmail)) {
    return { ok: true, value: { previousEmail: null } };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, status: 500, message: "認証アカウントの設定を確認できませんでした。" };
  const { data: userData, error: userError } = await admin.auth.admin.getUserById(member.auth_user_id);
  if (userError || !userData.user) return { ok: false, status: 500, message: "認証アカウントを確認できませんでした。" };

  const previousEmail = userData.user.email ?? null;
  const { error } = await admin.auth.admin.updateUserById(member.auth_user_id, {
    email: normalizedEmail(nextEmail),
    email_confirm: true,
  });
  if (error) {
    return { ok: false, status: 409, message: "このメールアドレスは、別の認証アカウントで使用されている可能性があります。" };
  }

  return { ok: true, value: { previousEmail } };
}

async function restoreManagedAccountEmail(memberId: string, lomId: string, previousEmail: string | null) {
  if (!previousEmail) return;
  const loaded = await loadManagedMember(memberId, lomId);
  if (!loaded.member?.auth_user_id) return;
  const admin = createAdminClient();
  if (!admin) return;
  await admin.auth.admin.updateUserById(loaded.member.auth_user_id, { email: previousEmail, email_confirm: true });
}

export const accountProvisioningService = {
  createMemberWithInitialAccount,
  createMemberWithoutAccount,
  issueInitialPassword,
  reissueInitialPassword,
  synchronizeManagedAccountEmail,
  restoreManagedAccountEmail,
};
