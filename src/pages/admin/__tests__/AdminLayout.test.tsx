/**
 * AdminLayout ユニットテスト
 *
 * AdminLayout / AdminLayoutContent / AdminContextRail の
 * 主要な振る舞いを網羅する。
 * 重い外部依存（MUI hooks・react-resizable-panels・splitView 等）は
 * すべてモック化してテスト実行を安定させる。
 */

// ---- imports (before jest.mock) ----
import AdminLayout from "@pages/admin/AdminLayout";
import { renderWithProviders } from "@shared/test-utils";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// ---- mock fn refs (referenced by jest.mock factories) ----
const mockUseMediaQuery = jest.fn().mockReturnValue(false);
const mockNavigate = jest.fn();
const mockUseHeaderMenu = jest.fn();
const mockUseSplitView = jest.fn();
const mockResolveActiveMenuHref = jest.fn().mockReturnValue("/admin");
const mockBuildAdminSplitPanelConfig = jest.fn().mockReturnValue(null);

// ---- jest.mock calls ----

// MUI: useMediaQuery だけ差し替え、残りは実物を使う
jest.mock("@mui/material", () => ({
  ...jest.requireActual("@mui/material"),
  useMediaQuery: (...args: unknown[]) => mockUseMediaQuery(...args),
}));

// react-router-dom: Outlet / useNavigate のみ差し替え
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Outlet: () => <div data-testid="outlet-content">ページコンテンツ</div>,
  useNavigate: () => mockNavigate,
}));

// splitView 機能: 全コンポーネント・フックをスタブ化
jest.mock("@features/splitView", () => ({
  SplitViewProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useSplitView: () => mockUseSplitView(),
  SplitModeToggle: ({
    mode,
    onToggle,
  }: {
    mode: string;
    onToggle: () => void;
  }) => (
    <button
      data-testid="split-mode-toggle"
      aria-label={`split-mode-${mode}`}
      onClick={onToggle}
    >
      split-toggle
    </button>
  ),
  PanelContainer: ({
    children,
    title,
    onClose,
  }: {
    children: React.ReactNode;
    title?: string;
    onClose?: () => void;
  }) => (
    <div data-testid="panel-container">
      {title && <span data-testid="panel-title">{title}</span>}
      {onClose && (
        <button data-testid="panel-close" onClick={onClose}>
          閉じる
        </button>
      )}
      {children}
    </div>
  ),
}));

// react-resizable-panels: children をそのまま描画するスタブ
jest.mock("react-resizable-panels", () => ({
  Group: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="panel-group">{children}</div>
  ),
  Panel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Separator: () => <div data-testid="panel-separator" />,
}));

// adminLayoutTokens: 固定値を返す
jest.mock("@features/admin/layout/adminLayoutTokens", () => ({
  PAGE_PADDING_X: { xs: "16px", md: "32px" },
  PAGE_PADDING_Y: { xs: "24px", md: "32px" },
}));

// adminSettingsNavigation: テスト用グループを返す
jest.mock("@features/admin/layout/model/adminSettingsNavigation", () => ({
  getAdminSettingsNavigationGroups: jest.fn(() => [
    {
      key: "basic",
      title: "基本",
      items: [
        { path: "/admin/master/job_term", title: "集計対象月" },
        { path: "/admin/master/holiday_calendar", title: "カレンダー設定" },
      ],
    },
  ]),
}));

// adminSplitPanelRegistry: 最小限のオプションを返す
jest.mock("@features/admin/layout/model/adminSplitPanelRegistry", () => ({
  ADMIN_SPLIT_PANEL_OPTIONS: [
    { value: "dashboard", label: "ダッシュボード", route: "/admin" },
    {
      value: "attendance-edit",
      label: "勤怠編集",
      route: "/admin/attendances",
    },
  ],
  buildAdminSplitPanelConfig: (...args: unknown[]) =>
    mockBuildAdminSplitPanelConfig(...args),
}));

// resolveActiveMenuHref: モック関数
jest.mock("@features/admin/layout/model/resolveActiveMenuHref", () => ({
  resolveActiveMenuHref: (...args: unknown[]) =>
    mockResolveActiveMenuHref(...args),
}));

