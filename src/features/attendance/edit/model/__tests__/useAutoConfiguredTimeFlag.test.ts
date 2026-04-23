import { act,renderHook } from "@testing-library/react";
import dayjs from "dayjs";
import React from "react";

import { AttendanceEditContext , defaultAttendanceEditContextValue } from "../AttendanceEditProvider";
import { useAutoConfiguredTimeFlag } from "../useAutoConfiguredTimeFlag";

// useAppConfig のモック（default export）
jest.mock("@entities/app-config/model/useAppConfig", () => ({
  __esModule: true,
  default: () => ({
    getStartTime: () => dayjs("2024-01-01 09:00:00"),
    getEndTime: () => dayjs("2024-01-01 18:00:00"),
  }),
}));

const workDate = dayjs("2024-01-15");

/** AttendanceEditContext を注入するラッパー */
const makeWrapper = (contextOverrides: Partial<typeof defaultAttendanceEditContextValue>) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      AttendanceEditContext.Provider,
      {
        value: { ...defaultAttendanceEditContextValue, ...contextOverrides },
      },
      children,
    );
  return Wrapper;
};

describe("useAutoConfiguredTimeFlag", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("disabled フラグ", () => {
    it("control が undefined のとき disabled = true になる", () => {
      const wrapper = makeWrapper({ control: undefined, setValue: jest.fn() as any });
      const { result } = renderHook(
        () => useAutoConfiguredTimeFlag({ timeField: "startTime" }),
        { wrapper },
      );
      expect(result.current.disabled).toBe(true);
    });

    it("setValue が undefined のとき disabled = true になる", () => {
      const wrapper = makeWrapper({ control: {} as any, setValue: undefined });
      const { result } = renderHook(
        () => useAutoConfiguredTimeFlag({ timeField: "startTime" }),
        { wrapper },
      );
      expect(result.current.disabled).toBe(true);
    });

    it("control と setValue が両方ある場合 disabled = false になる", () => {
      const wrapper = makeWrapper({
        control: {} as any,
        setValue: jest.fn() as any,
      });
      const { result } = renderHook(
        () => useAutoConfiguredTimeFlag({ timeField: "startTime" }),
        { wrapper },
      );
      expect(result.current.disabled).toBe(false);
    });
  });

  describe("highlighted フラグ", () => {
    it("初期状態では highlighted = false", () => {
      const wrapper = makeWrapper({
        control: {} as any,
        setValue: jest.fn() as any,
        workDate,
        getValues: (() => null) as any,
      });
      const { result } = renderHook(
        () => useAutoConfiguredTimeFlag({ timeField: "startTime" }),
        { wrapper },
      );
      expect(result.current.highlighted).toBe(false);
    });

    it("applyConfiguredTime(true) 後に highlighted = true になり、タイムアウト後に false に戻る", () => {
      const mockSetValue = jest.fn();
      const wrapper = makeWrapper({
        control: {} as any,
        setValue: mockSetValue as any,
        workDate,
        getValues: (() => null) as any,
      });
      const { result } = renderHook(
        () =>
          useAutoConfiguredTimeFlag({
            timeField: "startTime",
            highlightDurationMs: 1000,
          }),
        { wrapper },
      );

      act(() => {
        result.current.applyConfiguredTime(true);
      });
      expect(result.current.highlighted).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.highlighted).toBe(false);
    });
  });

  describe("applyConfiguredTime", () => {
    it("checked = false のとき setValue を呼ばない", () => {
      const mockSetValue = jest.fn();
      const wrapper = makeWrapper({
        control: {} as any,
        setValue: mockSetValue as any,
        workDate,
        getValues: (() => null) as any,
      });
      const { result } = renderHook(
        () => useAutoConfiguredTimeFlag({ timeField: "startTime" }),
        { wrapper },
      );

      act(() => {
        result.current.applyConfiguredTime(false);
      });

      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it("setValue が undefined のとき applyConfiguredTime(true) は何もしない", () => {
      const wrapper = makeWrapper({
        control: {} as any,
        setValue: undefined,
        workDate,
        getValues: (() => null) as any,
      });
      const { result } = renderHook(
        () => useAutoConfiguredTimeFlag({ timeField: "startTime" }),
        { wrapper },
      );

      // エラーにならないことを確認
      expect(() => {
        act(() => {
          result.current.applyConfiguredTime(true);
        });
      }).not.toThrow();
    });

    it("startTime フィールド: applyConfiguredTime(true) が setValue を呼ぶ", () => {
      const mockSetValue = jest.fn();
      const wrapper = makeWrapper({
        control: {} as any,
        setValue: mockSetValue as any,
        workDate,
        getValues: (() => null) as any,
      });
      const { result } = renderHook(
        () => useAutoConfiguredTimeFlag({ timeField: "startTime" }),
        { wrapper },
      );

      act(() => {
        result.current.applyConfiguredTime(true);
      });

      expect(mockSetValue).toHaveBeenCalledWith(
        "startTime",
        expect.any(String),
      );
      // ISO 文字列であることを確認
      const isoArg = mockSetValue.mock.calls[0][1] as string;
      expect(dayjs(isoArg).isValid()).toBe(true);
    });

    it("endTime フィールド: workDate がある場合 setValue を呼ぶ", () => {
      const mockSetValue = jest.fn();
      const wrapper = makeWrapper({
        control: {} as any,
        setValue: mockSetValue as any,
        workDate,
        getValues: (() => null) as any,
      });
      const { result } = renderHook(
        () => useAutoConfiguredTimeFlag({ timeField: "endTime" }),
        { wrapper },
      );

      act(() => {
        result.current.applyConfiguredTime(true);
      });

      expect(mockSetValue).toHaveBeenCalledWith("endTime", expect.any(String));
      const isoArg = mockSetValue.mock.calls[0][1] as string;
      expect(dayjs(isoArg).isValid()).toBe(true);
    });

    it("endTime フィールド: workDate が null のとき setValue を呼ばない", () => {
      const mockSetValue = jest.fn();
      const wrapper = makeWrapper({
        control: {} as any,
        setValue: mockSetValue as any,
        workDate: null,
        getValues: (() => null) as any,
      });
      const { result } = renderHook(
        () => useAutoConfiguredTimeFlag({ timeField: "endTime" }),
        { wrapper },
      );

      act(() => {
        result.current.applyConfiguredTime(true);
      });

      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it("startTime フィールド: getValues が既存の時刻を返す場合、その日付を基準に計算する", () => {
      const mockSetValue = jest.fn();
      // getValues が startTime として既存の ISO 文字列を返す
      const existingTime = "2024-02-20T10:30:00.000Z";
      const mockGetValues = jest.fn().mockReturnValue(existingTime);
      const wrapper = makeWrapper({
        control: {} as any,
        setValue: mockSetValue as any,
        workDate: null, // workDate は null だが getValues で補う
        getValues: mockGetValues as any,
      });
      const { result } = renderHook(
        () => useAutoConfiguredTimeFlag({ timeField: "startTime" }),
        { wrapper },
      );

      act(() => {
        result.current.applyConfiguredTime(true);
      });

      // resolveConfigTimeOnDate が getValues("startTime") の日付を使って計算する
      expect(mockSetValue).toHaveBeenCalledWith("startTime", expect.any(String));
    });

    it("applyConfiguredTime(true) で設定される時刻が getEndTime の時刻を反映する（endTime）", () => {
      const mockSetValue = jest.fn();
      const wrapper = makeWrapper({
        control: {} as any,
        setValue: mockSetValue as any,
        workDate,
        getValues: (() => null) as any,
      });
      const { result } = renderHook(
        () => useAutoConfiguredTimeFlag({ timeField: "endTime" }),
        { wrapper },
      );

      act(() => {
        result.current.applyConfiguredTime(true);
      });

      const isoArg = mockSetValue.mock.calls[0][1] as string;
      const applied = dayjs(isoArg);
      // getEndTime() は 18:00 を返すのでその時刻が適用されているはず
      expect(applied.hour()).toBe(18);
      expect(applied.minute()).toBe(0);
    });
  });

  describe("返却値に control が含まれる", () => {
    it("context の control がそのまま返る", () => {
      const mockControl = {} as any;
      const wrapper = makeWrapper({
        control: mockControl,
        setValue: jest.fn() as any,
      });
      const { result } = renderHook(
        () => useAutoConfiguredTimeFlag({ timeField: "startTime" }),
        { wrapper },
      );
      expect(result.current.control).toBe(mockControl);
    });
  });
});
