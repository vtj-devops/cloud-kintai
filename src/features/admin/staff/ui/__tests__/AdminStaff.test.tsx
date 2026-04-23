// ─── Imports (must come before jest.mock) ──────────────────────────────────────
import { AuthContext } from "@app/providers/auth/AuthContext";
import { StaffRole, type StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import AdminStaff from "../AdminStaff";

// ─── Mock fn variables ──────────────────────────────────────────────────────────
const mockDispatch = jest.fn();
const mockUseStaffs = jest.fn();

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

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  ...jest.requireActual<typeof import("@entities/staff/model/useStaffs/useStaffs")>(
    "@entities/staff/model/useStaffs/useStaffs",
  ),
  useStaffs: (...args: unknown[]) => mockUseStaffs(...args),
}));

jest.mock("@features/admin/staff/ui/actions", () => ({
  CreateStaffDialog: () => <div data-testid="create-staff-dialog" />,
  SyncCognitoUser: () => <div data-testid="sync-cognito-user" />,
}));

jest.mock("@features/admin/staff/ui/EditButton", () => ({
  EditButton: ({ staff }: { staff: StaffType }) => (
    <button type="button" aria-label="スタッフを編集" data-testid={`edit-btn-${staff.id}`}>
      編集
    </button>
  ),
}));

jest.mock("@features/admin/staff/ui/actions", () => ({
  CreateStaffDialog: () => <div data-testid="create-staff-dialog" />,
  SyncCognitoUser: () => <div data-testid="sync-cognito-user" />,
  MoreActionButton: ({ staff }: { staff: StaffType }) => (
    <button type="button" data-testid={`more-btn-${staff.id}`}>
      その他
    </button>
  ),
}));

jest.mock("@entities/staff/lib/attendanceManagement", () => ({
  isAttendanceManagementEnabled: jest.fn(() => true),
}));

jest.mock("@entities/staff/lib/workTypeOptions", () => ({
  getWorkTypeLabel: jest.fn(() => "平日勤務"),
}));

// SCSS mock (handled by jest config identity-obj-proxy, but explicit for safety)
jest.mock("@/features/admin/staff/ui/styles.scss", () => ({}), { virtual: true });

// ─── Test data factory ──────────────────────────────────────────────────────────
function makeStaff(overrides: Partial<StaffType> = {}): StaffType {
  return {
    id: "staff-1",
    cognitoUserId: "cognito-1",
    familyName: "山田",
    givenName: "太郎",
    mailAddress: "yamada@example.com",
    owner: false,
    role: StaffRole.STAFF,
    enabled: true,
    status: "CONFIRMED",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-06-01T10:00:00Z",
    sortKey: "yamada",
    version: 1,
    ...overrides,
  };
}

function makeDefaultUseStaffsReturn(overrides: Partial<ReturnType<typeof mockUseStaffs>> = {}) {
  return {
    staffs: [],
    loading: false,
    error: null,
    refreshStaff: jest.fn(),
    createStaff: jest.fn(),
    updateStaff: jest.fn(),
    deleteStaff: jest.fn(),
    getAllStaffs: jest.fn(),
    ...overrides,
  };
}

// ─── Auth context ───────────────────────────────────────────────────────────────
const authenticatedAuthContext = {
  authStatus: "authenticated" as const,
  session: { roles: [] },
  signOut: jest.fn(),
  signIn: jest.fn(),
  isCognitoUserRole: jest.fn(() => false),
} as unknown as React.ContextType<typeof AuthContext>;

// ─── Render helper ──────────────────────────────────────────────────────────────
function renderAdminStaff(
  authContextOverrides: Partial<React.ContextType<typeof AuthContext>> = {},
) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ ...authenticatedAuthContext, ...authContextOverrides }}>
        <AdminStaff />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────────