// useHeaderMenu: default export をモック
jest.mock("@features/admin/layout/model/useHeaderMenu", () => ({
  __esModule: true,
  default: () => mockUseHeaderMenu(),
}));

// NavItemPanelMenu: シンプルな div スタブ
jest.mock("@features/admin/layout/ui/NavItemPanelMenu", () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => (
    <div data-testid={`nav-panel-menu-${label}`} />
  ),
}));

// designTokenVar: fallback 値をそのまま返す（他のエクスポートは実物を使用）
jest.mock("@shared/designSystem", () => ({
  ...jest.requireActual("@shared/designSystem"),
  designTokenVar: (_token: string, fallback: string) => fallback,
}));

// PageSection: children をレンダリングするスタブ
jest.mock("@shared/ui/layout", () => ({
  PageSection: ({ children }: { children: React.ReactNode }) => (
    <section data-testid="page-section">{children}</section>
  ),
}));

// ---- テストデータ ----

const TEST_MENU_ITEMS = [
  {
    primaryLabel: "ダッシュボード",
    secondaryLabel: "Overview",
    href: "/admin",
    ctaLabel: "主要指標を確認",
  },
  {
    primaryLabel: "勤怠",
    secondaryLabel: "Attendance",
    href: "/admin/attendances",
    ctaLabel: "未承認申請を確認",
  },
  {
    primaryLabel: "設定",
    secondaryLabel: "Settings",
    href: "/admin/master",
    ctaLabel: "マスタ設定を開く",
  },
] as const;

type SplitViewOverrides = {
  mode?: "single" | "split" | "triple";
  leftPanel?: object | null;
  rightPanel?: object | null;
};

function makeSplitViewState(overrides: SplitViewOverrides = {}) {
  const { mode = "single", leftPanel = null, rightPanel = null } = overrides;
  return {
    state: { mode, leftPanel, rightPanel, dividerPosition: 50 },
    setMode: jest.fn(),
    enableSplitMode: jest.fn(),
    enableTripleMode: jest.fn(),
    disableSplitMode: jest.fn(),
    setLeftPanel: jest.fn(),
    setRightPanel: jest.fn(),
    setDividerPosition: jest.fn(),
    reset: jest.fn(),
  };
}

function renderAdminLayout(initialPath = "/admin") {
  return renderWithProviders(<AdminLayout />, {
    initialEntries: [initialPath],
  });
}

// ---- テスト ----

