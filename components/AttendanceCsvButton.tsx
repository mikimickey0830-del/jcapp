"use client";

import type { AttendanceRow } from "@/types/attendance";

type AttendanceCsvButtonProps = {
  eventTitle: string;
  rows: AttendanceRow[];
};

export function AttendanceCsvButton({ eventTitle, rows }: AttendanceCsvButtonProps) {
  function handleDownload() {
    const header = ["氏名", "フリガナ", "ステータス", "コメント", "回答日時", "委員会", "役職"];
    const body = rows.map((row) => [
      row.memberName,
      row.memberKana,
      row.status,
      row.comment,
      row.respondedAt ?? "",
      row.committees.map((committee) => committee.name).join(" / "),
      row.position?.name ?? ""
    ]);
    const csv = [header, ...body]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${eventTitle}-attendance.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      className="mt-5 min-h-12 w-full rounded-md bg-jc-navy px-4 text-sm font-bold text-white"
      onClick={handleDownload}
      type="button"
    >
      CSVダウンロード
    </button>
  );
}
