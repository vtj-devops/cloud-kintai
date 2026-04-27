import { act, renderHook } from "@testing-library/react";

import {
  sortCalendar,
  useHolidayCalendarList,
} from "../useHolidayCalendarList";

// Helpers
const makeItem = (date: string, name = "holiday") => ({
  id: date,
  holidayDate: date,
  name,
});

describe("sortCalendar", () => {
  it("新しい日付が先になるよう降順ソートする", () => {
    const a = makeItem("2024-03-01");
    const b = makeItem("2024-01-01");
    // a が新しいので a は b より前（負の値）
    expect(sortCalendar(a, b)).toBe(-1);
    expect(sortCalendar(b, a)).toBe(1);
  });

  it("eventDate を使う場合も正しくソートする", () => {
    const a = { eventDate: "2024-06-01" };
    const b = { eventDate: "2024-01-01" };
    // a は b より新しい → a が後（降順）→ sortCalendar(a,b) = -1
    expect(sortCalendar(a, b)).toBe(-1);
  });

  it("同じ日付は 0 以外を返す（dayjs.isBefore は同日 false）", () => {
    const a = makeItem("2024-01-01");
    const b = makeItem("2024-01-01");
    // isBefore returns false when equal → -1
    expect(sortCalendar(a, b)).toBe(-1);
  });
});

describe("useHolidayCalendarList", () => {
  const items = [
    makeItem("2024-03-15", "春分"),
    makeItem("2024-01-01", "元日"),
    makeItem("2024-08-11", "山の日"),
    makeItem("2023-12-25", "クリスマス"),
  ];

  it("初期状態ではすべてのアイテムが filtered に含まれる", () => {
    const { result } = renderHook(() => useHolidayCalendarList(items));
    expect(result.current.filtered.length).toBe(4);
  });

  it("items が undefined の場合は空配列を返す", () => {
    const { result } = renderHook(() => useHolidayCalendarList(undefined));
    expect(result.current.filtered.length).toBe(0);
    expect(result.current.paginated.length).toBe(0);
  });

  it("年フィルタで該当年のみ返す", () => {
    const { result } = renderHook(() => useHolidayCalendarList(items));
    act(() => {
      result.current.applyYearMonthFilter(2024, "");
    });
    expect(result.current.filtered.length).toBe(3);
    expect(result.current.filtered.every((i) => i.holidayDate?.startsWith("2024"))).toBe(true);
  });

  it("年+月フィルタで該当月のみ返す", () => {
    const { result } = renderHook(() => useHolidayCalendarList(items));
    act(() => {
      result.current.applyYearMonthFilter(2024, 3);
    });
    expect(result.current.filtered.length).toBe(1);
    expect(result.current.filtered[0].name).toBe("春分");
  });

  it("月のみフィルタで一致アイテムを返す", () => {
    const { result } = renderHook(() => useHolidayCalendarList(items));
    act(() => {
      result.current.applyYearMonthFilter("", 1);
    });
    expect(result.current.filtered.length).toBe(1);
    expect(result.current.filtered[0].name).toBe("元日");
  });

  it("name フィルタで一致アイテムを返す（大文字小文字無視）", () => {
    const { result } = renderHook(() => useHolidayCalendarList(items));
    act(() => {
      result.current.setNameFilter("春");
    });
    expect(result.current.filtered.length).toBe(1);
    expect(result.current.filtered[0].name).toBe("春分");
  });

  it("clearFilters でフィルタがリセットされる", () => {
    const { result } = renderHook(() => useHolidayCalendarList(items));
    act(() => {
      result.current.applyYearMonthFilter(2024, 3);
      result.current.setNameFilter("春分");
    });
    act(() => {
      result.current.clearFilters();
    });
    expect(result.current.filtered.length).toBe(4);
    expect(result.current.selectedYear).toBe("");
    expect(result.current.selectedMonth).toBe("");
    expect(result.current.nameFilter).toBe("");
  });

  it("ページネーションが動作する", () => {
    const manyItems = Array.from({ length: 25 }, (_, i) =>
      makeItem(`2024-${String(i + 1).padStart(2, "0")}-01`, `holiday-${i}`),
    );
    const { result } = renderHook(() =>
      useHolidayCalendarList(manyItems, { initialRowsPerPage: 10 }),
    );
    expect(result.current.paginated.length).toBe(10);

    act(() => {
      result.current.handleChangePage(null, 1);
    });
    expect(result.current.page).toBe(1);
    expect(result.current.paginated.length).toBe(10);
  });

  it("handleChangeRowsPerPage でページサイズを変更する", () => {
    const { result } = renderHook(() => useHolidayCalendarList(items));
    act(() => {
      result.current.handleChangeRowsPerPage({
        target: { value: "2" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.rowsPerPage).toBe(2);
    expect(result.current.page).toBe(0);
  });

  it("years 配列が生成される", () => {
    const { result } = renderHook(() =>
      useHolidayCalendarList(items, { yearRange: 3, yearOffset: 1 }),
    );
    expect(result.current.years.length).toBe(3);
  });

  it("フィルタ変更後にページが 0 にリセットされる", () => {
    const manyItems = Array.from({ length: 25 }, (_, i) =>
      makeItem(`2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`, `h${i}`),
    );
    const { result } = renderHook(() =>
      useHolidayCalendarList(manyItems, { initialRowsPerPage: 5 }),
    );
    act(() => {
      result.current.handleChangePage(null, 2);
    });
    expect(result.current.page).toBe(2);

    act(() => {
      result.current.setNameFilter("h1");
    });
    expect(result.current.page).toBe(0);
  });
});
