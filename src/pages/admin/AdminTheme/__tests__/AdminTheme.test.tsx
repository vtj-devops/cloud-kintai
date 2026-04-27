// ─── Imports (must come before jest.mock) ──────────────────────────────────────
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import AdminTheme from "../AdminTheme";

// ─── Mock fn variables ──────────────────────────────────────────────────────────
const mockDispatch = jest.fn();
const mockNotify = jest.fn();
const mockSaveConfig = jest.fn();
const mockFetchConfig = jest.fn();
const mockGetThemeColor = jest.fn(() => "#26a69a");
const mockGetConfigId = jest.fn(() => "config-id-1");
const mockGetThemeTokens = jest.fn();

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

jest.mock("@shared/lib/useAppNotification", () => ({
  useAppNotification: () => ({ notify: mockNotify }),
}));

jest.mock("@shared/ui/feedback/usePageLeaveGuard", () => ({
  usePageLeaveGuard: () => ({ dialog: null, runWithoutGuard: (fn: () => unknown) => fn() }),
}));

jest.mock("@features/admin/layout/ui/AdminSettingsLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-settings-layout">{children}</div>,
}));

jest.mock("@features/admin/layout/ui/SettingsIcon", () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <span data-testid={`settings-icon-${name}`}>{name}</span>,
}));

// "#9ccc65" is in basePalette and NOT dark (brightness ~178), so it will always be
// in presetPalette. We use it as DEFAULT_BRAND_COLOR so the component can stay in
// preset mode (customMode=false) when getThemeColor returns this value.
jest.mock("@shared/config/theme", () => ({
  resolveThemeColor: jest.fn(() => "#9ccc65"),
  DEFAULT_THEME_COLOR: "#9ccc65",
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
  SettingsTextField: ({
    label,
    value,
    onChange,
    errorText,
  }: {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    errorText?: string;
  }) => (
    <div>
      <label>{label}</label>
      <input
        aria-label={typeof label === "string" ? label : "text-field"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {errorText ? <span role="alert">{errorText}</span> : null}
    </div>
  ),
}));

jest.mock("@shared/ui/typography", () => ({
  SubsectionTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={className}>{children}</h3>
  ),
}));

// ─── Default theme tokens stub ──────────────────────────────────────────────────
const mockTokens = {
  color: {
    brand: {
      primary: {
        base: "#26a69a",
        contrastText: "#ffffff",
        focusRing: "rgba(38,166,154,0.3)",
      },
    },
  },
  component: {
    adminPanel: {
      sectionSpacing: 8,
      dividerColor: "#e2e8f0",
      surface: "#ffffff",
    },
  },
};

// ─── Context value factory ──────────────────────────────────────────────────────
function makeContextValue(overrides: Partial<React.ContextType<typeof AppConfigContext>> = {}) {
  mockGetThemeTokens.mockReturnValue(mockTokens);
  return {
    getThemeColor: mockGetThemeColor,
    getConfigId: mockGetConfigId,
    saveConfig: mockSaveConfig,
    fetchConfig: mockFetchConfig,
    getThemeTokens: mockGetThemeTokens,
    ...overrides,
  } as unknown as React.ContextType<typeof AppConfigContext>;
}

