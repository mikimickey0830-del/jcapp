import { scheduleService } from "@/services/scheduleService";

export function useSchedule() {
  return {
    events: scheduleService.getFallbackEvents(),
    getEventsForFiscalYear: scheduleService.getFallbackEventsForFiscalYear,
    eventTypeLabels: scheduleService.eventTypeLabels,
    eventTypeTones: scheduleService.eventTypeTones,
    formatEventDate: scheduleService.formatEventDate
  };
}

export function useScheduleEvent(eventId: string) {
  return {
    event: scheduleService.getFallbackEventById(eventId),
    eventTypeLabels: scheduleService.eventTypeLabels,
    eventTypeTones: scheduleService.eventTypeTones,
    formatEventDate: scheduleService.formatEventDate
  };
}

export function useUpcomingEvents(limit = 3) {
  return {
    upcomingEvents: scheduleService.getFallbackUpcomingEvents(limit),
    eventTypeLabels: scheduleService.eventTypeLabels,
    eventTypeTones: scheduleService.eventTypeTones,
    formatEventDate: scheduleService.formatEventDate
  };
}
