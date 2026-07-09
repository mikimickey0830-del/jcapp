import { notificationService } from "@/services/notificationService";

export function useNotifications() {
  return {
    notifications: notificationService.getNotifications(),
    unreadNotifications: notificationService.getUnreadNotifications(),
    notificationTypeLabels: notificationService.notificationTypeLabels,
    notificationStatusLabels: notificationService.notificationStatusLabels
  };
}

export function useLatestNotifications(limit = 3) {
  return {
    latestNotifications: notificationService.getLatestNotifications(limit),
    notificationTypeLabels: notificationService.notificationTypeLabels,
    notificationStatusLabels: notificationService.notificationStatusLabels
  };
}
