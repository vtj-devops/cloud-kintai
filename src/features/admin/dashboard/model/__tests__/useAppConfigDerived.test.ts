import { AppConfigContext , FALLBACK_DERIVED } from "@entities/app-config/model/AppConfigContext";
import { createMockAppConfig } from "@shared/test-utils/mockFactories";
import { renderHook } from "@testing-library/react";
import dayjs from "dayjs";
import React from "react";

import { useAppConfigDerived, useStandardWorkHours } from "../useAppConfigDerived";

// ---------------------------------------------------------------------------
// テスト用ラッパー
// ---------------------------------------------------------------------------
const createWrapper = (contextValue: ReturnType<typeof createMockAppConfig>) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(AppConfigContext.Provider, { value: contextValue }, children);
  return Wrapper;
};

// ---------------------------------------------------------------------------
// useAppConfigDerived
// ---------------------------------------------------------------------------
describe("useAppConfigDerived", () => {
  it("AppConfigContext の derived をそのまま返すこと", () => {
    const mockDerived = {
      ...FALLBACK_DERIVED,
      standardWorkHours: 7.5,
    };
    const mockConfig = createMockAppConfig({ derived: mockDerived });
    const { result } = renderHook(() => useAppConfigDerived(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current?.standardWorkHours).toBe(7.5);
  });

  it("FALLBACK_DERIVED をデフォルト値として返すこと", () => {
    const mockConfig = createMockAppConfig();
    const { result } = renderHook(() => useAppConfigDerived(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current?.standardWorkHours).toBe(FALLBACK_DERIVED.standardWorkHours);
  });

  it("derived が変わった場合、新しい値を返すこと", () => {
    const mockDerived = { ...FALLBACK_DERIVED, standardWorkHours: 6 };
    const mockConfig = createMockAppConfig({ derived: mockDerived });
    const { result } = renderHook(() => useAppConfigDerived(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current?.standardWorkHours).toBe(6);
  });

  it("derived が startTime・endTime を dayjs.Dayjs として持つこと", () => {
    const mockConfig = createMockAppConfig();
    const { result } = renderHook(() => useAppConfigDerived(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(dayjs.isDayjs(result.current?.startTime)).toBe(true);
    expect(dayjs.isDayjs(result.current?.endTime)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// useStandardWorkHours
// ---------------------------------------------------------------------------
describe("useStandardWorkHours", () => {
  it("derived.standardWorkHours が数値の場合、その値を返すこと", () => {
    const mockConfig = createMockAppConfig({
      derived: { ...FALLBACK_DERIVED, standardWorkHours: 7.5 },
    });
    const { result } = renderHook(() => useStandardWorkHours(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current).toBe(7.5);
  });

  it("derived.standardWorkHours が undefined の場合、getStandardWorkHours() の戻り値を返すこと", () => {
    const mockConfig = createMockAppConfig({
      derived: { ...FALLBACK_DERIVED, standardWorkHours: undefined as unknown as number },
    });
    // getStandardWorkHours は FALLBACK_DERIVED.standardWorkHours(=8) を返すようにモック済み
    (mockConfig.getStandardWorkHours as jest.Mock).mockReturnValue(6);

    const { result } = renderHook(() => useStandardWorkHours(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current).toBe(6);
  });

  it("derived が存在しない場合、getStandardWorkHours() にフォールバックすること", () => {
    const mockConfig = createMockAppConfig({ derived: undefined });
    (mockConfig.getStandardWorkHours as jest.Mock).mockReturnValue(8);

    const { result } = renderHook(() => useStandardWorkHours(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current).toBe(8);
  });
});
