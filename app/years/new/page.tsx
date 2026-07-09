import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { YearForm } from "@/components/YearForm";

export default function NewYearPage() {
  return (
    <AppShell>
      <PageHeader
        backHref="/years"
        description="前年度をコピーして、新年度の役職、委員会、年度所属、年度権限の土台を作成します。"
        title="新年度作成"
      />
      <YearForm />
    </AppShell>
  );
}
