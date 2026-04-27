import { act, renderHook, waitFor } from "@testing-library/react";

import useShiftPlanYear from "../useShiftPlanYear";

// ---- モック定義 ----

type MockGraphQL = jest.Mock;
const mockGraphql: MockGraphQL = jest.fn();

jest.mock("@/shared/api/amplify/graphqlClient", () => ({
  graphqlClient: {
    graphql: (...args: unknown[]) => mockGraphql(...args),
  },
}));

// ---- テスト ----

describe("useShiftPlanYear（追加テスト）", () => {
  beforeEach(() => {
    mockGraphql.mockReset();
  });

  it("fetch 中は loading が true になる", async () => {
    let resolveGraphql!: (value: unknown) => void;
    mockGraphql.mockReturnValue(
      new Promise((resolve) => {
        resolveGraphql = resolve;
      })
    );

    const { result } = renderHook(() => useShiftPlanYear(2024));

    // fetch 開始直後は loading=true
    await waitFor(() => expect(result.current.loading).toBe(true));

    // resolve して loading が false に戻ることを確認
    resolveGraphql({
      data: { shiftPlanYearByTargetYear: { items: [] } },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("Non-Error 例外が投げられた場合は error が 'Unknown error' になる", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGraphql.mockRejectedValue("plain-string-error");

    const { result } = renderHook(() => useShiftPlanYear(2024));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Unknown error");
    expect(result.current.plans).toBeNull();
    consoleSpy.mockRestore();
  });

  it("plans が全て null の場合は plans が null になる", async () => {
    mockGraphql.mockResolvedValue({
      data: {
        shiftPlanYearByTargetYear: {
          items: [
            {
              __typename: "ShiftPlanYear",
              plans: [null, null, null],
            },
          ],
        },
      },
    });

    const { result } = renderHook(() => useShiftPlanYear(2024));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.plans).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("enabled が false→true に変わると fetch が実行される", async () => {
    mockGraphql.mockResolvedValue({
      data: {
        shiftPlanYearByTargetYear: {
          items: [
            {
              __typename: "ShiftPlanYear",
              plans: [
                {
                  __typename: "ShiftPlanMonthSetting",
                  month: 3,
                  settings: [],
                },
              ],
            },
          ],
        },
      },
    });

    const { result, rerender } = renderHook(
      ({ enabled }) => useShiftPlanYear(2024, { enabled }),
      { initialProps: { enabled: false } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    // enabled=false の間は fetch されていない
    expect(mockGraphql).not.toHaveBeenCalled();

    // enabled を true に変更 → fetch が走る
    act(() => {
      rerender({ enabled: true });
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGraphql).toHaveBeenCalledTimes(1);
    expect(result.current.plans?.[0]?.month).toBe(3);
  });
});
