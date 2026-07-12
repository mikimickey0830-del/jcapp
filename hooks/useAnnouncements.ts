import { announcementService } from "@/services/announcementService";

// Server pages should await these data helpers before rendering.
export function useAnnouncements() {
  return announcementService.getAnnouncements();
}

export function useAnnouncement(id: string) {
  return announcementService.getAnnouncementById(id);
}

export function useLatestAnnouncements(limit = 3) {
  return announcementService.getLatestAnnouncements(limit);
}
