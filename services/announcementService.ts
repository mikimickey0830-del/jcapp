import {
  announcementImportanceLabels,
  announcementImportanceTones,
  announcements,
  announcementTypeLabels,
  announcementTypeTones,
  announcementVisibilityLabels,
  getAnnouncement,
  getAnnouncementAuthor,
  getLatestAnnouncements
} from "@/lib/announcements";

// TODO: Supabase接続時にここを差し替える。
export const announcementService = {
  getAnnouncements: () => announcements,
  getAnnouncementById: (id: string) => getAnnouncement(id),
  getLatestAnnouncements,
  getAnnouncementAuthor,
  announcementTypeLabels,
  announcementVisibilityLabels,
  announcementImportanceLabels,
  announcementTypeTones,
  announcementImportanceTones
};
