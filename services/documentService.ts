import {
  categoryLabels,
  documentToneByFileType,
  fileTypeLabels,
  getDocumentUploader,
  getNewDocuments,
  getRelatedEventTitle,
  getSharedDocument,
  sharedDocuments,
  visibilityLabels
} from "@/lib/documents";

// TODO: Supabase接続時にここを差し替える。
export const documentService = {
  getDocuments: () => sharedDocuments,
  getDocumentById: (documentId: string) => getSharedDocument(documentId),
  getNewDocuments,
  getDocumentUploader,
  getRelatedEventTitle,
  categoryLabels,
  fileTypeLabels,
  visibilityLabels,
  documentToneByFileType
};
