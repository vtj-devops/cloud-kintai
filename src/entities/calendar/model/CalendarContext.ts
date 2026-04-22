import {
  CompanyHolidayCalendar,
  CreateCompanyHolidayCalendarInput,
  CreateEventCalendarInput,
  CreateHolidayCalendarInput,
  DeleteCompanyHolidayCalendarInput,
  DeleteEventCalendarInput,
  DeleteHolidayCalendarInput,
  EventCalendar,
  HolidayCalendar,
  UpdateCompanyHolidayCalendarInput,
  UpdateEventCalendarInput,
  UpdateHolidayCalendarInput,
} from "@shared/api/graphql/types";
import { createContext } from "react";

export type CalendarContextProps = {
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  eventCalendars: EventCalendar[];
  createHolidayCalendar: (
    input: CreateHolidayCalendarInput,
  ) => Promise<void | HolidayCalendar>;
  bulkCreateHolidayCalendar: (
    inputs: CreateHolidayCalendarInput[],
  ) => Promise<HolidayCalendar[]>;
  updateHolidayCalendar: (
    input: UpdateHolidayCalendarInput,
  ) => Promise<HolidayCalendar>;
  deleteHolidayCalendar: (input: DeleteHolidayCalendarInput) => Promise<void>;
  createCompanyHolidayCalendar: (
    input: CreateCompanyHolidayCalendarInput,
  ) => Promise<CompanyHolidayCalendar>;
  bulkCreateCompanyHolidayCalendar: (
    inputs: CreateCompanyHolidayCalendarInput[],
  ) => Promise<CompanyHolidayCalendar[]>;
  updateCompanyHolidayCalendar: (
    input: UpdateCompanyHolidayCalendarInput,
  ) => Promise<CompanyHolidayCalendar>;
  deleteCompanyHolidayCalendar: (
    input: DeleteCompanyHolidayCalendarInput,
  ) => Promise<CompanyHolidayCalendar>;
  createEventCalendar: (
    input: CreateEventCalendarInput,
  ) => Promise<void | EventCalendar>;
  bulkCreateEventCalendar: (
    inputs: CreateEventCalendarInput[],
  ) => Promise<EventCalendar[]>;
  updateEventCalendar: (
    input: UpdateEventCalendarInput,
  ) => Promise<EventCalendar>;
  deleteEventCalendar: (input: DeleteEventCalendarInput) => Promise<void>;
};

export const CalendarContext = createContext<CalendarContextProps>({
  holidayCalendars: [],
  companyHolidayCalendars: [],
  eventCalendars: [],
  createHolidayCalendar: async () => {
    return;
  },
  bulkCreateHolidayCalendar: async () => {
    return [];
  },
  updateHolidayCalendar: async () => {
    return {} as HolidayCalendar;
  },
  deleteHolidayCalendar: async () => {
    return;
  },
  createCompanyHolidayCalendar: async () => {
    return {} as CompanyHolidayCalendar;
  },
  bulkCreateCompanyHolidayCalendar: async () => {
    return [];
  },
  updateCompanyHolidayCalendar: async () => {
    return {} as CompanyHolidayCalendar;
  },
  deleteCompanyHolidayCalendar: async () => {
    return {} as CompanyHolidayCalendar;
  },
  createEventCalendar: async () => {
    return;
  },
  bulkCreateEventCalendar: async () => {
    return [];
  },
  updateEventCalendar: async () => {
    return {} as EventCalendar;
  },
  deleteEventCalendar: async () => {
    return;
  },
});

/**
 * @deprecated AppContext は CalendarContext にリネームされました。
 * 後方互換のための re-export です。
 */
export const AppContext = CalendarContext;
