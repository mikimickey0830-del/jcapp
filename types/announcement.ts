import type { NotificationType } from "@/types/notification";

export type AnnouncementType =
  | "general"
  | "regular_meeting"
  | "board_meeting"
  | "committee"
  | "deadline"
  | "document_added"
  | "other";

export type AnnouncementVisibility = "all" | "members" | "board" | "committee" | "admins";

export type AnnouncementImportance = "normal" | "important" | "urgent";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  fiscalYear: number;
  targetLom: string;
  targetCommittee?: string;
  visibility: AnnouncementVisibility;
  importance: AnnouncementImportance;
  publishStartAt: string;
  publishEndAt?: string;
  authorMemberId: string;
  createdAt: string;
  updatedAt: string;
  // 通知機能と連動するとき、この種別を通知作成時の type に渡す想定。
  notificationType: Extract<NotificationType, "announcement">;
};
