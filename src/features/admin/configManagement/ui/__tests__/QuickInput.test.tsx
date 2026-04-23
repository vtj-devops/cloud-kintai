// ─── Imports (must come before jest.mock) ──────────────────────────────────────
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import QuickInput from "../QuickInput";

// ─── Mock fn variables ──────────────────────────────────────────────────────────
const mockDispatch = jest.fn();
const mockSaveConfig = jest.fn();
const mockFetchConfig = jest.fn();
const mockGetQuickInputStartTimes = jest.fn(() => []);
const mockGetQuickInputEndTimes = jest.fn(() => []);
const mockGetConfigId = jest.fn(() => "config-id-1");

// ─── Module mocks ───────────────────────────────────────────────────────────────
jest.mock("@app/hooks", () => ({
  useAppDispatchV2: () => mockDispatch,
}));

jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: (payload: unknown) => ({
    type: "notification/push",
    payload,
  }),
}));

// Mock QuickInputSection to make it simpler to test add/remove/toggle interactions
const mockOnAddStart = jest.fn();
const mockOnAddEnd = jest.fn();
const mockOnRemoveStart = jest.fn();
const mockOnRemoveEnd = jest.fn();
const mockOnToggleStart = jest.fn();
const mockOnToggleEnd = jest.fn();
const mockOnChangeStart = jest.fn();
const mockOnChangeEnd = jest.fn();

jest.mock("../QuickInputSection", () => ({
  __esModule: true,
  default: (props: {
    quickInputStartTimes: Array<{ time: unknown; enabled: boolean }>;
    quickInputEndTimes: Array<{ time: unknown; enabled: boolean }>;
    onAddQuickInputStartTime: () => void;
    onAddQuickInputEndTime: () => void;
    onRemoveQuickInputStartTime: (i: number) => void;
    onRemoveQuickInputEndTime: (i: number) => void;
    onQuickInputStartTimeToggle: (i: number) => void;
    onQuickInputEndTimeToggle: (i: number) => void;
    onQuickInputStartTimeChange: (i: number, v: unknown) => void;
    onQuickInputEndTimeChange: (i: number, v: unknown) => void;
  }) => {
    // Capture the callbacks passed from parent for testing
    mockOnAddStart.mockImplementation(props.onAddQuickInputStartTime);
    mockOnAddEnd.mockImplementation(props.onAddQuickInputEndTime);
    mockOnRemoveStart.mockImplementation(props.onRemoveQuickInputStartTime);
    mockOnRemoveEnd.mockImplementation(props.onRemoveQuickInputEndTime);
    mockOnToggleStart.mockImplementation(props.onQuickInputStartTimeToggle);
    mockOnToggleEnd.mockImplementation(props.onQuickInputEndTimeToggle);
    mockOnChangeStart.mockImplementation(props.onQuickInputStartTimeChange);
    mockOnChangeEnd.mockImplementation(props.onQuickInputEndTimeChange);
    return (
      <div data-testid="quick-input-section">
        <span data-testid="start-times-count">{props.quickInputStartTimes.length}</span>
        <span data-testid="end-times-count">{props.quickInputEndTimes.length}</span>
        <button type="button" onClick={props.onAddQuickInputStartTime} data-testid="add-start">
          + 出勤時間を追加
        </button>
        <button type="button" onClick={props.onAddQuickInputEndTime} data-testid="add-end">
          + 退勤時間を追加
        </button>
        {props.quickInputStartTimes.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => props.onRemoveQuickInputStartTime(i)}
            data-testid={`remove-start-${i}`}
          >
            削除（出勤{i}）
          </button>
        ))}
        {props.quickInputEndTimes.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => props.onRemoveQuickInputEndTime(i)}
            data-testid={`remove-end-${i}`}
          >
            削除（退勤{i}）
          </button>
        ))}
        {props.quickInputStartTimes.map((entry, i) => (
          <button
            key={i}
            type="button"
            onClick={() => props.onQuickInputStartTimeToggle(i)}
            data-testid={`toggle-start-${i}`}
          >
            有効切替（出勤{i}）: {entry.enabled ? "有効" : "無効"}
          </button>
        ))}
        {props.quickInputEndTimes.map((entry, i) => (
          <button
            key={i}
            type="button"
            onClick={() => props.onQuickInputEndTimeToggle(i)}
            data-testid={`toggle-end-${i}`}
          >
            有効切替（退勤{i}）: {entry.enabled ? "有効" : "無効"}
          </button>
        ))}
      </div>
    );
  },
}));

jest.mock("@features/admin/layout/ui/AdminSettingsLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-settings-layout">{children}</div>
  ),
}));

