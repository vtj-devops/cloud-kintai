import { renderHook } from "@testing-library/react";

import { useCalendars } from "../useCalendars";

const mockUseGetHolidayCalendarsQuery = jest.fn();
const mockUseGetCompanyHolidayCalendarsQuery = jest.fn();

jest.mock("@entities/calendar/api/calendarApi", () => ({
  useGetHolidayCalendarsQuery: (...args: unknown[]) =>
    mockUseGetHolidayCalendarsQuery(...args),
  useGetCompanyHolidayCalendarsQuery: (...args: unknown[]) =>
    mockUseGetCompanyHolidayCalendarsQuery(...args),
}));

const defaultHolidayResult = {
  data: [],
  isLoading: false,
  isFetching: false,
  error: undefined,
};

const defaultCompanyHolidayResult = {
  data: [],
  isLoading: false,
  isFetching: false,
  error: undefined,
};

describe("useCalendars", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetHolidayCalendarsQuery.mockReturnValue(defaultHolidayResult);
    mockUseGetCompanyHolidayCalendarsQuery.mockReturnValue(
      defaultCompanyHolidayResult,
    );
  });

  it("データが取得できた場合、holidayCalendars と companyHolidayCalendars を返す", () => {
    const mockHolidays = [
      { id: "h1", holidayDate: "2024-01-01", calendarName: "元日" },
    ];
    const mockCompanyHolidays = [{ id: "c1", holidayDate: "2024-08-13" }];

    mockUseGetHolidayCalendarsQuery.mockReturnValue({
      ...defaultHolidayResult,
      data: mockHolidays,
    });
    mockUseGetCompanyHolidayCalendarsQuery.mockReturnValue({
      ...defaultCompanyHolidayResult,
      data: mockCompanyHolidays,
    });

    const { result } = renderHook(() => useCalendars());

    expect(result.current.holidayCalendars).toEqual(mockHolidays);
    expect(result.current.companyHolidayCalendars).toEqual(mockCompanyHolidays);
  });

  it("データが未取得の場合、デフォルトで空配列を返す", () => {
    mockUseGetHolidayCalendarsQuery.mockReturnValue({
      ...defaultHolidayResult,
      data: undefined,
    });
    mockUseGetCompanyHolidayCalendarsQuery.mockReturnValue({
      ...defaultCompanyHolidayResult,
      data: undefined,
    });

    const { result } = renderHook(() => useCalendars());

    expect(result.current.holidayCalendars).toEqual([]);
    expect(result.current.companyHolidayCalendars).toEqual([]);
  });

  it("holidayCalendars が isLoading の場合、isLoading が true になる", () => {
    mockUseGetHolidayCalendarsQuery.mockReturnValue({
      ...defaultHolidayResult,
      isLoading: true,
    });

    const { result } = renderHook(() => useCalendars());

    expect(result.current.isLoading).toBe(true);
  });

  it("companyHolidayCalendars が isFetching の場合、isLoading が true になる", () => {
    mockUseGetCompanyHolidayCalendarsQuery.mockReturnValue({
      ...defaultCompanyHolidayResult,
      isFetching: true,
    });

    const { result } = renderHook(() => useCalendars());

    expect(result.current.isLoading).toBe(true);
  });

  it("両クエリが完了している場合、isLoading が false になる", () => {
    const { result } = renderHook(() => useCalendars());

    expect(result.current.isLoading).toBe(false);
  });

  it("holidayCalendars にエラーがある場合、error を返す", () => {
    const mockError = { message: "Network error" };
    mockUseGetHolidayCalendarsQuery.mockReturnValue({
      ...defaultHolidayResult,
      error: mockError,
    });

    const { result } = renderHook(() => useCalendars());

    expect(result.current.error).toBe(mockError);
  });

  it("companyHolidayCalendars にエラーがある場合、error を返す", () => {
    const mockError = { message: "Server error" };
    mockUseGetCompanyHolidayCalendarsQuery.mockReturnValue({
      ...defaultCompanyHolidayResult,
      error: mockError,
    });

    const { result } = renderHook(() => useCalendars());

    expect(result.current.error).toBe(mockError);
  });

  it("両方にエラーがある場合、holidayCalendars のエラーを優先する", () => {
    const holidayError = { message: "Holiday error" };
    const companyError = { message: "Company error" };
    mockUseGetHolidayCalendarsQuery.mockReturnValue({
      ...defaultHolidayResult,
      error: holidayError,
    });
    mockUseGetCompanyHolidayCalendarsQuery.mockReturnValue({
      ...defaultCompanyHolidayResult,
      error: companyError,
    });

    const { result } = renderHook(() => useCalendars());

    expect(result.current.error).toBe(holidayError);
  });

  it("skip: true を渡した場合、両クエリに skip オプションが渡る", () => {
    renderHook(() => useCalendars({ skip: true }));

    expect(mockUseGetHolidayCalendarsQuery).toHaveBeenCalledWith(undefined, {
      skip: true,
    });
    expect(mockUseGetCompanyHolidayCalendarsQuery).toHaveBeenCalledWith(
      undefined,
      { skip: true },
    );
  });

  it("skip を省略した場合、デフォルトで skip: false が渡る", () => {
    renderHook(() => useCalendars());

    expect(mockUseGetHolidayCalendarsQuery).toHaveBeenCalledWith(undefined, {
      skip: false,
    });
    expect(mockUseGetCompanyHolidayCalendarsQuery).toHaveBeenCalledWith(
      undefined,
      { skip: false },
    );
  });

  it("エラーがない場合、error は null になる", () => {
    const { result } = renderHook(() => useCalendars());

    expect(result.current.error).toBeNull();
  });
});
