import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import type { ShiftDisplayMode } from "@entities/app-config/model/useAppConfig";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";

import { useAdminShiftSettings } from "../useAdminShiftSettings";

// ─── Mock: react-redux dispatch ──────────────────────────────────────────────

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

// ─── Mock: notificationSlice ─────────────────────────────────────────────────

jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: jest.fn((payload) => ({
    type: "notification/push",
    payload,
  })),
}));

// ─── Mock: AdminShiftSettings helpers ────────────────────────────────────────

jest.mock("@/pages/admin/AdminShiftSettings", () => ({
  buildShiftGroupPayload: jest.fn((groups: unknown[]) =>
    groups.map((g: unknown) => g),
  ),
  createShiftGroup: jest.fn(() => ({
    id: "sg-new",
    label: "",
    description: "",
    min: "",
    max: "",
    fixed: "",
  })),
}));

jest.mock("@/pages/admin/AdminShiftSettings/shiftGroupFactory", () => ({
  toShiftGroupFormValue: jest.fn((group: { label?: string }) => ({
    id: "sg-1",
    label: group.label ?? "",
    description: "",
    min: "",
    max: "",
    fixed: "",
  })),
}));

// ─── Default AppConfigContext mock values ─────────────────────────────────────

const makeMockContext = (overrides: Partial<{
  shiftGroups: { label: string; min?: number; max?: number; fixed?: number; description?: string }[];
  configId: string | null;
  shiftDefaultMode: ShiftDisplayMode;
  saveConfig: jest.Mock;
  fetchConfig: jest.Mock;
}> = {}) => {
  const {
    shiftGroups = [],
    configId = "config-123",
    shiftDefaultMode = "normal" as ShiftDisplayMode,
    saveConfig = jest.fn().mockResolvedValue(undefined),
    fetchConfig = jest.fn().mockResolvedValue(undefined),
  } = overrides;

  return {
    getShiftGroups: jest.fn().mockReturnValue(shiftGroups),
    getConfigId: jest.fn().mockReturnValue(configId),
    getShiftDefaultMode: jest.fn().mockReturnValue(shiftDefaultMode),
    saveConfig,
    fetchConfig,
    // Other required context fields (no-op defaults)
    getWorkStartTime: jest.fn(),
    getWorkEndTime: jest.fn(),
    getLunchRestStartTime: jest.fn(),
    getLunchRestEndTime: jest.fn(),
    getOfficeMode: jest.fn(),
    getLinks: jest.fn(),
    getReasons: jest.fn(),
    getQuickInputStartTimes: jest.fn(),
    getQuickInputEndTimes: jest.fn(),
    getThemeColor: jest.fn(),
    getAttendanceStatisticsEnabled: jest.fn(),
    getWorkflowNotificationEnabled: jest.fn(),
    getTimeRecorderAnnouncement: jest.fn(),
    getShiftCollaborativeEnabled: jest.fn(),
    getOverTimeCheckEnabled: jest.fn(),
    getHourlyPaidHolidayEnabled: jest.fn(),
    getAmPmHolidayEnabled: jest.fn(),
    getSpecialHolidayEnabled: jest.fn(),
    getAbsentEnabled: jest.fn(),
    getWorkflowCategoryOrder: jest.fn(),
    getAmHolidayStartTime: jest.fn(),
    getAmHolidayEndTime: jest.fn(),
    getPmHolidayStartTime: jest.fn(),
    getPmHolidayEndTime: jest.fn(),
    getDesignTokens: jest.fn(),
    refetchConfig: jest.fn(),
  } as unknown as React.ContextType<typeof AppConfigContext>;
};

const createWrapper = (contextValue: React.ContextType<typeof AppConfigContext>) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(AppConfigContext.Provider, { value: contextValue }, children);
  Wrapper.displayName = "AppConfigWrapper";
  return Wrapper;
};

