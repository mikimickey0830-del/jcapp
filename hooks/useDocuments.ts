import { documentService } from "@/services/documentService";

export function useDocuments() {
  return {
    documents: documentService.getNewDocuments(100),
    categoryLabels: documentService.categoryLabels,
    fileTypeLabels: documentService.fileTypeLabels,
    visibilityLabels: documentService.visibilityLabels,
    documentToneByFileType: documentService.documentToneByFileType,
    getDocumentUploader: documentService.getDocumentUploader,
    getRelatedEventTitle: documentService.getRelatedEventTitle
  };
}

export function useDocument(documentId: string) {
  return {
    document: documentService.getNewDocuments(100).find((item) => item.id === documentId),
    categoryLabels: documentService.categoryLabels,
    fileTypeLabels: documentService.fileTypeLabels,
    visibilityLabels: documentService.visibilityLabels,
    documentToneByFileType: documentService.documentToneByFileType,
    getDocumentUploader: documentService.getDocumentUploader,
    getRelatedEventTitle: documentService.getRelatedEventTitle
  };
}

export function useNewDocuments(limit = 3) {
  return {
    newDocuments: documentService.getNewDocuments(limit),
    fileTypeLabels: documentService.fileTypeLabels,
    documentToneByFileType: documentService.documentToneByFileType
  };
}
