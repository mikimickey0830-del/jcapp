import { scheduleService } from "@/services/scheduleService";

export function useSchedule() {
  return {
    events: scheduleService.getEvents(),
    getEventsForFiscalYear: scheduleService.getEventsForFiscalYear,
    eventTypeLabels: scheduleService.eventTypeLabels,
    eventTypeTones: scheduleService.eventTypeTones,
    formatEventDate: scheduleService.formatEventDate
  };
}

export function useScheduleEvent(eventId: string) {
  return {
    event: scheduleService.getEventById(eventId),
    eventTypeLabels: scheduleService.eventTypeLabels,
    eventTypeTones: scheduleService.eventTypeTones,
    formatEventDate: scheduleService.formatEventDate
  };
}

export function useUpcomingEvents(limit = 3) {
  return {
    upcomingEvents: scheduleService.getUpcomingEvents(limit),
    eventTypeLabels: scheduleService.eventTypeLabels,
    eventTypeTones: scheduleService.eventTypeTones,
    formatEventDate: scheduleService.formatEventDate
  };
}