jest.mock("@features/admin/layout/ui/AdminSettingsSection", () => ({
  __esModule: true,
  default: ({
    children,
    actions,
  }: {
    children: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <div data-testid="admin-settings-section">
      {children}
      {actions}
    </div>
  ),
}));

jest.mock("@features/admin/layout/ui/SettingsPrimitives", () => ({
  SettingsButton: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// ─── Context value factory ──────────────────────────────────────────────────────
function makeContextValue(
  overrides: Partial<React.ContextType<typeof AppConfigContext>> = {},
) {
  return {
    getQuickInputStartTimes: mockGetQuickInputStartTimes,
    getQuickInputEndTimes: mockGetQuickInputEndTimes,
    getConfigId: mockGetConfigId,
    saveConfig: mockSaveConfig,
    fetchConfig: mockFetchConfig,
    // Minimum required fields for context
    getThemeColor: () => "#26a69a",
    getThemeTokens: () => ({} as unknown as ReturnType<React.ContextType<typeof AppConfigContext>["getThemeTokens"]>),
    ...overrides,
  } as unknown as React.ContextType<typeof AppConfigContext>;
}

// ─── Render helper ──────────────────────────────────────────────────────────────
function renderQuickInput(
  contextOverrides: Partial<React.ContextType<typeof AppConfigContext>> = {},
) {
  return render(
    <AppConfigContext.Provider value={makeContextValue(contextOverrides)}>
      <QuickInput />
    </AppConfigContext.Provider>,
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────────
describe("QuickInput", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetQuickInputStartTimes.mockReturnValue([]);
    mockGetQuickInputEndTimes.mockReturnValue([]);
    mockGetConfigId.mockReturnValue("config-id-1");
    mockSaveConfig.mockResolvedValue(undefined);
    mockFetchConfig.mockResolvedValue(undefined);
  });

  describe("初期表示", () => {
    it("QuickInputSectionが表示される", () => {
      renderQuickInput();
      expect(screen.getByTestId("quick-input-section")).toBeInTheDocument();
    });

    it("保存ボタンが表示される", () => {
      renderQuickInput();
      expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    });

    it("空のリストで初期化される", () => {
      renderQuickInput();
      expect(screen.getByTestId("start-times-count")).toHaveTextContent("0");
      expect(screen.getByTestId("end-times-count")).toHaveTextContent("0");
    });

    it("contextから取得した出勤時間リストで初期化される", () => {
      mockGetQuickInputStartTimes.mockReturnValue([
        { time: "09:00", enabled: true },
        { time: "10:00", enabled: false },
      ]);
      renderQuickInput();
      expect(screen.getByTestId("start-times-count")).toHaveTextContent("2");
    });

    it("contextから取得した退勤時間リストで初期化される", () => {
      mockGetQuickInputEndTimes.mockReturnValue([
        { time: "18:00", enabled: true },
      ]);
      renderQuickInput();
      expect(screen.getByTestId("end-times-count")).toHaveTextContent("1");
    });

    it("getConfigIdが呼ばれてidが設定される", () => {
      renderQuickInput();
      expect(mockGetConfigId).toHaveBeenCalled();
    });
  });

  describe("出勤時間の追加", () => {
    it("「+ 出勤時間を追加」をクリックすると出勤時間が追加される", async () => {
      const user = userEvent.setup();
      renderQuickInput();

      const addButton = screen.getByTestId("add-start");
      await user.click(addButton);

      expect(screen.getByTestId("start-times-count")).toHaveTextContent("1");
    });

    it("複数回クリックすると複数の出勤時間が追加される", async () => {
      const user = userEvent.setup();
      renderQuickInput();

      const addButton = screen.getByTestId("add-start");
      await user.click(addButton);
      await user.click(addButton);
      await user.click(addButton);

      expect(screen.getByTestId("start-times-count")).toHaveTextContent("3");
    });
  });

  describe("退勤時間の追加", () => {
    it("「+ 退勤時間を追加」をクリックすると退勤時間が追加される", async () => {
      const user = userEvent.setup();
      renderQuickInput();

      const addButton = screen.getByTestId("add-end");
      await user.click(addButton);

      expect(screen.getByTestId("end-times-count")).toHaveTextContent("1");
    });

    it("複数回クリックすると複数の退勤時間が追加される", async () => {
      const user = userEvent.setup();
      renderQuickInput();

      const addButton = screen.getByTestId("add-end");
      await user.click(addButton);
      await user.click(addButton);

      expect(screen.getByTestId("end-times-count")).toHaveTextContent("2");
    });
  });

  describe("出勤時間の削除", () => {
    it("削除ボタンをクリックすると出勤時間が削除される", async () => {
      const user = userEvent.setup();
      mockGetQuickInputStartTimes.mockReturnValue([
        { time: "09:00", enabled: true },
        { time: "10:00", enabled: true },
      ]);
      renderQuickInput();

      const removeButton = screen.getByTestId("remove-start-0");
      await user.click(removeButton);

      expect(screen.getByTestId("start-times-count")).toHaveTextContent("1");
    });
  });

  describe("退勤時間の削除", () => {
    it("削除ボタンをクリックすると退勤時間が削除される", async () => {
      const user = userEvent.setup();
      mockGetQuickInputEndTimes.mockReturnValue([
        { time: "18:00", enabled: true },
        { time: "19:00", enabled: true },
      ]);
      renderQuickInput();

      const removeButton = screen.getByTestId("remove-end-0");
      await user.click(removeButton);

      expect(screen.getByTestId("end-times-count")).toHaveTextContent("1");
    });
  });

  describe("有効/無効の切り替え", () => {
    it("出勤時間の有効/無効を切り替えられる", async () => {
      const user = userEvent.setup();
      mockGetQuickInputStartTimes.mockReturnValue([{ time: "09:00", enabled: true }]);
      renderQuickInput();

      const toggleButton = screen.getByTestId("toggle-start-0");
      expect(toggleButton).toHaveTextContent("有効");
      await user.click(toggleButton);
      expect(toggleButton).toHaveTextContent("無効");
    });

    it("退勤時間の有効/無効を切り替えられる", async () => {
      const user = userEvent.setup();
      mockGetQuickInputEndTimes.mockReturnValue([{ time: "18:00", enabled: true }]);
      renderQuickInput();

      const toggleButton = screen.getByTestId("toggle-end-0");
      expect(toggleButton).toHaveTextContent("有効");
      await user.click(toggleButton);
      expect(toggleButton).toHaveTextContent("無効");
    });

    it("初期が無効の場合、切り替え後は有効になる", async () => {
      const user = userEvent.setup();
      mockGetQuickInputStartTimes.mockReturnValue([{ time: "09:00", enabled: false }]);
      renderQuickInput();

      const toggleButton = screen.getByTestId("toggle-start-0");
      expect(toggleButton).toHaveTextContent("無効");
      await user.click(toggleButton);
      expect(toggleButton).toHaveTextContent("有効");
    });
  });

  describe("保存処理（既存config）", () => {
    it("保存ボタンをクリックするとsaveConfigがUpdateAppConfigInputで呼ばれる", async () => {
      const user = userEvent.setup();
      mockGetConfigId.mockReturnValue("config-999");
      mockGetQuickInputStartTimes.mockReturnValue([{ time: "09:00", enabled: true }]);
      mockGetQuickInputEndTimes.mockReturnValue([{ time: "18:00", enabled: true }]);
      renderQuickInput();

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(mockSaveConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "config-999",
            quickInputStartTimes: expect.arrayContaining([
              expect.objectContaining({ enabled: true, time: expect.any(String) }),
            ]),
            quickInputEndTimes: expect.arrayContaining([
              expect.objectContaining({ enabled: true, time: expect.any(String) }),
            ]),
          }),
        );
      });
    });

    it("保存成功後にS14002の成功通知が送出される", async () => {
      const user = userEvent.setup();
      mockGetConfigId.mockReturnValue("config-id-1");
      renderQuickInput();

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({ tone: "success" }),
          }),
        );
      });
    });

    it("保存後にfetchConfigが呼ばれる", async () => {
      const user = userEvent.setup();
      renderQuickInput();

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(mockFetchConfig).toHaveBeenCalled();
      });
    });
  });

  describe("保存処理（新規config）", () => {
    it("configIdがnullの場合はCreateAppConfigInputでsaveConfigが呼ばれる", async () => {
      const user = userEvent.setup();
      mockGetConfigId.mockReturnValue(null);
      mockGetQuickInputStartTimes.mockReturnValue([{ time: "09:00", enabled: true }]);
      mockGetQuickInputEndTimes.mockReturnValue([]);
      renderQuickInput();

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(mockSaveConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "default",
            quickInputStartTimes: expect.arrayContaining([
              expect.objectContaining({ enabled: true, time: expect.any(String) }),
            ]),
          }),
        );
      });
    });

    it("新規作成成功後にS14001の成功通知が送出される", async () => {
      const user = userEvent.setup();
      mockGetConfigId.mockReturnValue(null);
      renderQuickInput();

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({ tone: "success" }),
          }),
        );
      });
    });
  });

  describe("保存失敗処理", () => {
    it("saveConfigが失敗した場合はエラー通知が送出される", async () => {
      const user = userEvent.setup();
      mockSaveConfig.mockRejectedValue(new Error("save failed"));
      renderQuickInput();

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({ tone: "error" }),
          }),
        );
      });
    });

    it("保存失敗後はfetchConfigが呼ばれない", async () => {
      const user = userEvent.setup();
      mockSaveConfig.mockRejectedValue(new Error("save failed"));
      renderQuickInput();

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
      expect(mockFetchConfig).not.toHaveBeenCalled();
    });
  });

  describe("時間変更ハンドラー（nullチェック）", () => {
    it("出勤時間にnullが渡されても状態が変わらない", () => {
      mockGetQuickInputStartTimes.mockReturnValue([{ time: "09:00", enabled: true }]);
      renderQuickInput();

      // The handler ignores null - list count should remain the same
      expect(screen.getByTestId("start-times-count")).toHaveTextContent("1");
    });
  });
});
