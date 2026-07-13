import { notifications as fallbackNotifications } from "@/lib/notifications";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppNotification, NotificationStatus, NotificationType } from "@/types/notification";

type NotificationRow = {
  id: string;
  member_id: string;
  title: string;
  body: string;
  notification_type: NotificationType;
  related_href: string | null;
  read_at: string | null;
  created_at: string;
  fiscal_years: { year: number } | null;
};

export type NotificationQueryResult = {
  data: AppNotification[];
  error: string | null;
  source: "supabase" | "fallback";
};

const notificationTypeLabels: Record<NotificationType, string> = {
  attendance_deadline: "出欠期限",
  event_today: "イベント当日",
  document_added: "資料追加",
  announcement: "お知らせ",
  system: "システム",
};

const notificationStatusLabels: Record<NotificationStatus, string> = {
  unread: "未読",
  read: "既読",
};

function mapNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.notification_type,
    status: row.read_at ? "read" : "unread",
    memberId: row.member_id,
    fiscalYear: row.fiscal_years?.year ?? 0,
    relatedHref: row.related_href ?? undefined,
    createdAt: row.created_at,
  };
}

async function getNotifications(
  memberId?: string,
  authenticatedClient?: SupabaseClient | null,
): Promise<NotificationQueryResult> {
  if (!memberId) return { data: [], error: null, source: "supabase" };
  const fallback = fallbackNotifications.filter((item) => item.memberId === memberId);
  const database = authenticatedClient ?? supabase;
  if (!isSupabaseConfigured || !database) {
    return {
      data: fallback,
      error: "Supabase環境変数が未設定のため、通知は仮データを表示しています。",
      source: "fallback",
    };
  }

  // RLSでも member_id がログイン会員本人かを検証する。
  const { data, error } = await database
    .from("notifications")
    .select("id, member_id, title, body, notification_type, related_href, read_at, created_at, fiscal_years(year)")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: fallback,
      error: `通知を取得できませんでした。${error.message}`,
      source: "fallback",
    };
  }

  return {
    data: ((data ?? []) as unknown as NotificationRow[]).map(mapNotification),
    error: null,
    source: "supabase",
  };
}

export const notificationService = {
  getNotifications,
  notificationTypeLabels,
  notificationStatusLabels,
};
