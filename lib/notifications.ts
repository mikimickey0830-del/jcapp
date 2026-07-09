import type { AppNotification, NotificationStatus, NotificationType } from "@/types/notification";

export const notificationTypeLabels: Record<NotificationType, string> = {
  attendance_deadline: "出欠期限",
  event_today: "イベント当日",
  document_added: "資料追加",
  announcement: "お知らせ",
  system: "システム"
};

export const notificationStatusLabels: Record<NotificationStatus, string> = {
  unread: "未読",
  read: "既読"
};

export const notifications: AppNotification[] = [
  {
    id: "n001",
    title: "7月例会の出欠期限を過ぎています",
    body: "未回答の方は出欠回答を確認してください。",
    type: "attendance_deadline",
    status: "unread",
    memberId: "m004",
    fiscalYear: 2026,
    relatedHref: "/attendance/e001/respond",
    createdAt: "2026-07-09 09:00"
  },
  {
    id: "n002",
    title: "新しい資料が追加されました",
    body: "7月例会資料が資料共有に追加されました。",
    type: "document_added",
    status: "unread",
    memberId: "m004",
    fiscalYear: 2026,
    relatedHref: "/documents/d001",
    createdAt: "2026-07-09 10:20"
  },
  {
    id: "n005",
    title: "新しいお知らせが公開されました",
    body: "7月例会の案内が公開されました。内容を確認してください。",
    type: "announcement",
    status: "unread",
    memberId: "m004",
    fiscalYear: 2026,
    relatedHref: "/announcements/a001",
    createdAt: "2026-07-09 11:00"
  },
  {
    id: "n003",
    title: "第8回理事会が近づいています",
    body: "開催日時と会場を確認してください。",
    type: "event_today",
    status: "read",
    memberId: "m003",
    fiscalYear: 2026,
    relatedHref: "/schedule/e002",
    createdAt: "2026-07-08 18:00"
  },
  {
    id: "n004",
    title: "年度管理の確認依頼",
    body: "2027年度の役職・委員会コピーの内容を確認してください。",
    type: "system",
    status: "read",
    memberId: "m001",
    fiscalYear: 2026,
    relatedHref: "/years/2027",
    createdAt: "2026-07-08 09:30"
  }
];
