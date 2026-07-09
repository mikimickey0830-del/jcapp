import { documentService } from "@/services/documentService";

export function useDocuments() {
  return {
    documents: documentService.getDocuments(),
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
    document: documentService.getDocumentById(documentId),
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
