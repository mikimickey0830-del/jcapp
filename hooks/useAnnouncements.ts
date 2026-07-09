import { announcementService } from "@/services/announcementService";

export function useAnnouncements() {
  return {
    announcements: announcementService.getAnnouncements(),
    announcementTypeLabels: announcementService.announcementTypeLabels,
    announcementVisibilityLabels: announcementService.announcementVisibilityLabels,
    announcementImportanceLabels: announcementService.announcementImportanceLabels,
    announcementTypeTones: announcementService.announcementTypeTones,
    announcementImportanceTones: announcementService.announcementImportanceTones,
    getAnnouncementAuthor: announcementService.getAnnouncementAuthor
  };
}

export function useAnnouncement(id: string) {
  return {
    announcement: announcementService.getAnnouncementById(id),
    announcementTypeLabels: announcementService.announcementTypeLabels,
    announcementVisibilityLabels: announcementService.announcementVisibilityLabels,
    announcementImportanceLabels: announcementService.announcementImportanceLabels,
    announcementTypeTones: announcementService.announcementTypeTones,
    announcementImportanceTones: announcementService.announcementImportanceTones,
    getAnnouncementAuthor: announcementService.getAnnouncementAuthor
  };
}

export function useLatestAnnouncements(limit = 3) {
  return {
    latestAnnouncements: announcementService.getLatestAnnouncements(limit),
    announcementTypeLabels: announcementService.announcementTypeLabels,
    announcementImportanceLabels: announcementService.announcementImportanceLabels,
    announcementImportanceTones: announcementService.announcementImportanceTones
  };
}
