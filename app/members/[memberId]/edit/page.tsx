import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MemberForm } from "@/components/MemberForm";
import { PageHeader } from "@/components/PageHeader";
import { memberService } from "@/services/memberService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditMemberPage({ params }: { params: { memberId: string } }) {
  noStore();
  const { data: member } = await memberService.getMemberById(params.memberId);

  if (!member) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        backHref={`/members/${member.id}`}
        description="会員基本情報を編集します。年度ごとの役職、委員会、権限は年度管理で別管理します。"
        title="会員編集"
      />
      <MemberForm member={member} mode="edit" />
    </AppShell>
  );
}
