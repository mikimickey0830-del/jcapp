"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DevelopmentTestDataPanelProps = {
  initialHasTestData: boolean;
  initialError: string | null;
};

export function DevelopmentTestDataPanel({ initialHasTestData, initialError }: DevelopmentTestDataPanelProps) {
  const router = useRouter();
  const [hasTestData, setHasTestData] = useState(initialHasTestData);
  const [error, setError] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function runAction(method: "POST" | "DELETE") {
    if (method === "DELETE" && !window.confirm("開発用に作成した予定とお知らせを論理削除します。続けますか？")) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/development/test-data", { method });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "テストデータを処理できませんでした。");
        return;
      }
      setHasTestData(method === "POST");
      router.refresh();
    } catch {
      setError("通信に失敗しました。時間をおいてもう一度試してください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-amber-800">開発環境限定</p>
          <h2 className="mt-1 text-base font-bold text-jc-navy">テストデータ</h2>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-amber-800">{hasTestData ? "作成済み" : "未作成"}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        サンプル予定とサンプルお知らせを作成します。作成記録に紐付くデータだけを削除するため、通常の運用データは対象になりません。
      </p>
      {error ? <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">{error}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          className="min-h-12 rounded-md bg-jc-blue px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={hasTestData || isSubmitting}
          onClick={() => runAction("POST")}
          type="button"
        >
          {isSubmitting && !hasTestData ? "作成中..." : "テストデータを作成"}
        </button>
        <button
          className="min-h-12 rounded-md border border-amber-300 bg-white px-3 text-sm font-bold text-amber-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          disabled={!hasTestData || isSubmitting}
          onClick={() => runAction("DELETE")}
          type="button"
        >
          {isSubmitting && hasTestData ? "削除中..." : "テストデータを削除"}
        </button>
      </div>
    </section>
  );
}
