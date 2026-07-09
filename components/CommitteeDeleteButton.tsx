"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommitteeDeleteButton({ committeeId }: { committeeId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm("この委員会を削除しますか？削除後は一覧に表示されません。");

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/committees/${committeeId}`, {
        method: "DELETE"
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "委員会を削除できませんでした。");
        return;
      }

      router.push("/committees");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mt-3">
      {error ? (
        <p className="mb-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{error}</p>
      ) : null}
      <button
        className="flex min-h-12 w-full items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:text-slate-400"
        disabled={isDeleting}
        onClick={handleDelete}
        type="button"
      >
        {isDeleting ? "削除中..." : "委員会を削除"}
      </button>
    </div>
  );
}
