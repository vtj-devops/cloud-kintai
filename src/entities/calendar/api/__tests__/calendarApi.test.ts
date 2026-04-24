import { configureStore } from "@reduxjs/toolkit";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";

import { calendarApi } from "../calendarApi";

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: { graphql: jest.fn() },
}));

const mockGraphql = graphqlClient.graphql as jest.Mock;

const createTestStore = () =>
  configureStore({
    reducer: { [calendarApi.reducerPath]: calendarApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(calendarApi.middleware),
  });

const makeHolidayCalendar = (overrides = {}) => ({
  __typename: "HolidayCalendar" as const,
  id: "hc-1",
  holidayDate: "2024-01-01",
  name: "元日",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

const makeCompanyHolidayCalendar = (overrides = {}) => ({
  __typename: "CompanyHolidayCalendar" as const,
  id: "chc-1",
  holidayDate: "2024-01-02",
  name: "会社休日",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

const makeEventCalendar = (overrides = {}) => ({
  __typename: "EventCalendar" as const,
  id: "ec-1",
  eventDate: "2024-03-15",
  name: "社内イベント",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("calendarApi endpoints", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ─── getHolidayCalendars ────────────────────────────────────────────────

  describe("getHolidayCalendars", () => {
    it("正常に祝日カレンダーリストを取得する", async () => {
      const calendar = makeHolidayCalendar();
      mockGraphql.mockResolvedValueOnce({
        data: {
          listHolidayCalendars: { items: [calendar], nextToken: null },
        },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.getHolidayCalendars.initiate(),
      );

      expect(result.data).toEqual([calendar]);
    });

    it("nextTokenによるページネーションで全件取得する", async () => {
      const cal1 = makeHolidayCalendar({ id: "hc-1" });
      const cal2 = makeHolidayCalendar({ id: "hc-2", holidayDate: "2024-01-02" });

      mockGraphql
        .mockResolvedValueOnce({
          data: {
            listHolidayCalendars: { items: [cal1], nextToken: "token-1" },
          },
        })
        .mockResolvedValueOnce({
          data: {
            listHolidayCalendars: { items: [cal2], nextToken: null },
          },
        });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.getHolidayCalendars.initiate(),
      );

      expect(result.data).toHaveLength(2);
      expect(result.data).toEqual([cal1, cal2]);
    });

    it("null アイテムをフィルタリングする", async () => {
      const calendar = makeHolidayCalendar();
      mockGraphql.mockResolvedValueOnce({
        data: {
          listHolidayCalendars: {
            items: [null, calendar, undefined],
            nextToken: null,
          },
        },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.getHolidayCalendars.initiate(),
      );

      expect(result.data).toEqual([calendar]);
    });

    it("GraphQL エラー時にエラーを返す", async () => {
      mockGraphql.mockRejectedValueOnce(new Error("Network error"));

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.getHolidayCalendars.initiate(),
      );

      expect(result.error).toBeDefined();
    });

    it("connection が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { listHolidayCalendars: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.getHolidayCalendars.initiate(),
      );

      expect(result.error).toMatchObject({
        message: "Failed to fetch holiday calendars",
      });
    });
  });

  // ─── getCompanyHolidayCalendars ─────────────────────────────────────────

  describe("getCompanyHolidayCalendars", () => {
    it("正常に会社休日カレンダーリストを取得する", async () => {
      const calendar = makeCompanyHolidayCalendar();
      mockGraphql.mockResolvedValueOnce({
        data: {
          listCompanyHolidayCalendars: { items: [calendar], nextToken: null },
        },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.getCompanyHolidayCalendars.initiate(),
      );

      expect(result.data).toEqual([calendar]);
    });

    it("nextTokenによるページネーションで全件取得する", async () => {
      const cal1 = makeCompanyHolidayCalendar({ id: "chc-1" });
      const cal2 = makeCompanyHolidayCalendar({ id: "chc-2", holidayDate: "2024-01-03" });

      mockGraphql
        .mockResolvedValueOnce({
          data: {
            listCompanyHolidayCalendars: { items: [cal1], nextToken: "next" },
          },
        })
        .mockResolvedValueOnce({
          data: {
            listCompanyHolidayCalendars: { items: [cal2], nextToken: null },
          },
        });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.getCompanyHolidayCalendars.initiate(),
      );

      expect(result.data).toHaveLength(2);
    });

    it("connection が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { listCompanyHolidayCalendars: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.getCompanyHolidayCalendars.initiate(),
      );

      expect(result.error).toMatchObject({
        message: "Failed to fetch company holiday calendars",
      });
    });
  });

  // ─── createHolidayCalendar ─────────────────────────────────────────────

  describe("createHolidayCalendar", () => {
    it("正常に祝日カレンダーを作成する", async () => {
      const created = makeHolidayCalendar();
      mockGraphql.mockResolvedValueOnce({
        data: { createHolidayCalendar: created },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.createHolidayCalendar.initiate({
          holidayDate: "2024-01-01",
          name: "元日",
        }),
      );

      expect(result.data).toEqual(created);
    });

    it("作成結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { createHolidayCalendar: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.createHolidayCalendar.initiate({
          holidayDate: "2024-01-01",
          name: "元日",
        }),
      );

      expect(result.error).toMatchObject({
        message: "Failed to create holiday calendar",
      });
    });

    it("GraphQL エラー時にエラーを返す", async () => {
      mockGraphql.mockRejectedValueOnce(new Error("Create failed"));

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.createHolidayCalendar.initiate({
          holidayDate: "2024-01-01",
          name: "元日",
        }),
      );

      expect(result.error).toBeDefined();
    });
  });

  // ─── bulkCreateHolidayCalendars ────────────────────────────────────────

  describe("bulkCreateHolidayCalendars", () => {
    it("複数の祝日カレンダーを一括作成する", async () => {
      const cal1 = makeHolidayCalendar({ id: "hc-1" });
      const cal2 = makeHolidayCalendar({ id: "hc-2", holidayDate: "2024-01-02" });

      mockGraphql
        .mockResolvedValueOnce({ data: { createHolidayCalendar: cal1 } })
        .mockResolvedValueOnce({ data: { createHolidayCalendar: cal2 } });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.bulkCreateHolidayCalendars.initiate([
          { holidayDate: "2024-01-01", name: "元日" },
          { holidayDate: "2024-01-02", name: "休日2" },
        ]),
      );

      expect(result.data).toEqual([cal1, cal2]);
    });

    it("途中でエラーが起きた場合にエラーを返す", async () => {
      mockGraphql
        .mockResolvedValueOnce({ data: { createHolidayCalendar: makeHolidayCalendar() } })
        .mockRejectedValueOnce(new Error("second item failed"));

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.bulkCreateHolidayCalendars.initiate([
          { holidayDate: "2024-01-01", name: "元日" },
          { holidayDate: "2024-01-02", name: "休日2" },
        ]),
      );

      expect(result.error).toBeDefined();
    });

    it("作成結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({ data: { createHolidayCalendar: null } });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.bulkCreateHolidayCalendars.initiate([
          { holidayDate: "2024-01-01", name: "元日" },
        ]),
      );

      expect(result.error).toMatchObject({
        message: "Failed to create holiday calendar",
      });
    });

    it("空配列で空配列を返す", async () => {
      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.bulkCreateHolidayCalendars.initiate([]),
      );

      expect(result.data).toEqual([]);
    });
  });

  // ─── updateHolidayCalendar ─────────────────────────────────────────────

  describe("updateHolidayCalendar", () => {
    it("正常に祝日カレンダーを更新する", async () => {
      const updated = makeHolidayCalendar({ name: "変更後" });
      mockGraphql.mockResolvedValueOnce({
        data: { updateHolidayCalendar: updated },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.updateHolidayCalendar.initiate({
          input: { id: "hc-1", holidayDate: "2024-01-01", name: "変更後" },
        }),
      );

      expect(result.data).toEqual(updated);
    });

    it("更新結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { updateHolidayCalendar: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.updateHolidayCalendar.initiate({
          input: { id: "hc-1", holidayDate: "2024-01-01", name: "変更後" },
        }),
      );

      expect(result.error).toMatchObject({
        message: "Failed to update holiday calendar",
      });
    });
  });

  // ─── deleteHolidayCalendar ─────────────────────────────────────────────

  describe("deleteHolidayCalendar", () => {
    it("正常に祝日カレンダーを削除する", async () => {
      const deleted = makeHolidayCalendar();
      mockGraphql.mockResolvedValueOnce({
        data: { deleteHolidayCalendar: deleted },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.deleteHolidayCalendar.initiate({ id: "hc-1" }),
      );

      expect(result.data).toEqual(deleted);
    });

    it("削除結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { deleteHolidayCalendar: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.deleteHolidayCalendar.initiate({ id: "hc-1" }),
      );

      expect(result.error).toMatchObject({
        message: "Failed to delete holiday calendar",
      });
    });
  });

  // ─── createCompanyHolidayCalendar ──────────────────────────────────────

  describe("createCompanyHolidayCalendar", () => {
    it("正常に会社休日カレンダーを作成する", async () => {
      const created = makeCompanyHolidayCalendar();
      mockGraphql.mockResolvedValueOnce({
        data: { createCompanyHolidayCalendar: created },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.createCompanyHolidayCalendar.initiate({
          holidayDate: "2024-01-02",
          name: "会社休日",
        }),
      );

      expect(result.data).toEqual(created);
    });

    it("作成結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { createCompanyHolidayCalendar: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.createCompanyHolidayCalendar.initiate({
          holidayDate: "2024-01-02",
          name: "会社休日",
        }),
      );

      expect(result.error).toMatchObject({
        message: "Failed to create company holiday calendar",
      });
    });
  });

  // ─── bulkCreateCompanyHolidayCalendars ────────────────────────────────

  describe("bulkCreateCompanyHolidayCalendars", () => {
    it("複数の会社休日カレンダーを一括作成する", async () => {
      const cal1 = makeCompanyHolidayCalendar({ id: "chc-1" });
      const cal2 = makeCompanyHolidayCalendar({ id: "chc-2", holidayDate: "2024-01-03" });

      mockGraphql
        .mockResolvedValueOnce({ data: { createCompanyHolidayCalendar: cal1 } })
        .mockResolvedValueOnce({ data: { createCompanyHolidayCalendar: cal2 } });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.bulkCreateCompanyHolidayCalendars.initiate([
          { holidayDate: "2024-01-02", name: "休日1" },
          { holidayDate: "2024-01-03", name: "休日2" },
        ]),
      );

      expect(result.data).toEqual([cal1, cal2]);
    });

    it("作成結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { createCompanyHolidayCalendar: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.bulkCreateCompanyHolidayCalendars.initiate([
          { holidayDate: "2024-01-02", name: "休日1" },
        ]),
      );

      expect(result.error).toMatchObject({
        message: "Failed to create company holiday calendar",
      });
    });
  });

  // ─── updateCompanyHolidayCalendar ──────────────────────────────────────

  describe("updateCompanyHolidayCalendar", () => {
    it("正常に会社休日カレンダーを更新する", async () => {
      const updated = makeCompanyHolidayCalendar({ name: "更新後" });
      mockGraphql.mockResolvedValueOnce({
        data: { updateCompanyHolidayCalendar: updated },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.updateCompanyHolidayCalendar.initiate({
          input: {
            id: "chc-1",
            holidayDate: "2024-01-02",
            name: "更新後",
          },
        }),
      );

      expect(result.data).toEqual(updated);
    });

    it("更新結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { updateCompanyHolidayCalendar: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.updateCompanyHolidayCalendar.initiate({
          input: {
            id: "chc-1",
            holidayDate: "2024-01-02",
            name: "更新後",
          },
        }),
      );

      expect(result.error).toMatchObject({
        message: "Failed to update company holiday calendar",
      });
    });
  });

  // ─── deleteCompanyHolidayCalendar ─────────────────────────────────────

  describe("deleteCompanyHolidayCalendar", () => {
    it("正常に会社休日カレンダーを削除する", async () => {
      const deleted = makeCompanyHolidayCalendar();
      mockGraphql.mockResolvedValueOnce({
        data: { deleteCompanyHolidayCalendar: deleted },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.deleteCompanyHolidayCalendar.initiate({
          id: "chc-1",
        }),
      );

      expect(result.data).toEqual(deleted);
    });

    it("削除結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { deleteCompanyHolidayCalendar: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.deleteCompanyHolidayCalendar.initiate({
          id: "chc-1",
        }),
      );

      expect(result.error).toMatchObject({
        message: "Failed to delete company holiday calendar",
      });
    });
  });

  // ─── getEventCalendars ─────────────────────────────────────────────────

  describe("getEventCalendars", () => {
    it("正常にイベントカレンダーリストを取得する", async () => {
      const calendar = makeEventCalendar();
      mockGraphql.mockResolvedValueOnce({
        data: {
          listEventCalendars: { items: [calendar], nextToken: null },
        },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.getEventCalendars.initiate(),
      );

      expect(result.data).toEqual([calendar]);
    });

    it("nextTokenによるページネーションで全件取得する", async () => {
      const cal1 = makeEventCalendar({ id: "ec-1" });
      const cal2 = makeEventCalendar({ id: "ec-2", eventDate: "2024-03-16" });

      mockGraphql
        .mockResolvedValueOnce({
          data: {
            listEventCalendars: { items: [cal1], nextToken: "token-next" },
          },
        })
        .mockResolvedValueOnce({
          data: {
            listEventCalendars: { items: [cal2], nextToken: null },
          },
        });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.getEventCalendars.initiate(),
      );

      expect(result.data).toHaveLength(2);
    });

    it("connection が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { listEventCalendars: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.getEventCalendars.initiate(),
      );

      expect(result.error).toMatchObject({
        message: "Failed to fetch event calendars",
      });
    });
  });

  // ─── createEventCalendar ──────────────────────────────────────────────

  describe("createEventCalendar", () => {
    it("正常にイベントカレンダーを作成する", async () => {
      const created = makeEventCalendar();
      mockGraphql.mockResolvedValueOnce({
        data: { createEventCalendar: created },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.createEventCalendar.initiate({
          eventDate: "2024-03-15",
          name: "社内イベント",
        }),
      );

      expect(result.data).toEqual(created);
    });

    it("作成結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { createEventCalendar: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.createEventCalendar.initiate({
          eventDate: "2024-03-15",
          name: "社内イベント",
        }),
      );

      expect(result.error).toMatchObject({
        message: "Failed to create event calendar",
      });
    });
  });

  // ─── bulkCreateEventCalendars ─────────────────────────────────────────

  describe("bulkCreateEventCalendars", () => {
    it("複数のイベントカレンダーを一括作成する", async () => {
      const cal1 = makeEventCalendar({ id: "ec-1" });
      const cal2 = makeEventCalendar({ id: "ec-2", eventDate: "2024-03-16" });

      mockGraphql
        .mockResolvedValueOnce({ data: { createEventCalendar: cal1 } })
        .mockResolvedValueOnce({ data: { createEventCalendar: cal2 } });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.bulkCreateEventCalendars.initiate([
          { eventDate: "2024-03-15", name: "イベント1" },
          { eventDate: "2024-03-16", name: "イベント2" },
        ]),
      );

      expect(result.data).toEqual([cal1, cal2]);
    });

    it("作成結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { createEventCalendar: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.bulkCreateEventCalendars.initiate([
          { eventDate: "2024-03-15", name: "イベント1" },
        ]),
      );

      expect(result.error).toMatchObject({
        message: "Failed to create event calendar",
      });
    });
  });

  // ─── updateEventCalendar ──────────────────────────────────────────────

  describe("updateEventCalendar", () => {
    it("正常にイベントカレンダーを更新する", async () => {
      const updated = makeEventCalendar({ name: "変更後イベント" });
      mockGraphql.mockResolvedValueOnce({
        data: { updateEventCalendar: updated },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.updateEventCalendar.initiate({
          input: { id: "ec-1", eventDate: "2024-03-15", name: "変更後イベント" },
        }),
      );

      expect(result.data).toEqual(updated);
    });

    it("更新結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { updateEventCalendar: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.updateEventCalendar.initiate({
          input: { id: "ec-1", eventDate: "2024-03-15", name: "変更後" },
        }),
      );

      expect(result.error).toMatchObject({
        message: "Failed to update event calendar",
      });
    });
  });

  // ─── deleteEventCalendar ──────────────────────────────────────────────

  describe("deleteEventCalendar", () => {
    it("正常にイベントカレンダーを削除する", async () => {
      const deleted = makeEventCalendar();
      mockGraphql.mockResolvedValueOnce({
        data: { deleteEventCalendar: deleted },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.deleteEventCalendar.initiate({ id: "ec-1" }),
      );

      expect(result.data).toEqual(deleted);
    });

    it("削除結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { deleteEventCalendar: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        calendarApi.endpoints.deleteEventCalendar.initiate({ id: "ec-1" }),
      );

      expect(result.error).toMatchObject({
        message: "Failed to delete event calendar",
      });
    });
  });
});