describe("AdminLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(false); // デスクトップがデフォルト
    mockUseHeaderMenu.mockReturnValue(TEST_MENU_ITEMS);
    mockResolveActiveMenuHref.mockReturnValue("/admin");
    mockUseSplitView.mockReturnValue(makeSplitViewState());
    mockBuildAdminSplitPanelConfig.mockReturnValue(null);
  });

  // ----------------------------------------------------------------
  // 基本レンダリング
  // ----------------------------------------------------------------
  describe("基本レンダリング", () => {
    it("クラッシュせずにレンダリングされる", () => {
      renderAdminLayout();
      expect(screen.getByTestId("page-section")).toBeInTheDocument();
    });

    it("SplitModeToggle がレンダリングされる", () => {
      renderAdminLayout();
      expect(screen.getByTestId("split-mode-toggle")).toBeInTheDocument();
    });

    it("シングルモードで SplitModeToggle の aria-label は split-mode-single", () => {
      renderAdminLayout();
      expect(
        screen.getByRole("button", { name: "split-mode-single" }),
      ).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // デスクトップ: ナビゲーション表示
  // ----------------------------------------------------------------
  describe("デスクトップ: ナビゲーション表示", () => {
    it("CONTROL RAIL ラベルが表示される", () => {
      renderAdminLayout();
      expect(screen.getByText("CONTROL RAIL")).toBeInTheDocument();
    });

    it("全メニューアイテムのプライマリラベルが表示される", () => {
      renderAdminLayout();
      // ダッシュボードは activeMenuItem ヘッダーにも出るので getAllByText を使用
      expect(screen.getAllByText("ダッシュボード").length).toBeGreaterThan(0);
      expect(screen.getByText("勤怠")).toBeInTheDocument();
      expect(screen.getByText("設定")).toBeInTheDocument();
    });

    it("セカンダリラベルが表示される", () => {
      renderAdminLayout();
      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Attendance")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("アクティブメニューの ctaLabel が説明文として表示される", () => {
      // activeMenuHref = '/admin' → ダッシュボードが active
      renderAdminLayout();
      expect(screen.getByText("主要指標を確認")).toBeInTheDocument();
    });

    it("activeMenuItem が null のとき fallback 説明文が表示される", () => {
      // resolveActiveMenuHref が存在しない href を返す場合
      mockResolveActiveMenuHref.mockReturnValue("/admin/not-found");
      renderAdminLayout();
      expect(
        screen.getByText("頻出操作へすばやく遷移できます。"),
      ).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 設定メニューの展開・折り畳み
  // ----------------------------------------------------------------
  describe("設定メニューの展開・折り畳み", () => {
    it("設定パス以外ではサブメニューが折り畳まれている", () => {
      mockResolveActiveMenuHref.mockReturnValue("/admin");
      renderAdminLayout();
      expect(screen.queryByText("集計対象月")).not.toBeInTheDocument();
    });

    it("設定パスがアクティブのときサブメニューが展開される", () => {
      mockResolveActiveMenuHref.mockReturnValue("/admin/master");
      renderAdminLayout();
      expect(screen.getByText("集計対象月")).toBeInTheDocument();
      expect(screen.getByText("カレンダー設定")).toBeInTheDocument();
    });

    it("設定グループタイトルが展開時に表示される", () => {
      mockResolveActiveMenuHref.mockReturnValue("/admin/master");
      renderAdminLayout();
      expect(screen.getByText("基本")).toBeInTheDocument();
    });

    it("展開ボタンをクリックするとサブメニューが展開される", async () => {
      const user = userEvent.setup();
      mockResolveActiveMenuHref.mockReturnValue("/admin");
      renderAdminLayout();
      // 初期状態: 折り畳み
      expect(screen.queryByText("集計対象月")).not.toBeInTheDocument();

      const expandBtn = screen.getByRole("button", {
        name: "設定メニューを開く",
      });
      await user.click(expandBtn);

      expect(screen.getByText("集計対象月")).toBeInTheDocument();
    });

    it("展開済みのメニューで折り畳みボタンをクリックするとサブメニューが非表示になる", async () => {
      const user = userEvent.setup();
      mockResolveActiveMenuHref.mockReturnValue("/admin/master");
      renderAdminLayout();
      // 初期状態: 展開中
      expect(screen.getByText("集計対象月")).toBeInTheDocument();

      const collapseBtn = screen.getByRole("button", {
        name: "設定メニューを閉じる",
      });
      await user.click(collapseBtn);

      expect(screen.queryByText("集計対象月")).not.toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // ナビゲーション操作
  // ----------------------------------------------------------------
  describe("ナビゲーション操作", () => {
    it("別パスのメニューアイテムをクリックすると navigate が呼ばれる", async () => {
      const user = userEvent.setup();
      // 現在のパスを /admin/attendances に設定し、/admin へ遷移させる
      renderAdminLayout("/admin/attendances");

      const btn = screen.getByRole("button", { name: /ダッシュボード/ });
      await user.click(btn);

      expect(mockNavigate).toHaveBeenCalledWith("/admin");
    });

    it("同じパスをクリックした場合は navigate が呼ばれない", async () => {
      const user = userEvent.setup();
      // 現在のパスと同じ /admin のメニュー項目をクリック
      renderAdminLayout("/admin");

      const btn = screen.getByRole("button", { name: /ダッシュボード/ });
      await user.click(btn);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("設定サブメニューアイテムをクリックすると navigate が呼ばれる", async () => {
      const user = userEvent.setup();
      mockResolveActiveMenuHref.mockReturnValue("/admin/master");
      renderAdminLayout("/admin/master");

      const subItem = screen.getByRole("button", { name: "集計対象月" });
      await user.click(subItem);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/master/job_term");
    });
  });

  // ----------------------------------------------------------------
  // モバイル表示
  // ----------------------------------------------------------------
  describe("モバイル表示", () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true); // モバイル
    });

    it("「ナビを開く」ボタンが表示される", () => {
      renderAdminLayout();
      expect(
        screen.getByRole("button", { name: "ナビを開く" }),
      ).toBeInTheDocument();
    });

    it("モバイルではデスクトップ用サイドレールがデフォルトで非表示", () => {
      renderAdminLayout();
      // !isMobile 条件の AdminContextRail は描画されない
      // isMobile && isMobileRailOpen 条件も false → CONTROL RAIL なし
      expect(screen.queryByText("CONTROL RAIL")).not.toBeInTheDocument();
    });

    it("「ナビを開く」をクリックするとレールが表示される", async () => {
      const user = userEvent.setup();
      renderAdminLayout();

      await user.click(screen.getByRole("button", { name: "ナビを開く" }));

      expect(screen.getByText("CONTROL RAIL")).toBeInTheDocument();
    });

    it("レール表示中はボタンが「ナビを閉じる」に変わる", async () => {
      const user = userEvent.setup();
      renderAdminLayout();

      await user.click(screen.getByRole("button", { name: "ナビを開く" }));

      expect(
        screen.getByRole("button", { name: "ナビを閉じる" }),
      ).toBeInTheDocument();
    });

    it("「ナビを閉じる」をクリックするとレールが非表示になる", async () => {
      const user = userEvent.setup();
      renderAdminLayout();

      await user.click(screen.getByRole("button", { name: "ナビを開く" }));
      await user.click(screen.getByRole("button", { name: "ナビを閉じる" }));

      expect(screen.queryByText("CONTROL RAIL")).not.toBeInTheDocument();
    });

    it("レール表示中にメニューアイテムをクリックするとレールが閉じる", async () => {
      const user = userEvent.setup();
      // /admin/attendances にいる状態でダッシュボードをクリック
      renderAdminLayout("/admin/attendances");

      await user.click(screen.getByRole("button", { name: "ナビを開く" }));
      expect(screen.getByText("CONTROL RAIL")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /ダッシュボード/ }));

      expect(screen.queryByText("CONTROL RAIL")).not.toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // シングルモード (mode=single)
  // ----------------------------------------------------------------
  describe("シングルモード (mode=single)", () => {
    it("Outlet コンテンツがレンダリングされる", () => {
      renderAdminLayout();
      expect(screen.getByTestId("outlet-content")).toBeInTheDocument();
    });

    it("panel-group が表示されない（分割なし）", () => {
      renderAdminLayout();
      expect(screen.queryByTestId("panel-group")).not.toBeInTheDocument();
    });

    it("panel-separator が表示されない", () => {
      renderAdminLayout();
      expect(screen.queryByTestId("panel-separator")).not.toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // スプリットモード (mode=split)
  // ----------------------------------------------------------------
  describe("スプリットモード (mode=split)", () => {
    beforeEach(() => {
      mockUseSplitView.mockReturnValue(
        makeSplitViewState({
          mode: "split",
          rightPanel: {
            id: "dashboard",
            title: "ダッシュボード",
            component: undefined,
          },
        }),
      );
    });

    it("panel-group がレンダリングされる", () => {
      renderAdminLayout();
      expect(screen.getByTestId("panel-group")).toBeInTheDocument();
    });

    it("panel-separator が 1 つレンダリングされる", () => {
      renderAdminLayout();
      expect(screen.getAllByTestId("panel-separator")).toHaveLength(1);
    });

    it("Outlet コンテンツが panel 内でレンダリングされる", () => {
      renderAdminLayout();
      expect(screen.getByTestId("outlet-content")).toBeInTheDocument();
    });

    it("PanelContainer がレンダリングされる", () => {
      renderAdminLayout();
      expect(screen.getAllByTestId("panel-container").length).toBeGreaterThan(
        0,
      );
    });
  });

  // ----------------------------------------------------------------
  // トリプルモード (mode=triple)
  // ----------------------------------------------------------------
  describe("トリプルモード (mode=triple)", () => {
    beforeEach(() => {
      const panel1 = {
        id: "dashboard",
        title: "ダッシュボード",
        component: undefined,
      };
      const panel2 = {
        id: "attendance-edit",
        title: "勤怠編集",
        component: undefined,
      };
      mockUseSplitView.mockReturnValue(
        makeSplitViewState({ mode: "triple", leftPanel: panel1, rightPanel: panel2 }),
      );
    });

    it("panel-group がレンダリングされる", () => {
      renderAdminLayout();
      expect(screen.getByTestId("panel-group")).toBeInTheDocument();
    });

    it("panel-separator が 2 つレンダリングされる", () => {
      renderAdminLayout();
      expect(screen.getAllByTestId("panel-separator")).toHaveLength(2);
    });

    it("Outlet コンテンツが panel 内でレンダリングされる", () => {
      renderAdminLayout();
      expect(screen.getByTestId("outlet-content")).toBeInTheDocument();
    });

    it("3 つの PanelContainer がレンダリングされる", () => {
      renderAdminLayout();
      expect(screen.getAllByTestId("panel-container")).toHaveLength(3);
    });
  });

  // ----------------------------------------------------------------
  // SplitModeToggle の操作
  // ----------------------------------------------------------------
  describe("SplitModeToggle の操作", () => {
    it("シングルモードでトグルをクリックすると enableSplitMode が呼ばれる", async () => {
      const user = userEvent.setup();
      const svState = makeSplitViewState({ mode: "single" });
      mockUseSplitView.mockReturnValue(svState);

      renderAdminLayout();
      await user.click(screen.getByTestId("split-mode-toggle"));

      expect(svState.enableSplitMode).toHaveBeenCalled();
    });

    it("スプリットモードでトグルをクリックすると enableTripleMode が呼ばれる（デスクトップ）", async () => {
      const user = userEvent.setup();
      const svState = makeSplitViewState({
        mode: "split",
        rightPanel: { id: "dashboard", title: "ダッシュボード" },
      });
      mockUseSplitView.mockReturnValue(svState);

      renderAdminLayout();
      await user.click(screen.getByTestId("split-mode-toggle"));

      expect(svState.enableTripleMode).toHaveBeenCalled();
    });

    it("トリプルモードでトグルをクリックすると disableSplitMode が呼ばれる", async () => {
      const user = userEvent.setup();
      const svState = makeSplitViewState({ mode: "triple" });
      mockUseSplitView.mockReturnValue(svState);

      renderAdminLayout();
      await user.click(screen.getByTestId("split-mode-toggle"));

      expect(svState.disableSplitMode).toHaveBeenCalled();
    });

    it("モバイル・シングルモードでトグルをクリックすると enableSplitMode が呼ばれる", async () => {
      const user = userEvent.setup();
      mockUseMediaQuery.mockReturnValue(true); // モバイル
      const svState = makeSplitViewState({ mode: "single" });
      mockUseSplitView.mockReturnValue(svState);

      renderAdminLayout();
      await user.click(screen.getByTestId("split-mode-toggle"));

      expect(svState.enableSplitMode).toHaveBeenCalled();
    });

    it("モバイル・スプリットモードでトグルをクリックすると disableSplitMode が呼ばれる", async () => {
      const user = userEvent.setup();
      mockUseMediaQuery.mockReturnValue(true); // モバイル
      const svState = makeSplitViewState({
        mode: "split",
        rightPanel: { id: "dashboard", title: "ダッシュボード" },
      });
      mockUseSplitView.mockReturnValue(svState);

      renderAdminLayout();
      await user.click(screen.getByTestId("split-mode-toggle"));

      // モバイルでは split → single (disableSplitMode)
      expect(svState.disableSplitMode).toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  // NavItemPanelMenu スタブ確認
  // ----------------------------------------------------------------
  describe("NavItemPanelMenu スタブ", () => {
    it("各メニューアイテムに対応する NavItemPanelMenu スタブが描画される", () => {
      renderAdminLayout();
      // 設定以外の 2 アイテム + 設定自体 = 3 アイテム分が描画される
      expect(
        screen.getByTestId("nav-panel-menu-ダッシュボード"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("nav-panel-menu-勤怠")).toBeInTheDocument();
      expect(screen.getByTestId("nav-panel-menu-設定")).toBeInTheDocument();
    });
  });
});
