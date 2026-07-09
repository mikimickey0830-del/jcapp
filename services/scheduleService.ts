import {
  eventTypeLabels,
  eventTypeTones,
  formatEventDate,
  getEventsForFiscalYear,
  getScheduleEvent,
  getUpcomingEvents,
  scheduleEvents
} from "@/lib/schedule";

// TODO: Supabase接続時にここを差し替える。
export const scheduleService = {
  getEvents: () => scheduleEvents,
  getEventById: (eventId: string) => getScheduleEvent(eventId),
  getEventsForFiscalYear,
  getUpcomingEvents,
  formatEventDate,
  eventTypeLabels,
  eventTypeTones
};
