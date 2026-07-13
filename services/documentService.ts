import {
  documentToneByFileType,
  getDocumentUploader as getFallbackUploader,
  getNewDocuments as getFallbackNewDocuments,
  getRelatedEventTitle as getFallbackEventTitle,
  getSharedDocument as getFallbackDocument,
  sharedDocuments,
} from "@/lib/documents";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { SharedDocument } from "@/types/document";

const categoryLabels: Record<SharedDocument["category"], string> = {
  agenda: "議案",
  minutes: "議事録",
  bylaws: "定款",
  project: "事業資料",
  meeting: "例会資料",
  other: "その他",
};

const fileTypeLabels: Record<SharedDocument["fileType"], string> = {
  pdf: "PDF",
  word: "Word",
  excel: "Excel",
  powerpoint: "PowerPoint",
  image: "画像",
  other: "その他",
};

const visibilityLabels: Record<SharedDocument["visibility"], string> = {
  all: "全会員",
  board: "理事・監事",
  admins: "管理者",
};

export type DocumentQueryResult<T> = {
  data: T;
  error: string | null;
  source: "supabase" | "fallback";
};

type DocumentRow = {
  id: string;
  lom_id: string;
  fiscal_year_id: string;
  event_id: string | null;
  title: string;
  file_name: string;
  file_type: SharedDocument["fileType"];
  category: SharedDocument["category"];
  storage_path: string;
  visibility: SharedDocument["visibility"];
  uploaded_by: string | null;
  uploaded_at: string;
  fiscal_years: { year: number; name: string } | null;
  events: { id: string; title: string } | null;
  members: { id: string; last_name: string; first_name: string } | null;
};

const documentSelect = `
  id,
  lom_id,
  fiscal_year_id,
  event_id,
  title,
  file_name,
  file_type,
  category,
  storage_path,
  visibility,
  uploaded_by,
  uploaded_at,
  fiscal_years(year, name),
  events(id, title),
  members(id, last_name, first_name)
`;

function mapDocument(row: DocumentRow): SharedDocument {
  return {
    id: row.id,
    lomId: row.lom_id,
    title: row.title,
    fileName: row.file_name,
    fileType: row.file_type,
    category: row.category,
    fiscalYearId: row.fiscal_year_id,
    fiscalYear: row.fiscal_years?.year ?? 0,
    eventId: row.event_id ?? undefined,
    relatedEventTitle: row.events?.title,
    uploadedByMemberId: row.uploaded_by ?? "",
    uploaderName: row.members
      ? `${row.members.last_name} ${row.members.first_name}`
      : undefined,
    visibility: row.visibility,
    uploadedAt: row.uploaded_at,
    storagePath: row.storage_path,
  };
}

async function fetchDocuments(): Promise<DocumentQueryResult<SharedDocument[]>> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: sharedDocuments,
      error: "Supabase環境変数が未設定のため、資料は仮データを表示しています。",
      source: "fallback",
    };
  }

  // TODO: Supabase Auth接続時に、所属LOMと公開範囲で取得対象を制限する。
  const { data, error } = await supabase
    .from("documents")
    .select(documentSelect)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch documents from Supabase", error);
    return {
      data: sharedDocuments,
      error: `資料の取得に失敗したため、仮データを表示しています。${error.message}`,
      source: "fallback",
    };
  }

  return {
    data: ((data ?? []) as unknown as DocumentRow[]).map(mapDocument),
    error: null,
    source: "supabase",
  };
}

export const documentService = {
  getDocuments: fetchDocuments,

  async getDocumentById(
    documentId: string,
  ): Promise<DocumentQueryResult<SharedDocument | undefined>> {
    const result = await fetchDocuments();
    const document = result.data.find((item) => item.id === documentId);

    if (document) return { ...result, data: document };

    const fallback = getFallbackDocument(documentId);
    return {
      data: fallback,
      error: result.error,
      source: fallback ? "fallback" : result.source,
    };
  },

  async getLatestDocuments(
    limit = 3,
  ): Promise<DocumentQueryResult<SharedDocument[]>> {
    const result = await fetchDocuments();
    return { ...result, data: result.data.slice(0, limit) };
  },

  getNewDocuments: (limit = 3) => getFallbackNewDocuments(limit),
  getDocumentUploader: (document: SharedDocument) =>
    document.uploaderName ?? getFallbackUploader(document),
  getRelatedEventTitle: (document: SharedDocument) =>
    document.relatedEventTitle ?? getFallbackEventTitle(document),
  categoryLabels,
  fileTypeLabels,
  visibilityLabels,
  documentToneByFileType,
};
