import { members } from "@/lib/members";
import type {
  Announcement,
  AnnouncementImportance,
  AnnouncementType,
  AnnouncementVisibility
} from "@/types/announcement";
import type { StatusTone } from "@/types/common";

export const announcementTypeLabels: Record<AnnouncementType, string> = {
  general: "全体連絡",
  regular_meeting: "例会案内",
  board_meeting: "理事会案内",
  committee: "委員会連絡",
  deadline: "締切案内",
  document_added: "資料追加",
  other: "その他"
};

export const announcementVisibilityLabels: Record<AnnouncementVisibility, string> = {
  all: "全体公開",
  members: "会員のみ",
  board: "理事・役員",
  committee: "対象委員会",
  admins: "管理者のみ"
};

export const announcementImportanceLabels: Record<AnnouncementImportance, string> = {
  normal: "通常",
  important: "重要",
  urgent: "至急"
};

export const announcementTypeTones: Record<AnnouncementType, StatusTone> = {
  general: "blue",
  regular_meeting: "green",
  board_meeting: "amber",
  committee: "blue",
  deadline: "red",
  document_added: "green",
  other: "blue"
};

export const announcementImportanceTones: Record<AnnouncementImportance, StatusTone> = {
  normal: "blue",
  important: "amber",
  urgent: "red"
};

export const announcements: Announcement[] = [
  {
    id: "a001",
    title: "7月例会の出欠回答をお願いします",
    body:
      "7月例会の開催案内です。出欠回答期限は7月15日です。各委員会で参加予定者を確認し、期限内の回答をお願いします。",
    type: "regular_meeting",
    fiscalYear: 2026,
    targetLom: "玉島青年会議所",
    targetCommittee: "全委員会",
    visibility: "members",
    importance: "important",
    publishStartAt: "2026-07-01 09:00",
    publishEndAt: "2026-07-20 23:59",
    authorMemberId: "m001",
    createdAt: "2026-07-01 09:00",
    updatedAt: "2026-07-03 18:30",
    notificationType: "announcement"
  },
  {
    id: "a002",
    title: "理事会資料を追加しました",
    body:
      "第7回理事会の資料を資料共有に追加しました。議案書、前回議事録、参考資料を事前に確認してください。",
    type: "document_added",
    fiscalYear: 2026,
    targetLom: "玉島青年会議所",
    visibility: "board",
    importance: "normal",
    publishStartAt: "2026-07-05 12:00",
    authorMemberId: "m002",
    createdAt: "2026-07-05 12:00",
    updatedAt: "2026-07-05 12:00",
    notificationType: "announcement"
  },
  {
    id: "a003",
    title: "事業計画書の提出期限について",
    body:
      "各委員会の事業計画書は7月25日までに事務局へ提出してください。修正が必要な場合は委員長へ早めに共有してください。",
    type: "deadline",
    fiscalYear: 2026,
    targetLom: "玉島青年会議所",
    targetCommittee: "各委員会",
    visibility: "committee",
    importance: "urgent",
    publishStartAt: "2026-07-08 08:30",
    publishEndAt: "2026-07-25 23:59",
    authorMemberId: "m003",
    createdAt: "2026-07-08 08:30",
    updatedAt: "2026-07-08 08:30",
    notificationType: "announcement"
  }
];

export function getAnnouncement(id: string) {
  return announcements.find((announcement) => announcement.id === id);
}

export function getLatestAnnouncements(limit = 3) {
  return [...announcements].sort((a, b) => b.publishStartAt.localeCompare(a.publishStartAt)).slice(0, limit);
}

export function getAnnouncementAuthor(announcement: Announcement) {
  const member = members.find((item) => item.id === announcement.authorMemberId);
  return member ? `${member.lastName} ${member.firstName}` : "不明";
}
