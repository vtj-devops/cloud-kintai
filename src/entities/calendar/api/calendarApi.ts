import { createApi } from "@reduxjs/toolkit/query/react";
import {
  createCompanyHolidayCalendar,
  createEventCalendar,
  createHolidayCalendar,
  deleteCompanyHolidayCalendar,
  deleteEventCalendar,
  deleteHolidayCalendar,
  updateCompanyHolidayCalendar,
  updateEventCalendar,
  updateHolidayCalendar,
} from "@shared/api/graphql/documents/mutations";
import {
  listCompanyHolidayCalendars,
  listEventCalendars,
  listHolidayCalendars,
} from "@shared/api/graphql/documents/queries";
import { graphqlBaseQuery } from "@shared/api/graphql/graphqlBaseQuery";
import { executePaginatedQuery } from "@shared/api/graphql/paginatedQuery";
import type {
  CompanyHolidayCalendar,
  CreateCompanyHolidayCalendarInput,
  CreateCompanyHolidayCalendarMutation,
  CreateEventCalendarInput,
  CreateEventCalendarMutation,
  CreateHolidayCalendarInput,
  CreateHolidayCalendarMutation,
  DeleteCompanyHolidayCalendarInput,
  DeleteCompanyHolidayCalendarMutation,
  DeleteEventCalendarInput,
  DeleteEventCalendarMutation,
  DeleteHolidayCalendarInput,
  DeleteHolidayCalendarMutation,
  EventCalendar,
  HolidayCalendar,
  ListCompanyHolidayCalendarsQuery,
  ListEventCalendarsQuery,
  ListHolidayCalendarsQuery,
  ModelCompanyHolidayCalendarConditionInput,
  ModelEventCalendarConditionInput,
  ModelHolidayCalendarConditionInput,
  UpdateCompanyHolidayCalendarInput,
  UpdateCompanyHolidayCalendarMutation,
  UpdateEventCalendarInput,
  UpdateEventCalendarMutation,
  UpdateHolidayCalendarInput,
  UpdateHolidayCalendarMutation,
} from "@shared/api/graphql/types";

export type UpdateHolidayCalendarPayload = {
  input: UpdateHolidayCalendarInput;
  condition?: ModelHolidayCalendarConditionInput | null;
};

export type UpdateCompanyHolidayCalendarPayload = {
  input: UpdateCompanyHolidayCalendarInput;
  condition?: ModelCompanyHolidayCalendarConditionInput | null;
};

export type UpdateEventCalendarPayload = {
  input: UpdateEventCalendarInput;
  condition?: ModelEventCalendarConditionInput | null;
};

type CalendarTag = {
  type: "HolidayCalendar" | "CompanyHolidayCalendar" | "EventCalendar";
  id: string;
};

// Exported for testing
export const nonNullable = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

// Exported for testing
export const buildCalendarTagId = (calendar: {
  id?: string | null;
  holidayDate?: string | null;
}) => calendar.id ?? calendar.holidayDate ?? "unknown";

