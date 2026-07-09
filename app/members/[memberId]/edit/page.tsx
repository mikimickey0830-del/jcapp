import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MemberForm } from "@/components/MemberForm";
import { PageHeader } from "@/components/PageHeader";
import { useMember } from "@/hooks/useMembers";

export default function EditMemberPage({ params }: { params: { memberId: string } }) {
  const { member } = useMember(params.memberId);

  if (!member) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        backHref={`/members/${member.id}`}
        description="会員基本情報を編集します。年度別の役職、委員会、権限は別管理です。"
        title="会員編集"
      />
      <MemberForm member={member} mode="edit" />
    </AppShell>
  );
}
