import { members } from "@/lib/members";
import { getScheduleEvent } from "@/lib/schedule";
import type { DocumentCategory, DocumentFileType, DocumentVisibility, SharedDocument } from "@/types/document";

export const fileTypeLabels: Record<DocumentFileType, string> = {
  pdf: "PDF",
  word: "Word",
  excel: "Excel",
  powerpoint: "PowerPoint",
  image: "画像",
  other: "その他"
};

export const categoryLabels: Record<DocumentCategory, string> = {
  agenda: "議案",
  minutes: "議事録",
  bylaws: "定款",
  project: "事業資料",
  meeting: "例会資料",
  other: "その他"
};

export const visibilityLabels: Record<DocumentVisibility, string> = {
  all: "全会員",
  board: "理事・監事",
  admins: "管理者"
};

export const documentToneByFileType: Record<DocumentFileType, "blue" | "green" | "amber" | "red"> = {
  pdf: "red",
  word: "blue",
  excel: "green",
  powerpoint: "amber",
  image: "green",
  other: "blue"
};

export const sharedDocuments: SharedDocument[] = [
  {
    id: "d001",
    title: "7月例会 次第",
    fileName: "2026-07-regular-meeting-agenda.pdf",
    fileType: "pdf",
    category: "meeting",
    fiscalYear: 2026,
    eventId: "e001",
    uploadedByMemberId: "m001",
    visibility: "all",
    uploadedAt: "2026-07-09 10:15",
    storagePath: "documents/tamashima/2026/e001/2026-07-regular-meeting-agenda.pdf"
  },
  {
    id: "d002",
    title: "第8回 理事会資料 一式",
    fileName: "board-meeting-08.zip",
    fileType: "other",
    category: "agenda",
    fiscalYear: 2026,
    eventId: "e002",
    uploadedByMemberId: "m003",
    visibility: "board",
    uploadedAt: "2026-07-08 18:30",
    storagePath: "documents/tamashima/2026/e002/board-meeting-08.zip"
  },
  {
    id: "d003",
    title: "委員会年間計画",
    fileName: "committee-annual-plan.xlsx",
    fileType: "excel",
    category: "project",
    fiscalYear: 2026,
    uploadedByMemberId: "m002",
    visibility: "all",
    uploadedAt: "2026-07-07 09:00",
    storagePath: "documents/tamashima/2026/general/committee-annual-plan.xlsx"
  },
  {
    id: "d004",
    title: "定款・諸規程",
    fileName: "bylaws-2026.docx",
    fileType: "word",
    category: "bylaws",
    fiscalYear: 2026,
    uploadedByMemberId: "m003",
    visibility: "admins",
    uploadedAt: "2026-06-30 16:45",
    storagePath: "documents/tamashima/2026/general/bylaws-2026.docx"
  },
  {
    id: "d005",
    title: "地域事業 広報画像",
    fileName: "project-kv.png",
    fileType: "image",
    category: "project",
    fiscalYear: 2026,
    eventId: "e005",
    uploadedByMemberId: "m004",
    visibility: "all",
    uploadedAt: "2026-07-06 13:20",
    storagePath: "documents/tamashima/2026/e005/project-kv.png"
  }
];

export function getSharedDocument(documentId: string) {
  return sharedDocuments.find((document) => document.id === documentId);
}

export function getNewDocuments(limit = 3) {
  return [...sharedDocuments]
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, limit);
}

export function getDocumentUploader(document: SharedDocument) {
  const member = members.find((item) => item.id === document.uploadedByMemberId);

  return member ? `${member.lastName} ${member.firstName}` : "不明";
}

export function getRelatedEventTitle(document: SharedDocument) {
  if (!document.eventId) {
    return "年度共通";
  }

  return getScheduleEvent(document.eventId)?.title ?? "関連イベントなし";
}
