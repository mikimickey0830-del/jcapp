import { notificationStatusLabels, notificationTypeLabels, notifications } from "@/lib/notifications";

// TODO: Supabase接続時にここを差し替える。
export const notificationService = {
  getNotifications: () => notifications,
  getLatestNotifications: (limit = 3) =>
    [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit),
  getUnreadNotifications: () => notifications.filter((notification) => notification.status === "unread"),
  notificationTypeLabels,
  notificationStatusLabels
};