export const calendarApi = createApi({
  reducerPath: "calendarApi",
  baseQuery: graphqlBaseQuery(),
  tagTypes: ["HolidayCalendar", "CompanyHolidayCalendar", "EventCalendar"],
  endpoints: (builder) => ({
    getHolidayCalendars: builder.query<HolidayCalendar[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
        return executePaginatedQuery<HolidayCalendar>({
          baseQuery,
          document: listHolidayCalendars,
          connectionExtractor: (data) =>
            (data as ListHolidayCalendarsQuery | null)?.listHolidayCalendars,
          errorMessage: "Failed to fetch holiday calendars",
        });
      },
      providesTags: (result) => {
        const listTag: CalendarTag = { type: "HolidayCalendar", id: "LIST" };
        if (!result) {
          return [listTag];
        }

        return [
          listTag,
          ...result.map((calendar) => ({
            type: "HolidayCalendar" as const,
            id: buildCalendarTagId(calendar),
          })),
        ];
      },
    }),
    getCompanyHolidayCalendars: builder.query<CompanyHolidayCalendar[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
        return executePaginatedQuery<CompanyHolidayCalendar>({
          baseQuery,
          document: listCompanyHolidayCalendars,
          connectionExtractor: (data) =>
            (data as ListCompanyHolidayCalendarsQuery | null)?.listCompanyHolidayCalendars,
          errorMessage: "Failed to fetch company holiday calendars",
        });
      },
      providesTags: (result) => {
        const listTag: CalendarTag = {
          type: "CompanyHolidayCalendar",
          id: "LIST",
        };
        if (!result) {
          return [listTag];
        }

        return [
          listTag,
          ...result.map((calendar) => ({
            type: "CompanyHolidayCalendar" as const,
            id: buildCalendarTagId(calendar),
          })),
        ];
      },
    }),
    createHolidayCalendar: builder.mutation<
      HolidayCalendar,
      CreateHolidayCalendarInput
    >({
      async queryFn(input, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: createHolidayCalendar,
          variables: { input },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as CreateHolidayCalendarMutation | null;
        const created = data?.createHolidayCalendar;

        if (!created) {
          return { error: { message: "Failed to create holiday calendar" } };
        }

        return { data: created };
      },
      invalidatesTags: (result) => {
        const listTag: CalendarTag = { type: "HolidayCalendar", id: "LIST" };
        if (!result) {
          return [listTag];
        }

        return [
          listTag,
          {
            type: "HolidayCalendar" as const,
            id: buildCalendarTagId(result),
          },
        ];
      },
    }),
    bulkCreateHolidayCalendars: builder.mutation<
      HolidayCalendar[],
      CreateHolidayCalendarInput[]
    >({
      async queryFn(inputs, _queryApi, _extraOptions, baseQuery) {
        const created: HolidayCalendar[] = [];

        for (const input of inputs) {
          const result = await baseQuery({
            document: createHolidayCalendar,
            variables: { input },
          });

          if (result.error) {
            return { error: result.error };
          }

          const data = result.data as CreateHolidayCalendarMutation | null;
          const calendar = data?.createHolidayCalendar;

          if (!calendar) {
            return { error: { message: "Failed to create holiday calendar" } };
          }

          created.push(calendar);
        }

        return { data: created };
      },
      invalidatesTags: [{ type: "HolidayCalendar", id: "LIST" }],
    }),
    updateHolidayCalendar: builder.mutation<
      HolidayCalendar,
      UpdateHolidayCalendarPayload
    >({
      async queryFn({ input, condition }, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: updateHolidayCalendar,
          variables: {
            input,
            condition: condition ?? undefined,
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as UpdateHolidayCalendarMutation | null;
        const updated = data?.updateHolidayCalendar;

        if (!updated) {
          return { error: { message: "Failed to update holiday calendar" } };
        }

        return { data: updated };
      },
      invalidatesTags: (result) => {
        const listTag: CalendarTag = { type: "HolidayCalendar", id: "LIST" };
        if (!result) {
          return [listTag];
        }

        return [
          listTag,
          {
            type: "HolidayCalendar" as const,
            id: buildCalendarTagId(result),
          },
        ];
      },
    }),
    deleteHolidayCalendar: builder.mutation<
      HolidayCalendar,
      DeleteHolidayCalendarInput
    >({
      async queryFn(input, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: deleteHolidayCalendar,
          variables: { input },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as DeleteHolidayCalendarMutation | null;
        const deleted = data?.deleteHolidayCalendar;

        if (!deleted) {
          return { error: { message: "Failed to delete holiday calendar" } };
        }

        return { data: deleted };
      },
      invalidatesTags: (result, _error, arg) => {
        const listTag: CalendarTag = { type: "HolidayCalendar", id: "LIST" };
        const targetId = arg.id ?? buildCalendarTagId(result ?? {});
        return [listTag, { type: "HolidayCalendar", id: targetId }];
      },
    }),
    createCompanyHolidayCalendar: builder.mutation<
      CompanyHolidayCalendar,
      CreateCompanyHolidayCalendarInput
    >({
      async queryFn(input, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: createCompanyHolidayCalendar,
          variables: { input },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as CreateCompanyHolidayCalendarMutation | null;
        const created = data?.createCompanyHolidayCalendar;

        if (!created) {
          return {
            error: { message: "Failed to create company holiday calendar" },
          };
        }

        return { data: created };
      },
      invalidatesTags: (result) => {
        const listTag: CalendarTag = {
          type: "CompanyHolidayCalendar",
          id: "LIST",
        };
        if (!result) {
          return [listTag];
        }

        return [
          listTag,
          {
            type: "CompanyHolidayCalendar" as const,
            id: buildCalendarTagId(result),
          },
        ];
      },
    }),
    bulkCreateCompanyHolidayCalendars: builder.mutation<
      CompanyHolidayCalendar[],
      CreateCompanyHolidayCalendarInput[]
    >({
      async queryFn(inputs, _queryApi, _extraOptions, baseQuery) {
        const created: CompanyHolidayCalendar[] = [];

        for (const input of inputs) {
          const result = await baseQuery({
            document: createCompanyHolidayCalendar,
            variables: { input },
          });

          if (result.error) {
            return { error: result.error };
          }

          const data =
            result.data as CreateCompanyHolidayCalendarMutation | null;
          const calendar = data?.createCompanyHolidayCalendar;

          if (!calendar) {
            return {
              error: { message: "Failed to create company holiday calendar" },
            };
          }

          created.push(calendar);
        }

        return { data: created };
      },
      invalidatesTags: [{ type: "CompanyHolidayCalendar", id: "LIST" }],
    }),
    updateCompanyHolidayCalendar: builder.mutation<
      CompanyHolidayCalendar,
      UpdateCompanyHolidayCalendarPayload
    >({
      async queryFn({ input, condition }, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: updateCompanyHolidayCalendar,
          variables: {
            input,
            condition: condition ?? undefined,
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as UpdateCompanyHolidayCalendarMutation | null;
        const updated = data?.updateCompanyHolidayCalendar;

        if (!updated) {
          return {
            error: { message: "Failed to update company holiday calendar" },
          };
        }

        return { data: updated };
      },
      invalidatesTags: (result) => {
        const listTag: CalendarTag = {
          type: "CompanyHolidayCalendar",
          id: "LIST",
        };
        if (!result) {
          return [listTag];
        }

        return [
          listTag,
          {
            type: "CompanyHolidayCalendar" as const,
            id: buildCalendarTagId(result),
          },
        ];
      },
    }),
    deleteCompanyHolidayCalendar: builder.mutation<
      CompanyHolidayCalendar,
      DeleteCompanyHolidayCalendarInput
    >({
      async queryFn(input, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: deleteCompanyHolidayCalendar,
          variables: { input },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as DeleteCompanyHolidayCalendarMutation | null;
        const deleted = data?.deleteCompanyHolidayCalendar;

        if (!deleted) {
          return {
            error: { message: "Failed to delete company holiday calendar" },
          };
        }

        return { data: deleted };
      },
      invalidatesTags: (result, _error, arg) => {
        const listTag: CalendarTag = {
          type: "CompanyHolidayCalendar",
          id: "LIST",
        };
        const targetId = arg.id ?? buildCalendarTagId(result ?? {});
        return [listTag, { type: "CompanyHolidayCalendar", id: targetId }];
      },
    }),
    getEventCalendars: builder.query<EventCalendar[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
        return executePaginatedQuery<EventCalendar>({
          baseQuery,
          document: listEventCalendars,
          connectionExtractor: (data) =>
            (data as ListEventCalendarsQuery | null)?.listEventCalendars,
          errorMessage: "Failed to fetch event calendars",
        });
      },
      providesTags: (result) => {
        const listTag: CalendarTag = {
          type: "EventCalendar",
          id: "LIST",
        };
        if (!result) {
          return [listTag];
        }

        return [
          listTag,
          ...result.map((calendar) => ({
            type: "EventCalendar" as const,
            id: buildCalendarTagId(calendar),
          })),
        ];
      },
    }),
    createEventCalendar: builder.mutation<
      EventCalendar,
      CreateEventCalendarInput
    >({
      async queryFn(input, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: createEventCalendar,
          variables: { input },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as CreateEventCalendarMutation | null;
        const created = data?.createEventCalendar;

        if (!created) {
          return { error: { message: "Failed to create event calendar" } };
        }

        return { data: created };
      },
      invalidatesTags: (result) => {
        const listTag: CalendarTag = { type: "EventCalendar", id: "LIST" };
        if (!result) {
          return [listTag];
        }

        return [
          listTag,
          {
            type: "EventCalendar" as const,
            id: buildCalendarTagId(result),
          },
        ];
      },
    }),
    bulkCreateEventCalendars: builder.mutation<
      EventCalendar[],
      CreateEventCalendarInput[]
    >({
      async queryFn(inputs, _queryApi, _extraOptions, baseQuery) {
        const created: EventCalendar[] = [];

        for (const input of inputs) {
          const result = await baseQuery({
            document: createEventCalendar,
            variables: { input },
          });

          if (result.error) {
            return { error: result.error };
          }

          const data = result.data as CreateEventCalendarMutation | null;
          const calendar = data?.createEventCalendar;

          if (!calendar) {
            return { error: { message: "Failed to create event calendar" } };
          }

          created.push(calendar);
        }

        return { data: created };
      },
      invalidatesTags: [{ type: "EventCalendar", id: "LIST" }],
    }),
    updateEventCalendar: builder.mutation<
      EventCalendar,
      UpdateEventCalendarPayload
    >({
      async queryFn({ input, condition }, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: updateEventCalendar,
          variables: {
            input,
            condition: condition ?? undefined,
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as UpdateEventCalendarMutation | null;
        const updated = data?.updateEventCalendar;

        if (!updated) {
          return { error: { message: "Failed to update event calendar" } };
        }

        return { data: updated };
      },
      invalidatesTags: (result) => {
        const listTag: CalendarTag = { type: "EventCalendar", id: "LIST" };
        if (!result) {
          return [listTag];
        }

        return [
          listTag,
          {
            type: "EventCalendar" as const,
            id: buildCalendarTagId(result),
          },
        ];
      },
    }),
    deleteEventCalendar: builder.mutation<
      EventCalendar,
      DeleteEventCalendarInput
    >({
      async queryFn(input, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: deleteEventCalendar,
          variables: { input },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as DeleteEventCalendarMutation | null;
        const deleted = data?.deleteEventCalendar;

        if (!deleted) {
          return { error: { message: "Failed to delete event calendar" } };
        }

        return { data: deleted };
      },
      invalidatesTags: (result, _error, arg) => {
        const listTag: CalendarTag = { type: "EventCalendar", id: "LIST" };
        const targetId = arg.id ?? buildCalendarTagId(result ?? {});
        return [listTag, { type: "EventCalendar", id: targetId }];
      },
    }),
  }),
});

export const {
  useGetHolidayCalendarsQuery,
  useGetCompanyHolidayCalendarsQuery,
  useGetEventCalendarsQuery,
  useCreateHolidayCalendarMutation,
  useBulkCreateHolidayCalendarsMutation,
  useUpdateHolidayCalendarMutation,
  useDeleteHolidayCalendarMutation,
  useCreateCompanyHolidayCalendarMutation,
  useBulkCreateCompanyHolidayCalendarsMutation,
  useUpdateCompanyHolidayCalendarMutation,
  useDeleteCompanyHolidayCalendarMutation,
  useCreateEventCalendarMutation,
  useBulkCreateEventCalendarsMutation,
  useUpdateEventCalendarMutation,
  useDeleteEventCalendarMutation,
} = calendarApi;
