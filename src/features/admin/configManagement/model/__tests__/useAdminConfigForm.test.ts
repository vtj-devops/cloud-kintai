import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import {
  buildCreatePayload,
  buildUpdatePayload,
} from "@features/admin/configManagement/lib/payloadHelpers";
import { validateAdminConfigForm } from "@features/admin/configManagement/lib/validation";
import { useAdminConfigForm } from "@features/admin/configManagement/model/useAdminConfigForm";
import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import React from "react";

// dayjs/plugin/customParseFormat が必要（HH:mm 形式のパースに使用）
dayjs.extend(customParseFormat);

// ---------------------------------------------------------------------------
// Module mocks (must come before any imports that use them, hoisted by Jest)
// ---------------------------------------------------------------------------

jest.mock("@app/hooks", () => ({
  useAppDispatchV2: jest.fn(),
}));

jest.mock("@features/admin/configManagement/lib/validation", () => ({
  validateAdminConfigForm: jest.fn(),
}));

jest.mock("@features/admin/configManagement/lib/payloadHelpers", () => ({
  buildCreatePayload: jest.fn(),
  buildUpdatePayload: jest.fn(),
}));

jest.mock("@/errors", () => ({
  E14001: "E14001",
  S14001: "S14001",
  S14002: "S14002",
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockDispatch = jest.fn();
const mockSaveConfig = jest.fn();
const mockFetchConfig = jest.fn();

const createContextValue = (overrides: Record<string, unknown> = {}) => ({
  fetchConfig: mockFetchConfig,
  saveConfig: mockSaveConfig,
  getStartTime: jest.fn().mockReturnValue(dayjs("09:00", "HH:mm")),
  getEndTime: jest.fn().mockReturnValue(dayjs("18:00", "HH:mm")),
  getConfigId: jest.fn().mockReturnValue("config-1"),
  getLinks: jest.fn().mockReturnValue([]),
  getReasons: jest.fn().mockReturnValue([]),
  getOfficeMode: jest.fn().mockReturnValue(false),
  getQuickInputStartTimes: jest.fn().mockReturnValue([]),
  getQuickInputEndTimes: jest.fn().mockReturnValue([]),
  getLunchRestStartTime: jest.fn().mockReturnValue(dayjs("12:00", "HH:mm")),
  getLunchRestEndTime: jest.fn().mockReturnValue(dayjs("13:00", "HH:mm")),
  getHourlyPaidHolidayEnabled: jest.fn().mockReturnValue(false),
  getAmHolidayStartTime: jest.fn().mockReturnValue(null),
  getAmHolidayEndTime: jest.fn().mockReturnValue(null),
  getPmHolidayStartTime: jest.fn().mockReturnValue(null),
  getPmHolidayEndTime: jest.fn().mockReturnValue(null),
  getAmPmHolidayEnabled: jest.fn().mockReturnValue(true),
  getSpecialHolidayEnabled: jest.fn().mockReturnValue(false),
  getAbsentEnabled: jest.fn().mockReturnValue(false),
  getAttendanceStatisticsEnabled: jest.fn().mockReturnValue(false),
  getWorkflowNotificationEnabled: jest.fn().mockReturnValue(false),
  getTimeRecorderAnnouncement: jest
    .fn()
    .mockReturnValue({ enabled: false, message: "" }),
  getOverTimeCheckEnabled: jest.fn().mockReturnValue(false),
  getShiftCollaborativeEnabled: jest.fn().mockReturnValue(false),
  getShiftDefaultMode: jest.fn().mockReturnValue("normal"),
  getThemeTokens: jest
    .fn()
    .mockReturnValue({ component: { adminPanel: { sectionSpacing: 2 } } }),
  ...overrides,
});

const buildWrapper = (contextValue: ReturnType<typeof createContextValue>) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      AppConfigContext.Provider,
      {
        value: contextValue as unknown as React.ContextType<
          typeof AppConfigContext
        >,
      },
      children,
    );
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
};

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  (useAppDispatchV2 as jest.Mock).mockReturnValue(mockDispatch);
  (validateAdminConfigForm as jest.Mock).mockReturnValue({ isValid: true });
  (buildCreatePayload as jest.Mock).mockReturnValue({ type: "create" });
  (buildUpdatePayload as jest.Mock).mockReturnValue({ type: "update" });
  mockSaveConfig.mockResolvedValue(undefined);
  mockFetchConfig.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAdminConfigForm", () => {
  // -------------------------------------------------------------------------
  // 1. hydrateFromContext on mount
  // -------------------------------------------------------------------------
  describe("hydrateFromContext on mount", () => {
    it("startTime と endTime がコンテキストの値で初期化される", async () => {
      const ctx = createContextValue();
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() => {
        expect(result.current.startTime?.format("HH:mm")).toBe("09:00");
        expect(result.current.endTime?.format("HH:mm")).toBe("18:00");
      });
    });

    it("links / reasons / officeMode がコンテキストの値で初期化される", async () => {
      const ctx = createContextValue({
        getLinks: jest
          .fn()
          .mockReturnValue([
            { label: "Link A", url: "https://a.com", enabled: true, icon: "" },
          ]),
        getReasons: jest
          .fn()
          .mockReturnValue([{ reason: "reason1", enabled: true }]),
        getOfficeMode: jest.fn().mockReturnValue(true),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() => {
        expect(result.current.links).toHaveLength(1);
        expect(result.current.links[0].label).toBe("Link A");
        expect(result.current.reasons[0].reason).toBe("reason1");
        expect(result.current.officeMode).toBe(true);
      });
    });

    it("quickInputStartTimes がコンテキストの値で初期化される", async () => {
      const ctx = createContextValue({
        getQuickInputStartTimes: jest.fn().mockReturnValue([
          { time: "09:00", enabled: true },
          { time: "10:00", enabled: false },
        ]),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() => {
        expect(result.current.quickInputStartTimes).toHaveLength(2);
        expect(result.current.quickInputStartTimes[0].enabled).toBe(true);
        expect(result.current.quickInputStartTimes[1].enabled).toBe(false);
      });
    });

    it("getConfigId が null を返すとき id は null のまま", async () => {
      const ctx = createContextValue({
        getConfigId: jest.fn().mockReturnValue(null),
      });
      const { result: _result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() => {
        // id は内部状態なので handleSave の分岐で間接的に確認する
        expect(ctx.getConfigId).toHaveBeenCalled();
      });
    });

    it("getAmHolidayStartTime が Dayjs を返すとき amHolidayStartTime に反映される", async () => {
      const customTime = dayjs("09:30", "HH:mm");
      const ctx = createContextValue({
        getAmHolidayStartTime: jest.fn().mockReturnValue(customTime),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() => {
        expect(result.current.amHolidayStartTime?.format("HH:mm")).toBe(
          "09:30",
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // 2. Link handlers
  // -------------------------------------------------------------------------
  describe("handleAddLink", () => {
    it("空の新しいリンクを追加する", async () => {
      const ctx = createContextValue();
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      act(() => {
        result.current.handleAddLink();
      });

      expect(result.current.links).toHaveLength(1);
      expect(result.current.links[0]).toEqual({
        label: "",
        url: "",
        enabled: true,
        icon: "",
      });
    });
  });

  describe("handleLinkChange", () => {
    it("指定インデックスのリンクフィールドを更新する", async () => {
      const ctx = createContextValue({
        getLinks: jest
          .fn()
          .mockReturnValue([
            { label: "old", url: "", enabled: true, icon: "" },
          ]),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() => expect(result.current.links).toHaveLength(1));

      act(() => {
        result.current.handleLinkChange(0, "label", "new label");
      });

      expect(result.current.links[0].label).toBe("new label");
    });
  });

  describe("handleRemoveLink", () => {
    it("指定インデックスのリンクを削除する", async () => {
      const ctx = createContextValue({
        getLinks: jest.fn().mockReturnValue([
          { label: "A", url: "", enabled: true, icon: "" },
          { label: "B", url: "", enabled: true, icon: "" },
        ]),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() => expect(result.current.links).toHaveLength(2));

      act(() => {
        result.current.handleRemoveLink(0);
      });

      expect(result.current.links).toHaveLength(1);
      expect(result.current.links[0].label).toBe("B");
    });
  });

  // -------------------------------------------------------------------------
  // 3. Reason handlers
  // -------------------------------------------------------------------------
  describe("handleAddReason", () => {
    it("空の新しい理由を追加する", () => {
      const ctx = createContextValue();
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      act(() => {
        result.current.handleAddReason();
      });

      expect(result.current.reasons).toHaveLength(1);
      expect(result.current.reasons[0]).toEqual({ reason: "", enabled: true });
    });
  });

  describe("handleReasonChange", () => {
    it("指定インデックスの理由フィールドを更新する", async () => {
      const ctx = createContextValue({
        getReasons: jest
          .fn()
          .mockReturnValue([{ reason: "old reason", enabled: true }]),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() => expect(result.current.reasons).toHaveLength(1));

      act(() => {
        result.current.handleReasonChange(0, "reason", "new reason");
      });

      expect(result.current.reasons[0].reason).toBe("new reason");
    });
  });

  describe("handleRemoveReason", () => {
    it("指定インデックスの理由を削除する", async () => {
      const ctx = createContextValue({
        getReasons: jest.fn().mockReturnValue([
          { reason: "R1", enabled: true },
          { reason: "R2", enabled: true },
        ]),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() => expect(result.current.reasons).toHaveLength(2));

      act(() => {
        result.current.handleRemoveReason(1);
      });

      expect(result.current.reasons).toHaveLength(1);
      expect(result.current.reasons[0].reason).toBe("R1");
    });
  });

  // -------------------------------------------------------------------------
  // 4. officeMode handler
  // -------------------------------------------------------------------------
  describe("handleOfficeModeChange", () => {
    it("チェックボックスの checked 値で officeMode を更新する", () => {
      const ctx = createContextValue();
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      act(() => {
        result.current.handleOfficeModeChange({
          target: { checked: true },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.officeMode).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 5. QuickInput start time handlers
  // -------------------------------------------------------------------------
  describe("handleAddQuickInputStartTime", () => {
    it("新しいクイック入力開始時間エントリを追加する", () => {
      const ctx = createContextValue();
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      act(() => {
        result.current.handleAddQuickInputStartTime();
      });

      expect(result.current.quickInputStartTimes).toHaveLength(1);
      expect(result.current.quickInputStartTimes[0].enabled).toBe(true);
    });
  });

  describe("handleQuickInputStartTimeChange", () => {
    it("指定インデックスの時間を更新する", async () => {
      const ctx = createContextValue({
        getQuickInputStartTimes: jest
          .fn()
          .mockReturnValue([{ time: "09:00", enabled: true }]),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() =>
        expect(result.current.quickInputStartTimes).toHaveLength(1),
      );

      const newTime = dayjs("10:30", "HH:mm");
      act(() => {
        result.current.handleQuickInputStartTimeChange(0, newTime);
      });

      expect(result.current.quickInputStartTimes[0].time.format("HH:mm")).toBe(
        "10:30",
      );
    });

    it("null の場合は変更しない", async () => {
      const ctx = createContextValue({
        getQuickInputStartTimes: jest
          .fn()
          .mockReturnValue([{ time: "09:00", enabled: true }]),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() =>
        expect(result.current.quickInputStartTimes).toHaveLength(1),
      );
      const originalTime = result.current.quickInputStartTimes[0].time;

      act(() => {
        result.current.handleQuickInputStartTimeChange(0, null);
      });

      expect(result.current.quickInputStartTimes[0].time).toBe(originalTime);
    });
  });

  describe("handleQuickInputStartTimeToggle", () => {
    it("指定インデックスの enabled を切り替える", async () => {
      const ctx = createContextValue({
        getQuickInputStartTimes: jest
          .fn()
          .mockReturnValue([{ time: "09:00", enabled: true }]),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() =>
        expect(result.current.quickInputStartTimes).toHaveLength(1),
      );

      act(() => {
        result.current.handleQuickInputStartTimeToggle(0);
      });

      expect(result.current.quickInputStartTimes[0].enabled).toBe(false);
    });
  });

  describe("handleRemoveQuickInputStartTime", () => {
    it("指定インデックスのエントリを削除する", async () => {
      const ctx = createContextValue({
        getQuickInputStartTimes: jest.fn().mockReturnValue([
          { time: "09:00", enabled: true },
          { time: "10:00", enabled: true },
        ]),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() =>
        expect(result.current.quickInputStartTimes).toHaveLength(2),
      );

      act(() => {
        result.current.handleRemoveQuickInputStartTime(0);
      });

      expect(result.current.quickInputStartTimes).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Shift handlers
  // -------------------------------------------------------------------------
  describe("handleShiftCollaborativeEnabledChange", () => {
    it("false に変更すると shiftDefaultMode が 'normal' にリセットされる", async () => {
      const ctx = createContextValue({
        getShiftCollaborativeEnabled: jest.fn().mockReturnValue(true),
        getShiftDefaultMode: jest.fn().mockReturnValue("collaborative"),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      // まず個人モードに設定されていることを確認
      await waitFor(() => {
        expect(result.current.shiftDefaultMode).toBe("collaborative");
        expect(result.current.shiftCollaborativeEnabled).toBe(true);
      });

      act(() => {
        result.current.handleShiftCollaborativeEnabledChange({
          target: { checked: false },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.shiftCollaborativeEnabled).toBe(false);
      expect(result.current.shiftDefaultMode).toBe("normal");
    });

    it("true に変更しても shiftDefaultMode はリセットされない", async () => {
      const ctx = createContextValue({
        getShiftCollaborativeEnabled: jest.fn().mockReturnValue(false),
        getShiftDefaultMode: jest.fn().mockReturnValue("collaborative"),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() =>
        expect(result.current.shiftCollaborativeEnabled).toBe(false),
      );

      act(() => {
        result.current.handleShiftCollaborativeEnabledChange({
          target: { checked: true },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.shiftCollaborativeEnabled).toBe(true);
      // shiftDefaultMode は変更前の値が保持される
      expect(result.current.shiftDefaultMode).toBe("collaborative");
    });
  });

  describe("handleShiftDefaultModeChange", () => {
    it("shiftDefaultMode を指定値に更新する", () => {
      const ctx = createContextValue();
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      act(() => {
        result.current.handleShiftDefaultModeChange("collaborative");
      });

      expect(result.current.shiftDefaultMode).toBe("collaborative");
    });
  });

  // -------------------------------------------------------------------------
  // 7. handleSave scenarios
  // -------------------------------------------------------------------------
  describe("handleSave", () => {
    it("バリデーション失敗時: エラー通知を dispatch してリターンする", async () => {
      (validateAdminConfigForm as jest.Mock).mockReturnValue({
        isValid: false,
        errorMessage: "入力エラー",
      });

      const ctx = createContextValue();
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ tone: "error" }),
        }),
      );
      expect(mockSaveConfig).not.toHaveBeenCalled();
    });

    it("id なし (create) : buildCreatePayload を呼び saveConfig + S14001 通知 + fetchConfig を実行する", async () => {
      const ctx = createContextValue({
        getConfigId: jest.fn().mockReturnValue(null),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() => expect(ctx.getConfigId).toHaveBeenCalled());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(buildCreatePayload).toHaveBeenCalled();
      expect(buildUpdatePayload).not.toHaveBeenCalled();
      expect(mockSaveConfig).toHaveBeenCalledWith({ type: "create" });
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            tone: "success",
            message: "S14001",
          }),
        }),
      );
      expect(mockFetchConfig).toHaveBeenCalled();
    });

    it("id あり (update) : buildUpdatePayload を呼び saveConfig + S14002 通知 + fetchConfig を実行する", async () => {
      const ctx = createContextValue({
        getConfigId: jest.fn().mockReturnValue("config-1"),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() => expect(ctx.getConfigId).toHaveBeenCalled());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(buildUpdatePayload).toHaveBeenCalled();
      expect(buildCreatePayload).not.toHaveBeenCalled();
      expect(mockSaveConfig).toHaveBeenCalledWith({ type: "update" });
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            tone: "success",
            message: "S14002",
          }),
        }),
      );
      expect(mockFetchConfig).toHaveBeenCalled();
    });

    it("saveConfig が例外を投げた場合: E14001 エラー通知を dispatch する", async () => {
      mockSaveConfig.mockRejectedValue(new Error("network error"));
      const ctx = createContextValue();
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      await waitFor(() => expect(ctx.getConfigId).toHaveBeenCalled());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            tone: "error",
            message: "E14001",
          }),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // 8. sectionSpacing from theme tokens
  // -------------------------------------------------------------------------
  describe("sectionSpacing", () => {
    it("コンテキストの getThemeTokens から sectionSpacing を取得する", () => {
      const ctx = createContextValue({
        getThemeTokens: jest.fn().mockReturnValue({
          component: { adminPanel: { sectionSpacing: 16 } },
        }),
      });
      const { result } = renderHook(() => useAdminConfigForm(), {
        wrapper: buildWrapper(ctx),
      });

      expect(result.current.sectionSpacing).toBe(16);
    });
  });
});
