import { AppShell } from "@/components/AppShell";
import { MemberForm } from "@/components/MemberForm";
import { PageHeader } from "@/components/PageHeader";

export default function NewMemberPage() {
  return (
    <AppShell>
      <PageHeader
        backHref="/members"
        description="まずは年度をまたいで使う会員基本情報だけを登録します。"
        title="会員登録"
      />
      <MemberForm mode="create" />
    </AppShell>
  );
}
