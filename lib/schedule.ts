import type { EventType, ScheduleEvent } from "@/types/schedule";

export const eventTypeLabels: Record<EventType, string> = {
  regular_meeting: "例会",
  board_meeting: "理事会",
  committee: "委員会",
  project: "事業",
  block: "ブロック",
  jci_japan: "日本JC",
  other: "その他"
};

export const eventTypeTones: Record<EventType, "blue" | "green" | "amber" | "red"> = {
  regular_meeting: "blue",
  board_meeting: "amber",
  committee: "green",
  project: "red",
  block: "blue",
  jci_japan: "amber",
  other: "green"
};

export const scheduleEvents: ScheduleEvent[] = [
  {
    id: "e001",
    fiscalYear: 2026,
    lomName: "玉島青年会議所",
    title: "7月例会",
    eventType: "regular_meeting",
    date: "2026-07-18",
    startTime: "19:00",
    endTime: "21:00",
    venue: "玉島市民交流センター",
    address: "岡山県倉敷市玉島阿賀崎1-10-1",
    targetAudience: "全会員",
    description: "地域課題をテーマにした7月例会です。出欠返信期限までに回答をお願いします。",
    requiresAttendance: true,
    attendanceDeadline: "2026-07-08"
  },
  {
    id: "e002",
    fiscalYear: 2026,
    lomName: "玉島青年会議所",
    title: "第8回 理事会",
    eventType: "board_meeting",
    date: "2026-07-24",
    startTime: "19:30",
    endTime: "21:30",
    venue: "事務局",
    address: "岡山県倉敷市玉島中央町",
    targetAudience: "理事・監事",
    description: "8月事業と年度管理に関する協議を行います。",
    requiresAttendance: true,
    attendanceDeadline: "2026-07-20"
  },
  {
    id: "e003",
    fiscalYear: 2026,
    lomName: "玉島青年会議所",
    title: "総務広報委員会",
    eventType: "committee",
    date: "2026-07-28",
    startTime: "20:00",
    endTime: "21:30",
    venue: "オンライン",
    address: "Zoom",
    targetAudience: "総務広報委員会",
    description: "広報計画と資料共有ルールの確認を行います。",
    requiresAttendance: true,
    attendanceDeadline: "2026-07-26"
  },
  {
    id: "e004",
    fiscalYear: 2026,
    lomName: "玉島青年会議所",
    title: "岡山ブロック協議会 事業説明会",
    eventType: "block",
    date: "2026-08-02",
    startTime: "13:00",
    endTime: "16:00",
    venue: "岡山国際交流センター",
    address: "岡山県岡山市北区奉還町2-2-1",
    targetAudience: "希望者・出向者",
    description: "ブロック事業の説明会です。対象者は予定を確認してください。",
    requiresAttendance: false
  },
  {
    id: "e005",
    fiscalYear: 2026,
    lomName: "玉島青年会議所",
    title: "地域事業 リハーサル",
    eventType: "project",
    date: "2026-08-09",
    startTime: "09:00",
    endTime: "12:00",
    venue: "玉島商店街",
    address: "岡山県倉敷市玉島中央町",
    targetAudience: "全会員・協力者",
    description: "地域事業当日に向けた動線確認と役割分担の最終確認です。",
    requiresAttendance: true,
    attendanceDeadline: "2026-08-05"
  }
];

export function getScheduleEvent(eventId: string) {
  return scheduleEvents.find((event) => event.id === eventId);
}

export function getEventsForFiscalYear(fiscalYear: number) {
  return scheduleEvents.filter((event) => event.fiscalYear === fiscalYear);
}

export function getUpcomingEvents(limit = 3) {
  return [...scheduleEvents]
    .filter((event) => event.fiscalYear === 2026)
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
    .slice(0, limit);
}

export function formatEventDate(event: ScheduleEvent) {
  const date = new Date(`${event.date}T00:00:00`);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const week = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];

  return `${month}/${day} ${week} ${event.startTime}`;
}
