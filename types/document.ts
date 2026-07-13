export type DocumentFileType = "pdf" | "word" | "excel" | "powerpoint" | "image" | "other";

export type DocumentCategory = "agenda" | "minutes" | "bylaws" | "project" | "meeting" | "other";

export type DocumentVisibility = "all" | "board" | "admins";

export type SharedDocument = {
  id: string;
  lomId?: string;
  title: string;
  fileName: string;
  fileType: DocumentFileType;
  category: DocumentCategory;
  fiscalYearId?: string;
  fiscalYear: number;
  eventId?: string;
  relatedEventTitle?: string;
  uploadedByMemberId: string;
  uploaderName?: string;
  visibility: DocumentVisibility;
  uploadedAt: string;
  storagePath: string;
};
