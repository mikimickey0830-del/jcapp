import type { AppEnvironment, AppEnvironmentInfo } from "@/types/environment";

const environmentInfo: Record<AppEnvironment, AppEnvironmentInfo> = {
  development: {
    value: "development",
    label: "開発環境",
    description: "ローカル開発用です。管理者はテストデータを作成・削除できます。",
    allowsTestData: true
  },
  test: {
    value: "test",
    label: "テスト環境",
    description: "動作確認用です。本番データを扱わず、テストデータ操作は専用手順で管理します。",
    allowsTestData: false
  },
  production: {
    value: "production",
    label: "本番環境",
    description: "玉島青年会議所の実運用環境です。テストデータの作成・削除はできません。",
    allowsTestData: false
  }
};

function toAppEnvironment(value: string | undefined): AppEnvironment {
  if (value === "development" || value === "test" || value === "production") return value;

  // A safe default prevents an unset deployment setting from exposing test actions.
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function getAppEnvironment(): AppEnvironmentInfo {
  return environmentInfo[toAppEnvironment(process.env.NEXT_PUBLIC_APP_ENV)];
}

export function isDevelopmentEnvironment() {
  return getAppEnvironment().value === "development";
}
