export type DocumentFileType = "pdf" | "word" | "excel" | "powerpoint" | "image" | "other";

export type DocumentCategory = "agenda" | "minutes" | "bylaws" | "project" | "meeting" | "other";

export type DocumentVisibility = "all" | "board" | "admins";

export type SharedDocument = {
  id: string;
  title: string;
  fileName: string;
  fileType: DocumentFileType;
  category: DocumentCategory;
  fiscalYear: number;
  eventId?: string;
  uploadedByMemberId: string;
  visibility: DocumentVisibility;
  uploadedAt: string;
  storagePath: string;
};
