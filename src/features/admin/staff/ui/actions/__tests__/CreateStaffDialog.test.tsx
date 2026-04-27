// ─── Imports (must come before jest.mock per ESLint import/first) ─────────────
import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { StaffRole, type StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { ApproverSettingMode } from "@shared/api/graphql/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import CreateStaffDialog from "../CreateStaffDialog";

// ─── Mock fn variables ─────────────────────────────────────────────────────────
const mockDispatch = jest.fn();
const mockCreateCognitoUserFn = jest.fn();
const mockAddUserToGroupFn = jest.fn();
const mockFetchStaffsFn = jest.fn();
const mockHandleSyncCognitoUserFn = jest.fn();
const mockCloseWithoutGuard = jest.fn();
const mockRequestClose = jest.fn();
const mockRefreshStaff = jest.fn();
const mockCreateStaff = jest.fn();
const mockUpdateStaff = jest.fn();

// ─── Module mocks ──────────────────────────────────────────────────────────────
jest.mock("@app/hooks", () => ({
  useAppDispatchV2: () => mockDispatch,
}));

jest.mock("@entities/staff/model/cognito/createCognitoUser", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockCreateCognitoUserFn(...args),
}));

jest.mock("@entities/staff/model/cognito/addUserToGroup", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockAddUserToGroupFn(...args),
}));

jest.mock("@entities/staff/model/useStaffs/fetchStaffs", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockFetchStaffsFn(...args),
}));

jest.mock("@features/admin/staff/model/handleSyncCognitoUser", () => ({
  handleSyncCognitoUser: (...args: unknown[]) =>
    mockHandleSyncCognitoUserFn(...args),
}));

jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: (payload: { tone: string; message: unknown }) => ({
    type: "notification/push",
    payload,
  }),
}));

jest.mock("@shared/ui/feedback/useDialogCloseGuard", () => ({
  useDialogCloseGuard: () => ({
    dialog: null,
    requestClose: (...args: unknown[]) => mockRequestClose(...args),
    closeWithoutGuard: (...args: unknown[]) => mockCloseWithoutGuard(...args),
  }),
}));

