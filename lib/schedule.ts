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
    id: "60000000-0000-0000-0000-000000000001",
    fiscalYearId: "10000000-0000-0000-0000-000000002026",
    fiscalYear: 2026,
    lomId: "00000000-0000-0000-0000-000000000001",
    lomName: "玉島青年会議所",
    title: "7月例会",
    eventType: "regular_meeting",
    date: "2026-07-18",
    startTime: "19:00",
    endTime: "21:00",
    venue: "玉島市民交流センター",
    address: "岡山県倉敷市玉島阿賀崎1-10-1",
    googleMapUrl: "https://www.google.com/maps/search/?api=1&query=岡山県倉敷市玉島阿賀崎1-10-1",
    targetAudience: "全会員",
    description: "地域課題をテーマにした7月例会です。",
    requiresAttendance: true,
    attendanceDeadline: "2026-07-08",
    reminderAt: "2026-07-07T09:00:00+09:00",
    googleCalendarEventId: "",
    targetCommitteeIds: [],
    targetPositionIds: [],
    targetMemberIds: [],
    targetCommittees: [],
    targetPositions: [],
    targetMembers: [],
    operatingCommitteeId: "30000000-0000-0000-0000-000000000001",
    operatingCommitteeName: "総務広報委員会",
    contactMemberId: "20000000-0000-0000-0000-000000000001",
    contactMemberName: "山田 太郎",
    bringItems: "筆記用具",
    dressCode: "ビジネス",
    notes: "",
    deletedAt: null
  },
  {
    id: "60000000-0000-0000-0000-000000000002",
    fiscalYearId: "10000000-0000-0000-0000-000000002026",
    fiscalYear: 2026,
    lomId: "00000000-0000-0000-0000-000000000001",
    lomName: "玉島青年会議所",
    title: "第8回理事会",
    eventType: "board_meeting",
    date: "2026-07-24",
    startTime: "19:30",
    endTime: "21:30",
    venue: "事務局",
    address: "岡山県倉敷市玉島中央町",
    googleMapUrl: "",
    targetAudience: "理事・監事",
    description: "8月事業と年度管理に関する協議を行います。",
    requiresAttendance: true,
    attendanceDeadline: "2026-07-20",
    reminderAt: "2026-07-19T09:00:00+09:00",
    googleCalendarEventId: "",
    targetCommitteeIds: [],
    targetPositionIds: ["40000000-0000-0000-0000-000000000001"],
    targetMemberIds: [],
    targetCommittees: [],
    targetPositions: [{ id: "40000000-0000-0000-0000-000000000001", name: "理事長" }],
    targetMembers: [],
    operatingCommitteeId: "",
    operatingCommitteeName: "未設定",
    contactMemberId: "20000000-0000-0000-0000-000000000003",
    contactMemberName: "佐藤 花子",
    bringItems: "議案書、PC",
    dressCode: "スーツ",
    notes: "議案説明者は開始10分前に集合してください。",
    deletedAt: null
  }
];

export function getScheduleEvent(eventId: string) {
  return scheduleEvents.find((event) => event.id === eventId || event.id === legacyEventId(eventId));
}

export function getEventsForFiscalYear(fiscalYear: number) {
  return scheduleEvents.filter((event) => event.fiscalYear === fiscalYear);
}

export function getUpcomingEvents(limit = 3) {
  return [...scheduleEvents]
    .filter((event) => !event.deletedAt)
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
    .slice(0, limit);
}

export function getTodayEvents(now = new Date()) {
  const today = toLocalDateKey(now);
  return scheduleEvents.filter((event) => event.date === today && !event.deletedAt);
}

export function getThisWeekEvents(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return scheduleEvents.filter((event) => {
    const eventDate = new Date(`${event.date}T00:00:00`);
    return !event.deletedAt && eventDate >= start && eventDate < end;
  });
}

export function formatEventDate(event: ScheduleEvent) {
  const date = new Date(`${event.date}T00:00:00`);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const week = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];

  return `${month}/${day}(${week}) ${event.startTime}`;
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function legacyEventId(eventId: string) {
  const legacyMap: Record<string, string> = {
    e001: "60000000-0000-0000-0000-000000000001",
    e002: "60000000-0000-0000-0000-000000000002",
    e003: "60000000-0000-0000-0000-000000000003"
  };

  return legacyMap[eventId] ?? eventId;
}
