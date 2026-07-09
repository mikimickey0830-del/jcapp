import { AppShell } from "@/components/AppShell";
import { MemberForm } from "@/components/MemberForm";
import { PageHeader } from "@/components/PageHeader";

export default function NewMemberPage() {
  return (
    <AppShell>
      <PageHeader
        backHref="/members"
        description="年度をまたいで利用する会員基本情報を登録します。役職や委員会は年度管理で設定します。"
        title="会員登録"
      />
      <MemberForm mode="create" />
    </AppShell>
  );
}