describe("AdminStaff", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseStaffs.mockReturnValue(makeDefaultUseStaffsReturn());
  });

  describe("ローディング状態", () => {
    it("loading=trueのとき進行状態バーが表示される", () => {
      mockUseStaffs.mockReturnValue(makeDefaultUseStaffsReturn({ loading: true }));
      renderAdminStaff();
      // The loading indicator is rendered as an animate-pulse div inside a progress bar
      const container = document.querySelector(".animate-pulse");
      expect(container).toBeInTheDocument();
    });

    it("loading=trueのときスタッフテーブルは表示されない", () => {
      mockUseStaffs.mockReturnValue(makeDefaultUseStaffsReturn({ loading: true }));
      renderAdminStaff();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  describe("エラー状態", () => {
    it("error発生時はエラー通知が送出される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({ error: new Error("network error") }),
      );
      renderAdminStaff();
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ tone: "error" }),
        }),
      );
    });

    it("error発生時はコンポーネントがnullをレンダリングする", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({ error: new Error("network error") }),
      );
      const { container } = renderAdminStaff();
      // When error is present, the component returns null
      expect(container.firstChild).toBeNull();
    });
  });

  describe("スタッフ一覧の表示", () => {
    it("スタッフが存在しない場合に空メッセージが表示される", () => {
      renderAdminStaff();
      expect(screen.getByText("条件に一致するスタッフが見つかりません。")).toBeInTheDocument();
    });

    it("スタッフが存在する場合に名前が表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({ staffs: [makeStaff()] }),
      );
      renderAdminStaff();
      expect(screen.getByText("山田 太郎")).toBeInTheDocument();
    });

    it("スタッフのメールアドレスが表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({ staffs: [makeStaff()] }),
      );
      renderAdminStaff();
      expect(screen.getByText("yamada@example.com")).toBeInTheDocument();
    });

    it("複数のスタッフが全員表示される", () => {
      const staffList = [
        makeStaff({ id: "s1", familyName: "山田", givenName: "太郎" }),
        makeStaff({ id: "s2", familyName: "鈴木", givenName: "花子", mailAddress: "suzuki@example.com" }),
      ];
      mockUseStaffs.mockReturnValue(makeDefaultUseStaffsReturn({ staffs: staffList }));
      renderAdminStaff();
      expect(screen.getByText("山田 太郎")).toBeInTheDocument();
      expect(screen.getByText("鈴木 花子")).toBeInTheDocument();
    });

    it("名前が設定されていないスタッフは「(未設定)」と表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({
          staffs: [makeStaff({ familyName: null, givenName: null })],
        }),
      );
      renderAdminStaff();
      expect(screen.getByText("(未設定)")).toBeInTheDocument();
    });

    it("有効なスタッフは「有効」バッジが表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({ staffs: [makeStaff({ enabled: true })] }),
      );
      renderAdminStaff();
      expect(screen.getByText("有効")).toBeInTheDocument();
    });

    it("無効なスタッフは「無効」バッジが表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({ staffs: [makeStaff({ enabled: false })] }),
      );
      renderAdminStaff();
      expect(screen.getByText("無効")).toBeInTheDocument();
    });

    it("CONFIRMEDステータスは「確認済み」と表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({ staffs: [makeStaff({ status: "CONFIRMED" })] }),
      );
      renderAdminStaff();
      expect(screen.getByText("確認済み")).toBeInTheDocument();
    });

    it("FORCE_CHANGE_PASSWORDステータスは「パスワード変更必要」と表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({
          staffs: [makeStaff({ status: "FORCE_CHANGE_PASSWORD" })],
        }),
      );
      renderAdminStaff();
      expect(screen.getByText("パスワード変更必要")).toBeInTheDocument();
    });

    it("不明なステータスは「***」と表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({
          staffs: [makeStaff({ status: "UNKNOWN_STATUS" as string })],
        }),
      );
      renderAdminStaff();
      expect(screen.getByText("***")).toBeInTheDocument();
    });

    it("ownerフラグがtrueのスタッフは「オーナー」と表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({
          staffs: [makeStaff({ owner: true, role: StaffRole.STAFF })],
        }),
      );
      renderAdminStaff();
      expect(screen.getByText("オーナー")).toBeInTheDocument();
    });

    it("管理者ロールのスタッフは「管理者」と表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({
          staffs: [makeStaff({ role: StaffRole.ADMIN })],
        }),
      );
      renderAdminStaff();
      expect(screen.getByText("管理者")).toBeInTheDocument();
    });

    it("スタッフの作成日時が YYYY/MM/DD HH:mm 形式で表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({
          staffs: [makeStaff({ createdAt: "2024-01-15T09:00:00Z" })],
        }),
      );
      renderAdminStaff();
      const expectedDate = dayjs("2024-01-15T09:00:00Z").format("YYYY/MM/DD HH:mm");
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    it("各スタッフ行に編集ボタンが表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({ staffs: [makeStaff({ id: "staff-1" })] }),
      );
      renderAdminStaff();
      expect(screen.getByTestId("edit-btn-staff-1")).toBeInTheDocument();
    });

    it("各スタッフ行にその他アクションボタンが表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({ staffs: [makeStaff({ id: "staff-1" })] }),
      );
      renderAdminStaff();
      expect(screen.getByTestId("more-btn-staff-1")).toBeInTheDocument();
    });
  });

  describe("統計カード", () => {
    it("登録スタッフ数が正しく表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({
          staffs: [makeStaff({ id: "s1" }), makeStaff({ id: "s2" })],
        }),
      );
      renderAdminStaff();
      // stat cards: "登録スタッフ" shows total
      const statLabel = screen.getByText("登録スタッフ");
      const statCard = statLabel.closest(".admin-staff-stat-card");
      expect(statCard).toBeInTheDocument();
      expect(statCard?.querySelector(".admin-staff-stat-value")).toHaveTextContent("2");
    });

    it("有効アカウント数が正しく表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({
          staffs: [
            makeStaff({ id: "s1", enabled: true }),
            makeStaff({ id: "s2", enabled: false }),
            makeStaff({ id: "s3", enabled: true }),
          ],
        }),
      );
      renderAdminStaff();
      const statLabel = screen.getByText("有効アカウント");
      const statCard = statLabel.closest(".admin-staff-stat-card");
      expect(statCard?.querySelector(".admin-staff-stat-value")).toHaveTextContent("2");
    });

    it("パスワード変更待ち数が正しく表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({
          staffs: [
            makeStaff({ id: "s1", status: "FORCE_CHANGE_PASSWORD" }),
            makeStaff({ id: "s2", status: "CONFIRMED" }),
            makeStaff({ id: "s3", status: "FORCE_CHANGE_PASSWORD" }),
          ],
        }),
      );
      renderAdminStaff();
      const statLabel = screen.getByText("パスワード変更待ち");
      const statCard = statLabel.closest(".admin-staff-stat-card");
      expect(statCard?.querySelector(".admin-staff-stat-value")).toHaveTextContent("2");
    });
  });

  describe("検索フィルター", () => {
    const staffList = [
      makeStaff({ id: "s1", familyName: "山田", givenName: "太郎", mailAddress: "yamada@example.com", sortKey: "a" }),
      makeStaff({ id: "s2", familyName: "鈴木", givenName: "花子", mailAddress: "suzuki@example.com", sortKey: "b" }),
      makeStaff({ id: "s3", familyName: "田中", givenName: "次郎", mailAddress: "tanaka@example.com", sortKey: "c" }),
    ];

    beforeEach(() => {
      mockUseStaffs.mockReturnValue(makeDefaultUseStaffsReturn({ staffs: staffList }));
    });

    it("検索ボックスが表示される", () => {
      renderAdminStaff();
      expect(
        screen.getByPlaceholderText("スタッフ名・スタッフID・メールで検索"),
      ).toBeInTheDocument();
    });

    it("スタッフ名で検索するとマッチするスタッフだけ表示される", async () => {
      const user = userEvent.setup();
      renderAdminStaff();

      const searchInput = screen.getByPlaceholderText("スタッフ名・スタッフID・メールで検索");
      await user.type(searchInput, "山田");

      expect(screen.getByText("山田 太郎")).toBeInTheDocument();
      expect(screen.queryByText("鈴木 花子")).not.toBeInTheDocument();
      expect(screen.queryByText("田中 次郎")).not.toBeInTheDocument();
    });

    it("メールアドレスで検索するとマッチするスタッフだけ表示される", async () => {
      const user = userEvent.setup();
      renderAdminStaff();

      const searchInput = screen.getByPlaceholderText("スタッフ名・スタッフID・メールで検索");
      await user.type(searchInput, "suzuki");

      expect(screen.queryByText("山田 太郎")).not.toBeInTheDocument();
      expect(screen.getByText("鈴木 花子")).toBeInTheDocument();
    });

    it("空の検索クエリのときは全スタッフが表示される", async () => {
      const user = userEvent.setup();
      renderAdminStaff();

      const searchInput = screen.getByPlaceholderText("スタッフ名・スタッフID・メールで検索");
      await user.type(searchInput, "山田");
      await user.clear(searchInput);

      expect(screen.getByText("山田 太郎")).toBeInTheDocument();
      expect(screen.getByText("鈴木 花子")).toBeInTheDocument();
      expect(screen.getByText("田中 次郎")).toBeInTheDocument();
    });

    it("検索にマッチしない場合は空メッセージが表示される", async () => {
      const user = userEvent.setup();
      renderAdminStaff();

      const searchInput = screen.getByPlaceholderText("スタッフ名・スタッフID・メールで検索");
      await user.type(searchInput, "存在しない名前");

      expect(screen.getByText("条件に一致するスタッフが見つかりません。")).toBeInTheDocument();
    });

    it("表示件数カウンターが正しく更新される", async () => {
      const user = userEvent.setup();
      renderAdminStaff();

      const searchInput = screen.getByPlaceholderText("スタッフ名・スタッフID・メールで検索");
      await user.type(searchInput, "山田");

      expect(screen.getByText(/表示件数: 1 \/ 3/)).toBeInTheDocument();
    });

    it("全件表示時のカウンターが正しい", () => {
      renderAdminStaff();
      expect(screen.getByText(/表示件数: 3 \/ 3/)).toBeInTheDocument();
    });

    it("大文字小文字を区別せずに検索できる", async () => {
      const user = userEvent.setup();
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({
          staffs: [makeStaff({ id: "s1", familyName: null, givenName: null, mailAddress: "YAMADA@EXAMPLE.COM" })],
        }),
      );
      renderAdminStaff();

      const searchInput = screen.getByPlaceholderText("スタッフ名・スタッフID・メールで検索");
      await user.type(searchInput, "yamada");

      expect(screen.queryByText("条件に一致するスタッフが見つかりません。")).not.toBeInTheDocument();
    });

    it("スペース区切りの名前でも検索できる", async () => {
      const user = userEvent.setup();
      renderAdminStaff();

      const searchInput = screen.getByPlaceholderText("スタッフ名・スタッフID・メールで検索");
      await user.type(searchInput, "山田 太郎");

      expect(screen.getByText("山田 太郎")).toBeInTheDocument();
    });
  });

  describe("CreateStaffDialogとSyncCognitoUserが表示される", () => {
    it("CreateStaffDialogが表示される", () => {
      renderAdminStaff();
      expect(screen.getByTestId("create-staff-dialog")).toBeInTheDocument();
    });

    it("SyncCognitoUserが表示される", () => {
      renderAdminStaff();
      expect(screen.getByTestId("sync-cognito-user")).toBeInTheDocument();
    });
  });

  describe("テーブルのヘッダー", () => {
    it("テーブルのヘッダーが表示される", () => {
      renderAdminStaff();
      expect(screen.getByText("アカウント状態")).toBeInTheDocument();
      expect(screen.getByText("ステータス")).toBeInTheDocument();
      expect(screen.getByText("名前")).toBeInTheDocument();
      expect(screen.getByText("メールアドレス")).toBeInTheDocument();
      expect(screen.getByText("権限")).toBeInTheDocument();
      expect(screen.getByText("勤怠管理")).toBeInTheDocument();
      expect(screen.getByText("勤務形態")).toBeInTheDocument();
      expect(screen.getByText("作成日時")).toBeInTheDocument();
      expect(screen.getByText("更新日時")).toBeInTheDocument();
    });
  });

  describe("sortKeyによるソート", () => {
    it("スタッフがsortKeyの昇順で表示される", () => {
      mockUseStaffs.mockReturnValue(
        makeDefaultUseStaffsReturn({
          staffs: [
            makeStaff({ id: "s1", familyName: "田中", givenName: "次郎", sortKey: "c", mailAddress: "c@example.com" }),
            makeStaff({ id: "s2", familyName: "山田", givenName: "太郎", sortKey: "a", mailAddress: "a@example.com" }),
            makeStaff({ id: "s3", familyName: "鈴木", givenName: "花子", sortKey: "b", mailAddress: "b@example.com" }),
          ],
        }),
      );
      renderAdminStaff();
      const names = screen.getAllByText(/太郎|花子|次郎/);
      // "山田 太郎" (sortKey a) should appear before "鈴木 花子" (b) and "田中 次郎" (c)
      const text = names.map((el) => el.textContent);
      expect(text[0]).toContain("太郎");
      expect(text[1]).toContain("花子");
      expect(text[2]).toContain("次郎");
    });
  });
});