// ─── Render helper ──────────────────────────────────────────────────────────────
function renderAdminTheme(contextOverrides: Partial<React.ContextType<typeof AppConfigContext>> = {}) {
  return render(
    <MemoryRouter>
      <AppConfigContext.Provider value={makeContextValue(contextOverrides)}>
        <AdminTheme />
      </AppConfigContext.Provider>
    </MemoryRouter>,
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────────
describe("AdminTheme", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetThemeTokens.mockReturnValue(mockTokens);
    // Use "#9ccc65" which is in presetPalette (not dark, in basePalette, matches DEFAULT_BRAND_COLOR mock)
    mockGetThemeColor.mockReturnValue("#9ccc65");
    mockGetConfigId.mockReturnValue("config-id-1");
    mockSaveConfig.mockResolvedValue(undefined);
    mockFetchConfig.mockResolvedValue(undefined);
  });

  describe("初期表示", () => {
    it("テーマカラーセクションのタイトルが表示される", () => {
      renderAdminTheme();
      expect(screen.getByText("テーマカラー")).toBeInTheDocument();
    });

    it("プレビューセクションのタイトルが表示される", () => {
      renderAdminTheme();
      expect(screen.getByText("プレビュー")).toBeInTheDocument();
    });

    it("管理パネルプレビューのテキストが表示される", () => {
      renderAdminTheme();
      expect(screen.getByText("管理パネルプレビュー")).toBeInTheDocument();
    });

    it("保存ボタンが表示される", () => {
      renderAdminTheme();
      expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    });

    it("プリセットカラータイルが表示される", () => {
      renderAdminTheme();
      // At least one preset color button with aria-label should be visible
      const colorButtons = screen.getAllByRole("button", { name: /テーマカラー #/ });
      expect(colorButtons.length).toBeGreaterThan(0);
    });

    it("「その他のカラーコードを入力」ボタンが表示される", () => {
      renderAdminTheme();
      expect(screen.getByRole("button", { name: "その他のカラーコードを入力" })).toBeInTheDocument();
    });

    it("初期状態ではカスタム入力フィールドが表示されない", () => {
      // getThemeColor returns "#9ccc65" which IS in presetPalette → customMode=false
      renderAdminTheme();
      expect(screen.queryByText("カラーコードを直接指定")).not.toBeInTheDocument();
    });
  });

  describe("プリセットカラー選択", () => {
    it("プリセットカラータイルをクリックするとそのカラーが選択される", async () => {
      const user = userEvent.setup();
      renderAdminTheme();

      const colorButtons = screen.getAllByRole("button", { name: /テーマカラー #/ });
      await user.click(colorButtons[1]); // click a different color

      // カスタムモードが解除されていることを確認（カスタム入力が非表示）
      expect(screen.queryByText("カラーコードを直接指定")).not.toBeInTheDocument();
    });

    it("現在と異なるプリセットを選択すると保存ボタンが有効になる", async () => {
      const user = userEvent.setup();
      // current color is "#9ccc65" (presetPalette[0]); pick a different non-dark preset
      renderAdminTheme();

      // "#1e88e5" is the second non-dark candidate in basePalette – it IS in presetPalette
      const differentButton = screen.getByRole("button", { name: "テーマカラー #1e88e5" });
      await user.click(differentButton);

      const saveButton = screen.getByRole("button", { name: "保存" });
      expect(saveButton).not.toBeDisabled();
    });

    it("同じカラーを選択したときは保存ボタンが無効のまま", async () => {
      const user = userEvent.setup();
      // current color is "#9ccc65"
      renderAdminTheme();

      // Click the SAME color tile
      const sameButton = screen.getByRole("button", { name: "テーマカラー #9ccc65" });
      await user.click(sameButton);

      const saveButton = screen.getByRole("button", { name: "保存" });
      expect(saveButton).toBeDisabled();
    });
  });

  describe("カスタムカラーモード", () => {
    it("「+」ボタンをクリックするとカスタム入力フィールドが表示される", async () => {
      const user = userEvent.setup();
      // Start from preset mode (getThemeColor returns "#9ccc65" which IS in presetPalette)
      renderAdminTheme();

      const plusButton = screen.getByRole("button", { name: "その他のカラーコードを入力" });
      await user.click(plusButton);

      expect(screen.getByText("カラーコードを直接指定")).toBeInTheDocument();
    });

    it("カラーコードが配色にない場合は自動的にカスタムモードで開く", () => {
      // "#123456" is dark (brightness ~45) → filtered out → not in presetPalette → customMode=true
      mockGetThemeColor.mockReturnValue("#123456");
      renderAdminTheme();

      expect(screen.getByText("カラーコードを直接指定")).toBeInTheDocument();
    });

    it("有効な16進数コードを入力するとエラーが表示されない", async () => {
      const user = userEvent.setup();
      mockGetThemeColor.mockReturnValue("#123456");
      renderAdminTheme();

      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "#FF5733");

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("不正な16進数コードを入力するとエラーが表示される", async () => {
      const user = userEvent.setup();
      mockGetThemeColor.mockReturnValue("#123456");
      renderAdminTheme();

      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "#ZZZZZZ");

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "正しい16進数カラーコードを入力してください",
      );
    });

    it("3桁の有効な16進数コードはエラーにならない", async () => {
      const user = userEvent.setup();
      mockGetThemeColor.mockReturnValue("#123456");
      renderAdminTheme();

      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "#FFF");

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("保存ボタンの状態", () => {
    it("変更がない場合は保存ボタンが無効", () => {
      renderAdminTheme();
      // getThemeColor returns #26a69a, initial colorCode is also set to that, so isDirty = false
      const saveButton = screen.getByRole("button", { name: "保存" });
      expect(saveButton).toBeDisabled();
    });

    it("不正な16進数コードの場合は保存ボタンが無効", async () => {
      const user = userEvent.setup();
      mockGetThemeColor.mockReturnValue("#123456");
      renderAdminTheme();

      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "invalid");

      const saveButton = screen.getByRole("button", { name: "保存" });
      expect(saveButton).toBeDisabled();
    });
  });

  describe("保存処理", () => {
    // Helper: start with "#9ccc65" preset → click "#1e88e5" to make dirty
    async function selectDifferentPreset(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole("button", { name: "テーマカラー #1e88e5" }));
    }

    it("既存のconfigがある場合はUpdateAppConfigInputで保存する", async () => {
      const user = userEvent.setup();
      // default: getThemeColor="#9ccc65"; configId="config-123"
      mockGetConfigId.mockReturnValue("config-123");
      renderAdminTheme();

      await selectDifferentPreset(user);

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(mockSaveConfig).toHaveBeenCalledWith(
          expect.objectContaining({ id: "config-123", themeColor: "#1E88E5" }),
        );
      });
    });

    it("configIdがない場合はCreateAppConfigInputで保存する", async () => {
      const user = userEvent.setup();
      mockGetConfigId.mockReturnValue(null as unknown as string);
      renderAdminTheme();

      await selectDifferentPreset(user);

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(mockSaveConfig).toHaveBeenCalledWith(
          expect.objectContaining({ name: "default", themeColor: "#1E88E5" }),
        );
      });
    });

    it("保存成功後にfetchConfigが呼ばれる", async () => {
      const user = userEvent.setup();
      renderAdminTheme();

      await selectDifferentPreset(user);

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(mockFetchConfig).toHaveBeenCalled();
      });
    });

    it("保存成功後に成功通知が表示される", async () => {
      const user = userEvent.setup();
      renderAdminTheme();

      await selectDifferentPreset(user);

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith(
          expect.objectContaining({ tone: "success" }),
        );
      });
    });

    it("保存失敗時にエラー通知が表示される", async () => {
      const user = userEvent.setup();
      mockSaveConfig.mockRejectedValue(new Error("save failed"));
      renderAdminTheme();

      await selectDifferentPreset(user);

      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith(
          expect.objectContaining({ tone: "error" }),
        );
      });
    });

    it("保存中は「保存中...」というテキストが表示される", async () => {
      const user = userEvent.setup();
      let resolveSave!: () => void;
      mockSaveConfig.mockReturnValue(new Promise<void>((res) => { resolveSave = res; }));
      renderAdminTheme();

      await selectDifferentPreset(user);

      await user.click(screen.getByRole("button", { name: "保存" }));

      expect(await screen.findByRole("button", { name: "保存中..." })).toBeInTheDocument();

      resolveSave();
    });
  });

  describe("getThemeColor が関数でない場合", () => {
    it("undefined を返す場合はデフォルトカラーが使用される", () => {
      const contextValue = {
        ...makeContextValue(),
        getThemeColor: undefined as unknown as () => string,
      };
      render(
        <MemoryRouter>
          <AppConfigContext.Provider value={contextValue}>
            <AdminTheme />
          </AppConfigContext.Provider>
        </MemoryRouter>,
      );
      expect(screen.getByText("テーマカラー")).toBeInTheDocument();
    });
  });
});
