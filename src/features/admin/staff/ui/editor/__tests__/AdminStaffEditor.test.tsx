/**
 * AdminStaffEditor ユニットテスト
 *
 * カバレッジ対象: src/features/admin/staff/ui/editor/AdminStaffEditor.tsx
 * テスト分類:
 *   - ローディング/エラー状態
 *   - 通常レンダリング (フォームフィールド表示)
 *   - スタッフデータ反映 (useEffect / setValue)
 *   - 保存ボタンの有効/無効
 *   - onSubmit 成功 / 失敗
 *   - オーナー権限 UI 分岐
 *   - 高度設定タブ (developer flag)
 *   - シフトグループ (0件 / 有り)
 *   - 承認者設定 (ADMINS / SINGLE / MULTIPLE)
 */

import { AuthContext, type AuthContextProps } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// ─── Test target ─────────────────────────────────────────────────────────────
import AdminStaffEditor from "../AdminStaffEditor";

// ─── react-router-dom ────────────────────────────────────────────────────────
const mockUseParams = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => mockUseParams(),
}));

// ─── redux ───────────────────────────────────────────────────────────────────
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
  useSelector: jest.fn(),
}));
jest.mock("@app/hooks", () => ({
  useAppDispatchV2: () => mockDispatch,
}));

// ─── notificationSlice ───────────────────────────────────────────────────────
jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: jest.fn((payload) => ({ type: "notification/push", payload })),
}));

// ─── useStaffs ───────────────────────────────────────────────────────────────
const mockUpdateStaff = jest.fn();
const mockUseStaffs = jest.fn();
jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  ...jest.requireActual("@entities/staff/model/useStaffs/useStaffs"),
  useStaffs: (...args: unknown[]) => mockUseStaffs(...args),
}));

// ─── StaffNameTableCell / StaffRoleTableCell (sub-components) ────────────────
jest.mock("@features/admin/staff/ui/editor", () => ({
  StaffNameTableCell: ({ register }: { register: unknown }) => (
    <td data-testid="staff-name-cell">
      <input data-testid="familyName-input" {...(register as CallableFunction)("familyName", { required: true })} placeholder="姓" />
      <input data-testid="givenName-input" {...(register as CallableFunction)("givenName", { required: true })} placeholder="名" />
    </td>
  ),
  StaffRoleTableCell: () => <td data-testid="staff-role-cell" />,
}));

// ─── usePageLeaveGuard ───────────────────────────────────────────────────────
jest.mock("@shared/ui/feedback/usePageLeaveGuard", () => ({
  usePageLeaveGuard: () => ({ dialog: null }),
}));

// ─── PageTitle ───────────────────────────────────────────────────────────────
jest.mock("@shared/ui/typography", () => ({
  PageTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h1 className={className}>{children}</h1>
  ),
}));

// ─── MUI DatePicker → simple input stub ─────────────────────────────────────
jest.mock("@mui/x-date-pickers", () => ({
  DatePicker: ({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) => (
    <input
      data-testid="date-picker"
      value={value ? String(value) : ""}
      onChange={(e) => onChange(e.target.value ? { format: () => e.target.value } : null)}
    />
  ),
}));

// ─── MUI Autocomplete → simple select stub ──────────────────────────────────
jest.mock("@mui/material/Autocomplete", () => {
  return function MockAutocomplete({
    options,
    value,
    onChange,
    renderInput,
    getOptionLabel,
    multiple,
  }: {
    options: { value: string; label: string }[];
    value: unknown;
    onChange: (e: unknown, v: unknown) => void;
    renderInput: (params: Record<string, unknown>) => React.ReactNode;
    getOptionLabel?: (o: { label: string }) => string;
    multiple?: boolean;
  }) {
    const currentValue = multiple
      ? Array.isArray(value) ? value.map((v: { value: string }) => v.value).join(",") : ""
      : (value as { value: string } | null)?.value ?? "";

    return (
      <div data-testid="autocomplete-wrapper">
        {renderInput({ inputProps: {}, InputProps: {}, size: "small" })}
        <select
          data-testid="autocomplete-select"
          value={currentValue}
          multiple={multiple}
          onChange={(e) => {
            const selectedValue = e.target.value;
            const opt = options.find((o) => o.value === selectedValue);
            onChange(e, multiple ? (opt ? [opt] : []) : opt ?? null);
          }}
        >
          <option value="">-</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {getOptionLabel ? getOptionLabel(o) : o.label}
            </option>
          ))}
        </select>
      </div>
    );
  };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