describe("useAdminShiftSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockReturnValue(undefined);
  });

  // ─── 初期化 ──────────────────────────────────────────────────────────────

  describe("初期化", () => {
    it("初期状態で空のフィールドリストを返す", async () => {
      const ctx = makeMockContext();
      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => {
        expect(result.current.fields).toBeDefined();
      });

      expect(result.current.fields).toHaveLength(0);
    });

    it("既存のシフトグループを読み込んでフォームに反映する", async () => {
      const ctx = makeMockContext({
        shiftGroups: [{ label: "早番", min: 1, max: 3 }],
      });

      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => {
        expect(ctx.getShiftGroups).toHaveBeenCalled();
      });

      expect(result.current.fields).toHaveLength(1);
    });

    it("configId を正しく読み込む", async () => {
      const ctx = makeMockContext({ configId: "my-config-id" });

      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => {
        expect(result.current.fields).toBeDefined();
      });

      // handleSaveShiftGroup を実行した時に configId が使われることを間接的に確認
      expect(ctx.getConfigId).toHaveBeenCalled();
    });

    it("shiftDefaultMode を初期値として読み込む", async () => {
      const ctx = makeMockContext({ shiftDefaultMode: "collaborative" });

      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => {
        expect(result.current.shiftDefaultMode).toBe("collaborative");
      });
    });

    it("isDirty が初期状態では false である", async () => {
      const ctx = makeMockContext();
      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(false);
      });
    });

    it("isBusy が初期状態では false である", async () => {
      const ctx = makeMockContext();
      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => {
        expect(result.current.isBusy).toBe(false);
      });
    });
  });

  // ─── handleAddGroup ─────────────────────────────────────────────────────

  describe("handleAddGroup", () => {
    it("グループを追加するとフィールドが増える", async () => {
      const ctx = makeMockContext();
      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => {
        expect(result.current.fields).toHaveLength(0);
      });

      act(() => {
        result.current.handleAddGroup();
      });

      await waitFor(() => {
        expect(result.current.fields).toHaveLength(1);
      });
    });

    it("複数回追加するとその分フィールドが増える", async () => {
      const ctx = makeMockContext();
      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => {
        expect(result.current.fields).toHaveLength(0);
      });

      act(() => {
        result.current.handleAddGroup();
        result.current.handleAddGroup();
      });

      await waitFor(() => {
        expect(result.current.fields).toHaveLength(2);
      });
    });
  });

  // ─── handleRemoveGroup ──────────────────────────────────────────────────

  describe("handleRemoveGroup", () => {
    it("グループを削除するとフィールドが減る", async () => {
      const ctx = makeMockContext({
        shiftGroups: [{ label: "早番" }],
      });
      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => {
        expect(result.current.fields).toHaveLength(1);
      });

      act(() => {
        result.current.handleRemoveGroup(0);
      });

      await waitFor(() => {
        expect(result.current.fields).toHaveLength(0);
      });
    });
  });

  // ─── handleSaveShiftGroup ───────────────────────────────────────────────

  describe("handleSaveShiftGroup", () => {
    it("configId がある場合に updateAppConfig を呼ぶ", async () => {
      const saveConfig = jest.fn().mockResolvedValue(undefined);
      const fetchConfig = jest.fn().mockResolvedValue(undefined);
      const ctx = makeMockContext({
        configId: "config-123",
        saveConfig,
        fetchConfig,
      });

      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => expect(result.current.isBusy).toBe(false));

      await act(async () => {
        await result.current.handleSaveShiftGroup(new Event("submit") as unknown as React.BaseSyntheticEvent);
      });

      await waitFor(() => expect(result.current.isBusy).toBe(false));

      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({ id: "config-123" }),
      );
      expect(fetchConfig).toHaveBeenCalled();
    });

    it("configId が null の場合に createAppConfig を呼ぶ", async () => {
      const saveConfig = jest.fn().mockResolvedValue(undefined);
      const fetchConfig = jest.fn().mockResolvedValue(undefined);
      const ctx = makeMockContext({
        configId: null,
        saveConfig,
        fetchConfig,
      });

      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => expect(result.current.isBusy).toBe(false));

      await act(async () => {
        await result.current.handleSaveShiftGroup(new Event("submit") as unknown as React.BaseSyntheticEvent);
      });

      await waitFor(() => expect(result.current.isBusy).toBe(false));

      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({ name: "default" }),
      );
    });

    it("保存失敗時にエラー通知を dispatch する", async () => {
      const saveConfig = jest.fn().mockRejectedValue(new Error("Save failed"));
      const ctx = makeMockContext({ saveConfig });

      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => expect(result.current.isBusy).toBe(false));

      await act(async () => {
        await result.current.handleSaveShiftGroup(new Event("submit") as unknown as React.BaseSyntheticEvent);
      });

      await waitFor(() => expect(result.current.isBusy).toBe(false));

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "notification/push" }),
      );
      expect(pushNotification).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });

    it("保存中は savingShiftGroup が true になる", async () => {
      let resolveSave!: () => void;
      const saveConfig = jest.fn(
        () => new Promise<void>((resolve) => { resolveSave = resolve; }),
      );
      const ctx = makeMockContext({ saveConfig });

      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => expect(result.current.isBusy).toBe(false));

      act(() => {
        void result.current.handleSaveShiftGroup(new Event("submit") as unknown as React.BaseSyntheticEvent);
      });

      await waitFor(() => expect(result.current.savingShiftGroup).toBe(true));

      act(() => resolveSave());

      await waitFor(() => expect(result.current.savingShiftGroup).toBe(false));
    });
  });

  // ─── setShiftDefaultMode ────────────────────────────────────────────────

  describe("setShiftDefaultMode", () => {
    it("shiftDefaultMode を変更すると isShiftDisplayDirty が true になる", async () => {
      const ctx = makeMockContext({ shiftDefaultMode: "normal" });
      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => expect(result.current.isShiftDisplayDirty).toBe(false));

      act(() => {
        result.current.setShiftDefaultMode("collaborative");
      });

      await waitFor(() => {
        expect(result.current.shiftDefaultMode).toBe("collaborative");
        expect(result.current.isShiftDisplayDirty).toBe(true);
      });
    });

    it("元の値に戻すと isShiftDisplayDirty が false に戻る", async () => {
      const ctx = makeMockContext({ shiftDefaultMode: "normal" });
      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => expect(result.current.isShiftDisplayDirty).toBe(false));

      act(() => {
        result.current.setShiftDefaultMode("collaborative");
      });

      await waitFor(() => expect(result.current.isShiftDisplayDirty).toBe(true));

      act(() => {
        result.current.setShiftDefaultMode("normal");
      });

      await waitFor(() => expect(result.current.isShiftDisplayDirty).toBe(false));
    });
  });

  // ─── auto-save (shiftDisplay) ────────────────────────────────────────────

  describe("シフト表示モード 自動保存", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("shiftDefaultMode 変更後に 600ms で自動保存が実行される", async () => {
      const saveConfig = jest.fn().mockResolvedValue(undefined);
      const fetchConfig = jest.fn().mockResolvedValue(undefined);
      const ctx = makeMockContext({ shiftDefaultMode: "normal", saveConfig, fetchConfig });

      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => expect(result.current.isShiftDisplayDirty).toBe(false));

      act(() => {
        result.current.setShiftDefaultMode("collaborative");
      });

      await waitFor(() => expect(result.current.isShiftDisplayDirty).toBe(true));

      // タイマーを進めて自動保存をトリガー
      await act(async () => {
        jest.advanceTimersByTime(700);
      });

      await waitFor(() => expect(saveConfig).toHaveBeenCalled());
    });

    it("自動保存失敗時にエラー通知を dispatch する", async () => {
      const saveConfig = jest.fn().mockRejectedValue(new Error("auto-save failed"));
      const ctx = makeMockContext({ shiftDefaultMode: "normal", saveConfig });

      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => expect(result.current.isShiftDisplayDirty).toBe(false));

      act(() => {
        result.current.setShiftDefaultMode("collaborative");
      });

      await act(async () => {
        jest.advanceTimersByTime(700);
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({ type: "notification/push" }),
        );
      });
    });
  });

  // ─── hasValidationError ──────────────────────────────────────────────────

  describe("hasValidationError", () => {
    it("バリデーションエラーがない場合は false", async () => {
      const ctx = makeMockContext();
      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => expect(result.current.hasValidationError).toBe(false));
    });
  });

  // ─── 戻り値の構造 ────────────────────────────────────────────────────────

  describe("戻り値の構造", () => {
    it("必要なプロパティがすべて存在する", async () => {
      const ctx = makeMockContext();
      const { result } = renderHook(() => useAdminShiftSettings(), {
        wrapper: createWrapper(ctx),
      });

      await waitFor(() => expect(result.current.fields).toBeDefined());

      expect(result.current).toMatchObject({
        fields: expect.any(Array),
        errors: expect.any(Object),
        validationDetails: expect.any(Array),
        hasValidationError: expect.any(Boolean),
        savingShiftGroup: expect.any(Boolean),
        savingShiftDisplay: expect.any(Boolean),
        isShiftGroupDirty: expect.any(Boolean),
        isShiftDisplayDirty: expect.any(Boolean),
        shiftDefaultMode: expect.any(String),
        isDirty: expect.any(Boolean),
        isBusy: expect.any(Boolean),
        handleAddGroup: expect.any(Function),
        handleRemoveGroup: expect.any(Function),
        handleSaveShiftGroup: expect.any(Function),
        setShiftDefaultMode: expect.any(Function),
      });
    });
  });
});
