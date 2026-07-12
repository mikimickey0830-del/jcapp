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
  lomId: string;
  fiscalYearId: string;
  fiscalYear: number;
  fiscalYearName: string;
  title: string;
  body: string;
  type: AnnouncementType;
  targetLom: string;
  targetCommitteeId?: string;
  targetCommittee?: string;
  visibility: AnnouncementVisibility;
  importance: AnnouncementImportance;
  publishStartAt: string;
  publishEndAt?: string;
  authorMemberId?: string;
  authorMemberName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  // Reserved for the future notification service integration.
  notificationType: Extract<NotificationType, "announcement">;
};

export type AnnouncementFormOptions = {
  fiscalYears: Array<{
    id: string;
    year: number;
    name: string;
    lomId: string;
    lomName: string;
  }>;
  loms: Array<{
    id: string;
    name: string;
  }>;
  committees: Array<{
    id: string;
    fiscalYearId: string;
    name: string;
  }>;
  members: Array<{
    id: string;
    name: string;
  }>;
};

export type AnnouncementMutationPayload = {
  fiscalYearId?: string;
  title?: string;
  body?: string;
  type?: AnnouncementType;
  targetLom?: string;
  targetCommitteeId?: string;
  visibility?: AnnouncementVisibility;
  importance?: AnnouncementImportance;
  publishStartAt?: string;
  publishEndAt?: string;
  authorMemberId?: string;
};
