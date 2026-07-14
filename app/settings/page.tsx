import { AppShell } from "@/components/AppShell";
import { DevelopmentTestDataPanel } from "@/components/DevelopmentTestDataPanel";
import { PageHeader } from "@/components/PageHeader";
import { getAppEnvironment } from "@/lib/environment";
import { developmentTestDataService } from "@/services/developmentTestDataService";
import { authService } from "@/services/authService";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const environment = getAppEnvironment();
  const authContext = await authService.getCurrentAuthContext();
  const testDataStatus = environment.allowsTestData && authContext.member && authContext.canManage
    ? await developmentTestDataService.getStatus(authContext.member)
    : null;

  return (
    <AppShell>
      <PageHeader backHref="/" description="現在利用している環境と、利用可能な管理操作を確認します。" title="設定" />

      <section className="rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <p className="text-xs font-bold text-slate-500">現在の環境</p>
        <h2 className="mt-1 text-xl font-bold text-jc-navy">{environment.label}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">{environment.description}</p>
        <dl className="mt-4 divide-y divide-jc-line rounded-md border border-jc-line bg-slate-50 px-3">
          <div className="flex items-center justify-between gap-3 py-3 text-sm">
            <dt className="font-semibold text-slate-600">環境識別子</dt>
            <dd className="font-mono text-xs font-bold text-jc-navy">{environment.value}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-3 text-sm">
            <dt className="font-semibold text-slate-600">テストデータ操作</dt>
            <dd className="font-bold text-jc-navy">{environment.allowsTestData ? "開発環境のみ許可" : "利用不可"}</dd>
          </div>
        </dl>
      </section>

      {environment.allowsTestData && authContext.canManage && authContext.member ? (
        <div className="mt-5">
          <DevelopmentTestDataPanel initialError={testDataStatus?.error ?? null} initialHasTestData={testDataStatus?.data.hasActiveData ?? false} />
        </div>
      ) : null}

      {environment.allowsTestData && !authContext.canManage ? (
        <section className="mt-5 rounded-md border border-slate-200 bg-slate-100 p-4 text-sm leading-6 text-slate-600">
          テストデータ操作は、現在年度で有効な管理者だけが利用できます。
        </section>
      ) : null}

      <section className="mt-5 rounded-md border border-jc-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-jc-navy">運用上の注意</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          <li>本番環境ではテストデータの作成・削除ボタンは表示されず、APIも拒否されます。</li>
          <li>環境の切替はデプロイ先の環境変数で行います。画面から切り替えることはできません。</li>
          <li>SupabaseのURL、鍵、認証情報はこの画面に表示されません。</li>
        </ul>
      </section>
    </AppShell>
  );
}