jest.mock("@shared/ui/typography", () => ({
  SectionTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

jest.mock("@mui/x-date-pickers", () => ({
  DatePicker: ({
    slotProps,
  }: {
    slotProps?: { textField?: { onBlur?: () => void } };
  }) => (
    <input
      data-testid="usage-start-date-picker"
      aria-label="利用開始日"
      readOnly
      onBlur={slotProps?.textField?.onBlur}
    />
  ),
}));

// ─── Context values ────────────────────────────────────────────────────────────
const baseAuthContextValue = {
  authStatus: "authenticated" as const,
  session: { roles: [] },
  signOut: jest.fn(),
  signIn: jest.fn(),
  isCognitoUserRole: jest.fn(() => false),
  cognitoUser: null,
} as unknown as React.ContextType<typeof AuthContext>;

const baseAppConfigContextValue = {
  getShiftGroups: () => [],
} as unknown as React.ContextType<typeof AppConfigContext>;

// ─── Wrapper ───────────────────────────────────────────────────────────────────
function Wrapper({ children }: React.PropsWithChildren) {
  return (
    <AuthContext.Provider value={baseAuthContextValue}>
      <AppConfigContext.Provider value={baseAppConfigContextValue}>
        {children}
      </AppConfigContext.Provider>
    </AuthContext.Provider>
  );
}
Wrapper.displayName = "TestWrapper";

// ─── Render helper ─────────────────────────────────────────────────────────────
function renderComponent() {
  return render(
    <CreateStaffDialog
      staffs={[]}
      refreshStaff={mockRefreshStaff}
      createStaff={mockCreateStaff}
      updateStaff={mockUpdateStaff}
    />,
    { wrapper: Wrapper },
  );
}

// ─── Tests ─────────────────────────────────────────────────────────────────────
describe("CreateStaffDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshStaff.mockResolvedValue(undefined);
    mockCreateStaff.mockResolvedValue(undefined);
    mockUpdateStaff.mockResolvedValue(undefined);
    mockCreateCognitoUserFn.mockResolvedValue(undefined);
    mockAddUserToGroupFn.mockResolvedValue(undefined);
    mockHandleSyncCognitoUserFn.mockResolvedValue(undefined);
    mockFetchStaffsFn.mockResolvedValue([]);
  });

  // ─── ダイアログ開閉 ──────────────────────────────────────────────────────────
  describe("ダイアログ開閉", () => {
    it("初期状態でスタッフ登録ボタンが表示される", () => {
      renderComponent();
      expect(
        screen.getByRole("button", { name: /スタッフ登録/ }),
      ).toBeInTheDocument();
    });

    it("初期状態でダイアログが表示されない", () => {
      renderComponent();
      expect(screen.queryByText("スタッフ作成")).not.toBeInTheDocument();
    });

    it("スタッフ登録ボタンをクリックするとダイアログが開く", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      expect(screen.getByText("スタッフ作成")).toBeInTheDocument();
    });

    it("キャンセルボタンをクリックすると requestClose が呼ばれる", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      await user.click(screen.getByRole("button", { name: "キャンセル" }));
      expect(mockRequestClose).toHaveBeenCalledTimes(1);
    });

    it("オーバーレイをクリックすると requestClose が呼ばれる", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      // The backdrop is the fixed full-screen div (distinct from the dialog panel)
      const backdrop = document.querySelector(
        'div[class*="bg-slate-900"]',
      ) as HTMLElement;
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop);
      expect(mockRequestClose).toHaveBeenCalled();
    });

    it("ダイアログを再び開くとフォームがリセットされる", async () => {
      const user = userEvent.setup();
      const { container } = renderComponent();

      // Open dialog and type
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      await user.type(screen.getByRole("textbox", { name: "姓" }), "テスト");

      // Close (simulate closeWithoutGuard calling onClose through the button)
      await user.click(screen.getByRole("button", { name: "キャンセル" }));

      // Reopen by clicking the open button again
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      expect(screen.getByRole("textbox", { name: "姓" })).toHaveValue("");
      void container;
    });
  });

  // ─── フォームレンダリング ──────────────────────────────────────────────────
  describe("フォームレンダリング", () => {
    it("ダイアログを開くとスタッフ名フィールドが表示される", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      expect(screen.getByRole("textbox", { name: "姓" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "名" })).toBeInTheDocument();
    });

    it("ダイアログを開くと承認者設定ラジオボタンが表示される", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      expect(
        screen.getByRole("radio", { name: "管理者全員 (デフォルト)" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: "特定の承認者を1名に限定" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: "特定の承認者を複数選択" }),
      ).toBeInTheDocument();
    });

    it("初期状態で登録ボタンが無効化されている", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      expect(screen.getByRole("button", { name: "登録" })).toBeDisabled();
    });

    it("シフトグループが空の場合、案内メッセージが表示される", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      expect(
        screen.getByText(/利用可能なシフトグループがありません/),
      ).toBeInTheDocument();
    });

    it("シフトグループが存在する場合 Autocomplete が表示される", async () => {
      const appConfigWithGroups = {
        getShiftGroups: () => [
          { label: "グループA", description: "グループAの説明" },
        ],
      } as unknown as React.ContextType<typeof AppConfigContext>;

      const WrapperWithGroups = ({
        children,
      }: React.PropsWithChildren) => (
        <AuthContext.Provider value={baseAuthContextValue}>
          <AppConfigContext.Provider value={appConfigWithGroups}>
            {children}
          </AppConfigContext.Provider>
        </AuthContext.Provider>
      );
      WrapperWithGroups.displayName = "TestWrapper";

      const user = userEvent.setup();
      render(
        <CreateStaffDialog
          staffs={[]}
          refreshStaff={mockRefreshStaff}
          createStaff={mockCreateStaff}
          updateStaff={mockUpdateStaff}
        />,
        { wrapper: WrapperWithGroups },
      );
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      // No "not available" message
      expect(
        screen.queryByText(/利用可能なシフトグループがありません/),
      ).not.toBeInTheDocument();
    });

    it("cognitoUser.owner が true のとき、オーナー権限フィールドが表示される", async () => {
      const ownerAuthValue = {
        ...baseAuthContextValue,
        cognitoUser: {
          id: "cognito-001",
          givenName: "太郎",
          familyName: "テスト",
          mailAddress: "owner@example.com",
          owner: true,
          roles: [StaffRole.ADMIN],
          emailVerified: true,
        },
      } as unknown as React.ContextType<typeof AuthContext>;

      const OwnerWrapper = ({ children }: React.PropsWithChildren) => (
        <AuthContext.Provider value={ownerAuthValue}>
          <AppConfigContext.Provider value={baseAppConfigContextValue}>
            {children}
          </AppConfigContext.Provider>
        </AuthContext.Provider>
      );
      OwnerWrapper.displayName = "TestWrapper";

      const user = userEvent.setup();
      render(
        <CreateStaffDialog
          staffs={[]}
          refreshStaff={mockRefreshStaff}
          createStaff={mockCreateStaff}
          updateStaff={mockUpdateStaff}
        />,
        { wrapper: OwnerWrapper },
      );
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      expect(screen.getByText("オーナー権限")).toBeInTheDocument();
      expect(screen.getByText("開発者フラグ")).toBeInTheDocument();
    });

    it("cognitoUser.owner が false のとき、オーナー権限フィールドが非表示", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      expect(screen.queryByText("オーナー権限")).not.toBeInTheDocument();
      expect(screen.queryByText("開発者フラグ")).not.toBeInTheDocument();
    });

    it("ダイアログを開くと勤怠管理対象チェックボックスが表示される", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      expect(screen.getByText("勤怠管理対象")).toBeInTheDocument();
    });
  });

  // ─── バリデーション ────────────────────────────────────────────────────────
  describe("フォームバリデーション", () => {
    it("姓をクリアすると isValid が false になり登録ボタンが無効のままになる", async () => {
      const user = userEvent.setup();
      const { container } = renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));

      // Fill all required fields so the button becomes enabled
      await user.type(screen.getByRole("textbox", { name: "姓" }), "テスト");
      await user.type(screen.getByRole("textbox", { name: "名" }), "太郎");
      const emailInput = container.querySelector(
        'input[name="mailAddress"]',
      ) as HTMLInputElement;
      await user.type(emailInput, "test@example.com");
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
      });

      // Clearing familyName makes isValid false → button disabled again
      await user.clear(screen.getByRole("textbox", { name: "姓" }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "登録" })).toBeDisabled();
      });
    });

    it("名をクリアすると isValid が false になり登録ボタンが無効のままになる", async () => {
      const user = userEvent.setup();
      const { container } = renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));

      // Fill all required fields
      await user.type(screen.getByRole("textbox", { name: "姓" }), "テスト");
      await user.type(screen.getByRole("textbox", { name: "名" }), "太郎");
      const emailInput = container.querySelector(
        'input[name="mailAddress"]',
      ) as HTMLInputElement;
      await user.type(emailInput, "test@example.com");
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
      });

      // Clearing givenName makes isValid false
      await user.clear(screen.getByRole("textbox", { name: "名" }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "登録" })).toBeDisabled();
      });
    });

    it("無効なメールアドレスでは登録ボタンが無効のままになる", async () => {
      const user = userEvent.setup();
      const { container } = renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));

      // Fill name fields (valid) but give an invalid email
      await user.type(screen.getByRole("textbox", { name: "姓" }), "テスト");
      await user.type(screen.getByRole("textbox", { name: "名" }), "太郎");
      const emailInput = container.querySelector(
        'input[name="mailAddress"]',
      ) as HTMLInputElement;
      await user.type(emailInput, "not-an-email");

      // isValid = false because email is invalid → button stays disabled
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "登録" })).toBeDisabled();
      });
    });

    it("必須フィールドを入力すると登録ボタンが有効になる", async () => {
      const user = userEvent.setup();
      const { container } = renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));

      await user.type(screen.getByRole("textbox", { name: "姓" }), "テスト");
      await user.type(screen.getByRole("textbox", { name: "名" }), "太郎");
      const emailInput = container.querySelector(
        'input[name="mailAddress"]',
      ) as HTMLInputElement;
      await user.type(emailInput, "test@example.com");

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
      });
    });
  });

  // ─── 承認者設定 ────────────────────────────────────────────────────────────
  describe("承認者設定", () => {
    it("デフォルトで「管理者全員」が選択されている", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      const adminRadio = screen.getByRole("radio", {
        name: "管理者全員 (デフォルト)",
      });
      expect(adminRadio).toBeChecked();
    });

    it("「特定の承認者を1名に限定」を選択すると単一承認者フィールドが表示される", async () => {
      const user = userEvent.setup();
      // Provide staffs with admin role for the approver options
      const adminStaff = {
        id: "admin-001",
        cognitoUserId: "cognito-admin-001",
        familyName: "管理者",
        givenName: "花子",
        mailAddress: "admin@example.com",
        owner: false,
        role: StaffRole.ADMIN,
        enabled: true,
        status: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      } as unknown as StaffType;

      render(
        <CreateStaffDialog
          staffs={[adminStaff]}
          refreshStaff={mockRefreshStaff}
          createStaff={mockCreateStaff}
          updateStaff={mockUpdateStaff}
        />,
        { wrapper: Wrapper },
      );

      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      await user.click(
        screen.getByRole("radio", { name: "特定の承認者を1名に限定" }),
      );

      await waitFor(() => {
        // A combobox for the single approver selector appears
        expect(
          screen.getByRole("combobox", { name: /承認者/ }),
        ).toBeInTheDocument();
      });
    });

    it("「特定の承認者を複数選択」を選択すると複数承認者ラジオボタンが表示される", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      await user.click(
        screen.getByRole("radio", { name: "特定の承認者を複数選択" }),
      );

      await waitFor(() => {
        expect(
          screen.getByRole("radio", { name: "誰か1人が承認すれば完了" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("radio", { name: "設定した順番で承認" }),
        ).toBeInTheDocument();
      });
    });

    it("承認者設定を ADMINS から変更して戻すと追加フィールドが非表示になる", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      await user.click(
        screen.getByRole("radio", { name: "特定の承認者を複数選択" }),
      );
      // Switch back to ADMINS
      await user.click(
        screen.getByRole("radio", { name: "管理者全員 (デフォルト)" }),
      );

      await waitFor(() => {
        expect(
          screen.queryByRole("radio", { name: "誰か1人が承認すれば完了" }),
        ).not.toBeInTheDocument();
      });
    });
  });

  // ─── フォーム送信 ─────────────────────────────────────────────────────────
  describe("フォーム送信", () => {
    async function openAndFill() {
      const user = userEvent.setup();
      const { container } = renderComponent();
      await user.click(screen.getByRole("button", { name: /スタッフ登録/ }));
      await user.type(screen.getByRole("textbox", { name: "姓" }), "テスト");
      await user.type(screen.getByRole("textbox", { name: "名" }), "太郎");
      const emailInput = container.querySelector(
        'input[name="mailAddress"]',
      ) as HTMLInputElement;
      await user.type(emailInput, "test@example.com");
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
      });
      return { user, container };
    }

    it("正常なスタッフ作成フロー: すべての処理が完了し成功通知が表示される", async () => {
      mockFetchStaffsFn.mockResolvedValue([
        { id: "staff-001", mailAddress: "test@example.com" } as StaffType,
      ]);

      const { user } = await openAndFill();
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(mockCreateCognitoUserFn).toHaveBeenCalledWith(
          "test@example.com",
          "テスト",
          "太郎",
        );
      });
      await waitFor(() => {
        expect(mockAddUserToGroupFn).toHaveBeenCalledWith(
          "test@example.com",
          StaffRole.STAFF,
        );
      });
      await waitFor(() => {
        expect(mockHandleSyncCognitoUserFn).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockFetchStaffsFn).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockUpdateStaff).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "staff-001",
            familyName: "テスト",
            givenName: "太郎",
            mailAddress: "test@example.com",
          }),
        );
      });
      await waitFor(() => {
        expect(mockRefreshStaff).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "notification/push",
            payload: expect.objectContaining({ tone: "success" }),
          }),
        );
        expect(mockCloseWithoutGuard).toHaveBeenCalled();
      });
    });

    it("デフォルトの勤務形態 weekday が updateStaff に渡される", async () => {
      mockFetchStaffsFn.mockResolvedValue([
        { id: "staff-001", mailAddress: "test@example.com" } as StaffType,
      ]);

      const { user } = await openAndFill();
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(mockUpdateStaff).toHaveBeenCalledWith(
          expect.objectContaining({
            workType: "weekday",
            approverSetting: ApproverSettingMode.ADMINS,
          }),
        );
      });
    });

    it("createCognitoUser が失敗した場合、エラー通知が表示され後続処理は呼ばれない", async () => {
      mockCreateCognitoUserFn.mockRejectedValue(
        new Error("create cognito user failed"),
      );

      const { user } = await openAndFill();
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({ tone: "error" }),
          }),
        );
      });
      expect(mockAddUserToGroupFn).not.toHaveBeenCalled();
      expect(mockHandleSyncCognitoUserFn).not.toHaveBeenCalled();
    });

    it("addUserToGroup が失敗した場合、エラー通知が表示され後続処理は呼ばれない", async () => {
      mockAddUserToGroupFn.mockRejectedValue(
        new Error("add to group failed"),
      );

      const { user } = await openAndFill();
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({ tone: "error" }),
          }),
        );
      });
      expect(mockHandleSyncCognitoUserFn).not.toHaveBeenCalled();
      expect(mockFetchStaffsFn).not.toHaveBeenCalled();
    });

    it("handleSyncCognitoUser が失敗した場合、エラー通知が表示され fetchStaffs は呼ばれない", async () => {
      mockHandleSyncCognitoUserFn.mockRejectedValue(
        new Error("sync cognito user failed"),
      );

      const { user } = await openAndFill();
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({ tone: "error" }),
          }),
        );
      });
      expect(mockFetchStaffsFn).not.toHaveBeenCalled();
      expect(mockUpdateStaff).not.toHaveBeenCalled();
    });

    it("fetchStaffs でスタッフが見つからない場合、エラー通知が表示され updateStaff は呼ばれない", async () => {
      // fetchStaffs returns staff with different email
      mockFetchStaffsFn.mockResolvedValue([
        { id: "other-001", mailAddress: "other@example.com" } as StaffType,
      ]);

      const { user } = await openAndFill();
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              tone: "error",
              message: expect.stringContaining("作成したスタッフが見つかりません"),
            }),
          }),
        );
      });
      expect(mockUpdateStaff).not.toHaveBeenCalled();
    });

    it("updateStaff が失敗した場合、エラー通知が表示され closeWithoutGuard は呼ばれない", async () => {
      mockFetchStaffsFn.mockResolvedValue([
        { id: "staff-001", mailAddress: "test@example.com" } as StaffType,
      ]);
      mockUpdateStaff.mockRejectedValue(new Error("update staff failed"));

      const { user } = await openAndFill();
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({ tone: "error" }),
          }),
        );
      });
      expect(mockCloseWithoutGuard).not.toHaveBeenCalled();
    });

    it("送信中は登録ボタンが無効化される (isSubmitting = true)", async () => {
      // Make createCognitoUser hang indefinitely to inspect submitting state
      let resolveCognitoUser!: () => void;
      mockCreateCognitoUserFn.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveCognitoUser = resolve;
          }),
      );

      const { user } = await openAndFill();
      // Start submit but don't await
      void user.click(screen.getByRole("button", { name: "登録" }));

      // While submitting, the button should be disabled
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "登録" })).toBeDisabled();
      });

      // Resolve to clean up
      resolveCognitoUser();
      await waitFor(() => {
        expect(mockCreateCognitoUserFn).toHaveBeenCalled();
      });
    });
  });
});
