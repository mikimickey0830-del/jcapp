import { notificationService } from "@/services/notificationService";

export function useNotifications(memberId?: string) {
  return {
    query: notificationService.getNotifications(memberId),
    notificationTypeLabels: notificationService.notificationTypeLabels,
    notificationStatusLabels: notificationService.notificationStatusLabels
  };
}

export function useLatestNotifications(limit = 3) {
  return {
    query: notificationService.getNotifications(),
    limit,
    notificationTypeLabels: notificationService.notificationTypeLabels,
    notificationStatusLabels: notificationService.notificationStatusLabels
  };
}