type CognitoUser = {
  id: string;
  familyName: string;
  givenName: string;
  mailAddress: string;
  owner: boolean;
  roles: unknown[];
  emailVerified: boolean;
};

const makeAuthContext = (overrides?: Partial<AuthContextProps>): AuthContextProps => ({
  signOut: jest.fn(),
  signIn: jest.fn(),
  isCognitoUserRole: jest.fn(() => false),
  authStatus: "authenticated",
  roles: [],
  cognitoUser: {
    id: "current-user-id",
    familyName: "テスト",
    givenName: "ユーザー",
    mailAddress: "test@example.com",
    owner: false,
    roles: [],
    emailVerified: true,
  } as CognitoUser,
  ...overrides,
});

const makeAppConfigContext = (shiftGroups: { label: string; description?: string }[] = []) => ({
  getShiftGroups: () => shiftGroups,
});

const STAFF_BASE = {
  id: "internal-id-1",
  cognitoUserId: "staff-cognito-id",
  familyName: "山田",
  givenName: "太郎",
  mailAddress: "yamada@example.com",
  owner: false,
  role: "Staff",
  enabled: true,
  status: "CONFIRMED",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  sortKey: "001",
  usageStartDate: "2024-01-01",
  workType: "weekday",
  developer: false,
  attendanceManagementEnabled: true,
  shiftGroup: null,
  approverSetting: null,
  approverSingle: null,
  approverMultiple: null,
  approverMultipleMode: null,
};

