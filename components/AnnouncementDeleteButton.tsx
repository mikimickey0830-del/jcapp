"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AnnouncementDeleteButton({ announcementId }: { announcementId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm("このお知らせを削除しますか？削除後は一覧から非表示になります。")) return;

    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/announcements/${announcementId}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "お知らせを削除できませんでした。");
        return;
      }
      router.push("/announcements");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="mt-3">
      {error ? <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button
        className="flex min-h-12 w-full items-center justify-center rounded-md border border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 disabled:bg-slate-100 disabled:text-slate-400"
        disabled={isDeleting}
        onClick={handleDelete}
        type="button"
      >
        {isDeleting ? "削除中..." : "お知らせを削除"}
      </button>
    </section>
  );
}
