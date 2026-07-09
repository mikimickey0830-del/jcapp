export type NotificationType = "attendance_deadline" | "event_today" | "document_added" | "announcement" | "system";

export type NotificationStatus = "unread" | "read";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  status: NotificationStatus;
  memberId: string;
  fiscalYear: number;
  relatedHref?: string;
  createdAt: string;
};
