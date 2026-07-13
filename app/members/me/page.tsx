import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { authService } from "@/services/authService";

export default async function MyMemberPage() {
  const authContext = await authService.getCurrentAuthContext();
  if (authContext.member) redirect(`/members/${authContext.member.id}`);

  return (
    <AppShell>
      <section className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
        <h1 className="font-bold">会員情報との紐付けが見つかりません。</h1>
        <p className="mt-2">管理者にAuthユーザーIDと会員情報の紐付けを依頼してください。</p>
        <Link className="mt-4 inline-flex min-h-10 items-center font-bold text-jc-blue" href="/">
          ホームへ戻る
        </Link>
      </section>
    </AppShell>
  );
}