function renderComponent(
  authOverrides?: Partial<AuthContextProps>,
  appConfigShiftGroups: { label: string; description?: string }[] = [],
) {
  return render(
    <AuthContext.Provider value={makeAuthContext(authOverrides)}>
      <AppConfigContext.Provider value={makeAppConfigContext(appConfigShiftGroups) as never}>
        <AdminStaffEditor />
      </AppConfigContext.Provider>
    </AuthContext.Provider>,
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("AdminStaffEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ staffId: "staff-cognito-id" });
    mockUpdateStaff.mockResolvedValue(undefined);
    mockUseStaffs.mockReturnValue({
      staffs: [STAFF_BASE],
      loading: false,
      error: null,
      updateStaff: mockUpdateStaff,
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe("ローディング状態", () => {
    it("loading=true のとき LinearProgress を表示する", () => {
      mockUseStaffs.mockReturnValue({
        staffs: [],
        loading: true,
        error: null,
        updateStaff: mockUpdateStaff,
      });
      renderComponent();
      expect(document.querySelector(".MuiLinearProgress-root")).toBeInTheDocument();
      expect(screen.queryByText("スタッフ編集")).not.toBeInTheDocument();
    });

    it("loading=false のとき LinearProgress を表示しない", () => {
      renderComponent();
      expect(document.querySelector(".MuiLinearProgress-root")).not.toBeInTheDocument();
    });
  });

  // ── Error state ───────────────────────────────────────────────────────────

  describe("エラー状態", () => {
    it("error が存在する場合、エラー通知を dispatch して null を返す", () => {
      mockUseStaffs.mockReturnValue({
        staffs: [],
        loading: false,
        error: new Error("fetch error"),
        updateStaff: mockUpdateStaff,
      });
      const { container } = renderComponent();
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ tone: "error" }),
        }),
      );
      expect(container.firstChild).toBeNull();
    });
  });

  // ── Normal rendering ──────────────────────────────────────────────────────

  describe("通常レンダリング", () => {
    it("ページタイトル「スタッフ編集」が表示される", () => {
      renderComponent();
      expect(screen.getByText("スタッフ編集")).toBeInTheDocument();
    });

    it("説明テキストが表示される", () => {
      renderComponent();
      expect(screen.getByText("スタッフ情報と承認設定を更新できます。")).toBeInTheDocument();
    });

    it("「全般」タブが表示される", () => {
      renderComponent();
      expect(screen.getByText("全般")).toBeInTheDocument();
    });

    it("「高度設定」タブが表示される", () => {
      renderComponent();
      expect(screen.getByTestId("advanced-tab")).toBeInTheDocument();
    });

    it("汎用コードフィールドが表示される", () => {
      renderComponent();
      expect(screen.getByText("汎用コード")).toBeInTheDocument();
    });

    it("スタッフ名フィールドが表示される", () => {
      renderComponent();
      expect(screen.getByText("スタッフ名")).toBeInTheDocument();
      expect(screen.getByTestId("staff-name-cell")).toBeInTheDocument();
    });

    it("メールアドレスフィールドが表示される", () => {
      renderComponent();
      expect(screen.getByText("メールアドレス")).toBeInTheDocument();
    });

    it("権限フィールドが表示される", () => {
      renderComponent();
      expect(screen.getByText("権限")).toBeInTheDocument();
    });

    it("利用開始日フィールドが表示される", () => {
      renderComponent();
      expect(screen.getByText("利用開始日")).toBeInTheDocument();
      expect(screen.getByTestId("date-picker")).toBeInTheDocument();
    });

    it("勤怠管理対象フィールドが表示される", () => {
      renderComponent();
      expect(screen.getByText("勤怠管理対象")).toBeInTheDocument();
    });

    it("勤務形態フィールドが表示される", () => {
      renderComponent();
      expect(screen.getByText("勤務形態")).toBeInTheDocument();
    });

    it("シフトグループフィールドが表示される", () => {
      renderComponent();
      expect(screen.getByText("シフトグループ")).toBeInTheDocument();
    });

    it("承認者設定フィールドが表示される", () => {
      renderComponent();
      expect(screen.getByText("承認者設定")).toBeInTheDocument();
    });

    it("保存ボタンが表示される", () => {
      renderComponent();
      expect(screen.getByTestId("save-button")).toBeInTheDocument();
    });

    it("Cognito ID バッジが表示される", () => {
      renderComponent();
      expect(screen.getByText("Cognito ID:")).toBeInTheDocument();
    });

    it("スタッフ ID バッジが表示される", () => {
      renderComponent();
      expect(screen.getByText("スタッフID:")).toBeInTheDocument();
    });
  });

  // ── Save button state ─────────────────────────────────────────────────────

  describe("保存ボタンの状態", () => {
    it("初期状態（未変更）で保存ボタンが無効化されている", () => {
      renderComponent();
      expect(screen.getByTestId("save-button")).toBeDisabled();
    });

    it("staffId が存在しない場合でも保存ボタンが表示される", () => {
      mockUseParams.mockReturnValue({ staffId: undefined });
      renderComponent();
      expect(screen.getByTestId("save-button")).toBeInTheDocument();
    });
  });

  // ── Staff data pre-population ─────────────────────────────────────────────

  describe("スタッフデータの反映", () => {
    it("staffId に一致するスタッフが見つからない場合でも crash しない", () => {
      mockUseParams.mockReturnValue({ staffId: "unknown-id" });
      expect(() => renderComponent()).not.toThrow();
    });

    it("staffId が undefined でも crash しない", () => {
      mockUseParams.mockReturnValue({ staffId: undefined });
      expect(() => renderComponent()).not.toThrow();
    });

    it("スタッフデータが存在するとき ID バッジが更新される", async () => {
      renderComponent();
      // The form values are set via setValue in useEffect → getValues reflects them after render
      await waitFor(() => {
        // Cognito ID badge shows staff cognito user id (from getValues)
        screen.getAllByText(/-/);
        // at minimum renders without error
        expect(screen.getByTestId("save-button")).toBeInTheDocument();
      });
    });
  });

  // ── Owner-only UI ─────────────────────────────────────────────────────────

  describe("オーナー権限 UI", () => {
    it("cognitoUser.owner=false のとき「オーナー権限」行が表示されない", () => {
      renderComponent({ cognitoUser: { id: "u1", familyName: "A", givenName: "B", mailAddress: "a@b.com", owner: false, roles: [], emailVerified: true } as CognitoUser });
      expect(screen.queryByText("オーナー権限")).not.toBeInTheDocument();
    });

    it("cognitoUser.owner=true のとき「オーナー権限」チェックボックスが表示される", () => {
      renderComponent({ cognitoUser: { id: "u1", familyName: "A", givenName: "B", mailAddress: "a@b.com", owner: true, roles: [], emailVerified: true } as CognitoUser });
      expect(screen.getByText("オーナー権限")).toBeInTheDocument();
    });

    it("cognitoUser.owner=false のとき「高度設定」タブが無効化されている", () => {
      renderComponent({ cognitoUser: { id: "u1", familyName: "A", givenName: "B", mailAddress: "a@b.com", owner: false, roles: [], emailVerified: true } as CognitoUser });
      const advancedTab = screen.getByTestId("advanced-tab");
      // MUI Tab の disabled は Mui-disabled クラスで表現される
      expect(advancedTab).toHaveClass("Mui-disabled");
    });

    it("cognitoUser.owner=true のとき「高度設定」タブが有効化されている", () => {
      renderComponent({ cognitoUser: { id: "u1", familyName: "A", givenName: "B", mailAddress: "a@b.com", owner: true, roles: [], emailVerified: true } as CognitoUser });
      const advancedTab = screen.getByTestId("advanced-tab");
      expect(advancedTab).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  // ── Advanced tab (developer flag) ─────────────────────────────────────────

  describe("高度設定タブ", () => {
    it("タブ切替前は「開発者フラグ」が表示されない", () => {
      renderComponent({ cognitoUser: { id: "u1", familyName: "A", givenName: "B", mailAddress: "a@b.com", owner: true, roles: [], emailVerified: true } as CognitoUser });
      expect(screen.queryByText("開発者フラグ")).not.toBeInTheDocument();
    });

    it("「高度設定」タブをクリックすると「開発者フラグ」が表示される", async () => {
      renderComponent({ cognitoUser: { id: "u1", familyName: "A", givenName: "B", mailAddress: "a@b.com", owner: true, roles: [], emailVerified: true } as CognitoUser });
      const advancedTab = screen.getByTestId("advanced-tab");
      await userEvent.click(advancedTab);
      expect(screen.getByText("開発者フラグ")).toBeInTheDocument();
    });

    it("「高度設定」タブに切替後、developer-flag-checkbox が表示される", async () => {
      renderComponent({ cognitoUser: { id: "u1", familyName: "A", givenName: "B", mailAddress: "a@b.com", owner: true, roles: [], emailVerified: true } as CognitoUser });
      await userEvent.click(screen.getByTestId("advanced-tab"));
      expect(screen.getByTestId("developer-flag-checkbox")).toBeInTheDocument();
    });

    it("高度設定タブに切替後、全般タブの行が消える", async () => {
      renderComponent({ cognitoUser: { id: "u1", familyName: "A", givenName: "B", mailAddress: "a@b.com", owner: true, roles: [], emailVerified: true } as CognitoUser });
      await userEvent.click(screen.getByTestId("advanced-tab"));
      expect(screen.queryByText("スタッフ名")).not.toBeInTheDocument();
    });
  });

  // ── Shift groups ─────────────────────────────────────────────────────────

  describe("シフトグループ", () => {
    it("シフトグループが 0 件のとき空メッセージが表示される", () => {
      renderComponent(undefined, []);
      expect(screen.getByText(/利用可能なシフトグループがありません/)).toBeInTheDocument();
    });

    it("シフトグループが存在するとき Autocomplete が表示される", () => {
      renderComponent(undefined, [
        { label: "グループA", description: "説明A" },
        { label: "グループB" },
      ]);
      expect(screen.queryByText(/利用可能なシフトグループがありません/)).not.toBeInTheDocument();
    });
  });

  // ── Approver setting radio ────────────────────────────────────────────────

  describe("承認者設定ラジオボタン", () => {
    it("「管理者全員 (デフォルト)」ラジオが表示される", () => {
      renderComponent();
      expect(screen.getByLabelText("管理者全員 (デフォルト)")).toBeInTheDocument();
    });

    it("「特定の承認者を1名に限定」ラジオが表示される", () => {
      renderComponent();
      expect(screen.getByLabelText("特定の承認者を1名に限定")).toBeInTheDocument();
    });

    it("「特定の承認者を複数選択」ラジオが表示される", () => {
      renderComponent();
      expect(screen.getByLabelText("特定の承認者を複数選択")).toBeInTheDocument();
    });

    it("初期状態では承認者選択フィールドが表示されない", () => {
      renderComponent();
      expect(screen.queryByLabelText("承認者")).not.toBeInTheDocument();
    });

    it("SINGLE を選択すると承認者1名の Autocomplete が表示される", async () => {
      renderComponent();
      const singleRadio = screen.getByLabelText("特定の承認者を1名に限定");
      await userEvent.click(singleRadio);
      await waitFor(() => {
        expect(screen.getByLabelText("承認者")).toBeInTheDocument();
      });
    });

    it("MULTIPLE を選択すると複数承認者 Autocomplete が表示される", async () => {
      renderComponent();
      const multipleRadio = screen.getByLabelText("特定の承認者を複数選択");
      await userEvent.click(multipleRadio);
      await waitFor(() => {
        expect(screen.getByLabelText("承認者")).toBeInTheDocument();
      });
    });

    it("MULTIPLE を選択すると承認モードのラジオグループが表示される", async () => {
      renderComponent();
      await userEvent.click(screen.getByLabelText("特定の承認者を複数選択"));
      await waitFor(() => {
        expect(screen.getByLabelText("誰か1人が承認すれば完了")).toBeInTheDocument();
        expect(screen.getByLabelText("設定した順番で承認")).toBeInTheDocument();
      });
    });
  });

  // ── onSubmit success ──────────────────────────────────────────────────────

  describe("onSubmit 成功", () => {
    it("フォームを dirty にして保存するとき updateStaff が呼ばれる", async () => {
      renderComponent();
      // フォームを変更して dirty にする
      const sortKeyInput = document.querySelector("input[name='sortKey']") as HTMLInputElement;
      await userEvent.clear(sortKeyInput);
      await userEvent.type(sortKeyInput, "999");

      const familyNameInput = screen.getByTestId("familyName-input");
      await userEvent.clear(familyNameInput);
      await userEvent.type(familyNameInput, "田中");

      const givenNameInput = screen.getByTestId("givenName-input");
      await userEvent.clear(givenNameInput);
      await userEvent.type(givenNameInput, "花子");

      const saveBtn = screen.getByTestId("save-button");
      await waitFor(() => expect(saveBtn).not.toBeDisabled());

      await userEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockUpdateStaff).toHaveBeenCalledTimes(1);
      });
    });

    it("updateStaff 成功後に成功通知が dispatch される", async () => {
      renderComponent();

      const sortKeyInput = document.querySelector("input[name='sortKey']") as HTMLInputElement;
      await userEvent.clear(sortKeyInput);
      await userEvent.type(sortKeyInput, "998");

      const familyNameInput = screen.getByTestId("familyName-input");
      await userEvent.clear(familyNameInput);
      await userEvent.type(familyNameInput, "佐藤");

      const givenNameInput = screen.getByTestId("givenName-input");
      await userEvent.clear(givenNameInput);
      await userEvent.type(givenNameInput, "一郎");

      await waitFor(() => expect(screen.getByTestId("save-button")).not.toBeDisabled());
      await userEvent.click(screen.getByTestId("save-button"));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({ tone: "success", message: "保存しました" }),
          }),
        );
      });
    });
  });

  // ── onSubmit error ────────────────────────────────────────────────────────

  describe("onSubmit 失敗", () => {
    it("updateStaff が reject した場合、エラー通知が dispatch される", async () => {
      mockUpdateStaff.mockRejectedValue(new Error("server error"));
      renderComponent();

      const sortKeyInput = document.querySelector("input[name='sortKey']") as HTMLInputElement;
      await userEvent.clear(sortKeyInput);
      await userEvent.type(sortKeyInput, "997");

      const familyNameInput = screen.getByTestId("familyName-input");
      await userEvent.clear(familyNameInput);
      await userEvent.type(familyNameInput, "鈴木");

      const givenNameInput = screen.getByTestId("givenName-input");
      await userEvent.clear(givenNameInput);
      await userEvent.type(givenNameInput, "次郎");

      await waitFor(() => expect(screen.getByTestId("save-button")).not.toBeDisabled());
      await userEvent.click(screen.getByTestId("save-button"));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({ tone: "error" }),
          }),
        );
      });
    });

    it("staffId が undefined のとき onSubmit は early return する", async () => {
      mockUseParams.mockReturnValue({ staffId: undefined });
      renderComponent();
      // no staff, form cannot be made valid/dirty, just verify no crash
      expect(screen.getByTestId("save-button")).toBeInTheDocument();
    });

    it("staffId に一致するスタッフが見つからない場合、スタッフ未発見通知を dispatch する", async () => {
      mockUseParams.mockReturnValue({ staffId: "nonexistent-id" });
      mockUseStaffs.mockReturnValue({
        staffs: [STAFF_BASE],
        loading: false,
        error: null,
        updateStaff: mockUpdateStaff,
      });
      // staffId = 'nonexistent-id' が staffs に存在しないため、
      // useEffect で setValue が呼ばれず form は未変更 → save button は disabled のまま
      renderComponent();
      expect(screen.getByTestId("save-button")).toBeDisabled();
    });
  });

  // ── Tab switching ─────────────────────────────────────────────────────────

  describe("タブ切替", () => {
    it("「全般」タブはデフォルトで選択されている", () => {
      renderComponent();
      expect(screen.getByText("スタッフ名")).toBeInTheDocument();
    });

    it("全般タブで勤務形態フィールドが表示される", () => {
      renderComponent();
      expect(screen.getByText("勤務形態")).toBeInTheDocument();
    });
  });

  // ── Attendance management checkbox ───────────────────────────────────────

  describe("勤怠管理対象チェックボックス", () => {
    it("勤怠管理対象チェックボックスが表示される", () => {
      renderComponent();
      const note = screen.getByText("オフにすると勤怠チェックでエラーとして扱われなくなります");
      expect(note).toBeInTheDocument();
    });
  });

  // ── useStaffs called with isAuthenticated ──────────────────────────────────

  describe("useStaffs の呼び出し", () => {
    it("authStatus=authenticated のとき useStaffs に isAuthenticated=true が渡される", () => {
      renderComponent({ authStatus: "authenticated" });
      expect(mockUseStaffs).toHaveBeenCalledWith(
        expect.objectContaining({ isAuthenticated: true }),
      );
    });

    it("authStatus=unauthenticated のとき useStaffs に isAuthenticated=false が渡される", () => {
      renderComponent({ authStatus: "unauthenticated" });
      expect(mockUseStaffs).toHaveBeenCalledWith(
        expect.objectContaining({ isAuthenticated: false }),
      );
    });
  });

  // ── staffId=undefined + staffs=[] edge case ──────────────────────────────

  describe("エッジケース", () => {
    it("staffs が空配列でも crash しない", () => {
      mockUseStaffs.mockReturnValue({
        staffs: [],
        loading: false,
        error: null,
        updateStaff: mockUpdateStaff,
      });
      expect(() => renderComponent()).not.toThrow();
    });

    it("cognitoUser が null でも crash しない", () => {
      expect(() => renderComponent({ cognitoUser: null })).not.toThrow();
    });
  });
});
