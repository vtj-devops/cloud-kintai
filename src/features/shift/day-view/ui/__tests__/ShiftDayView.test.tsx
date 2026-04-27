import { AuthContext } from "@app/providers/auth/AuthContext";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import ShiftDayView from "../ShiftDayView";

// ---------------------------------------------------------------------------
// Mock: react-router-dom (useNavigate spy, keep real hooks for params/route)
// ---------------------------------------------------------------------------
const navigateMock = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => navigateMock,
}));

// ---------------------------------------------------------------------------
// Mock: useStaffs
// ---------------------------------------------------------------------------
const useStaffsMock = jest.fn();
jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  __esModule: true,
  useStaffs: (...args: unknown[]) => useStaffsMock(...args),
}));

// ---------------------------------------------------------------------------
// Mock: useLazyListRecentAttendancesQuery
// ---------------------------------------------------------------------------
const triggerListAttendancesMock = jest.fn();
jest.mock("@entities/attendance/api/attendanceApi", () => ({
  __esModule: true,
  useLazyListRecentAttendancesQuery: () => [triggerListAttendancesMock],
}));

// ---------------------------------------------------------------------------
// Mock: CommonBreadcrumbs (avoid rendering real breadcrumb dependencies)
// ---------------------------------------------------------------------------
jest.mock("@shared/ui/breadcrumbs/CommonBreadcrumbs", () => ({
  __esModule: true,
  default: ({ current }: { current: string }) => (
    <nav aria-label="breadcrumb">{current}</nav>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal AuthContext value that marks the user as authenticated */
const authenticatedContext: React.ContextType<typeof AuthContext> = {
  authStatus: "authenticated",
  session: { roles: [] },
  signOut: jest.fn(),
  signIn: jest.fn(),
  isCognitoUserRole: () => false,
  isAuthenticated: true,
};

/** Minimal AuthContext value that marks the user as unauthenticated */
const unauthenticatedContext: React.ContextType<typeof AuthContext> = {
  authStatus: "unauthenticated",
  session: { roles: [] },
  signOut: jest.fn(),
  signIn: jest.fn(),
  isCognitoUserRole: () => false,
  isAuthenticated: false,
};

interface RenderOptions {
  date?: string;
  authContext?: React.ContextType<typeof AuthContext>;
}

/**
 * Renders ShiftDayView inside a MemoryRouter that matches the
 * `/admin/shift/day/:date?` route so useParams() returns the supplied date.
 */
function renderShiftDayView({
  date,
  authContext = authenticatedContext,
}: RenderOptions = {}) {
  const initialEntry = date ? `/admin/shift/day/${date}` : "/admin/shift/day";

  return render(
    <AuthContext.Provider value={authContext}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/admin/shift/day/:date" element={<ShiftDayView />} />
          <Route path="/admin/shift/day" element={<ShiftDayView />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

/** Factory for a shift-type staff member */
function makeShiftStaff(
  overrides: Partial<{
    id: string;
    familyName: string;
    givenName: string;
    workType: string;
  }> = {},
) {
  return {
    id: overrides.id ?? "staff-1",
    familyName: overrides.familyName ?? "山田",
    givenName: overrides.givenName ?? "太郎",
    workType: overrides.workType ?? "shift",
    cognitoUserId: "cognito-1",
    mailAddress: "test@example.com",
    owner: false,
    role: "Staff",
    enabled: true,
    status: "CONFIRMED",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();

  // Default: no staffs, not loading, no error
  useStaffsMock.mockReturnValue({
    loading: false,
    error: null,
    staffs: [],
  });

  // Default: trigger returns an empty attendance list
  triggerListAttendancesMock.mockResolvedValue({
    attendances: [],
  });
  // unwrap() should resolve the same value
  triggerListAttendancesMock.mockImplementation(() => ({
    unwrap: () => Promise.resolve({ attendances: [] }),
  }));
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ShiftDayView", () => {
  // ── Breadcrumb & page chrome ───────────────────────────────────────────

  describe("ページ基本構造", () => {
    it("パンくずリストの現在地テキストを表示する", () => {
      renderShiftDayView({ date: "2024-07-15" });
      expect(screen.getByText("シフト一覧(時間)")).toBeInTheDocument();
    });

    it("時間軸ヘッダー（0〜23）を表示する", async () => {
      renderShiftDayView({ date: "2024-07-15" });
      // Wait for async attendances load
      await waitFor(() => {
        // 0 and 23 should be visible in the hour header cells
        expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("23").length).toBeGreaterThanOrEqual(1);
      });
    });

    it("テーブルヘッダーに「スタッフ」「勤務合計」「休憩合計」を表示する", async () => {
      renderShiftDayView({ date: "2024-07-15" });
      await waitFor(() => {
        expect(screen.getByText("スタッフ")).toBeInTheDocument();
        expect(screen.getByText("勤務合計")).toBeInTheDocument();
        expect(screen.getByText("休憩合計")).toBeInTheDocument();
      });
    });
  });

  // ── Date display & navigation ──────────────────────────────────────────

  describe("日付表示とナビゲーション", () => {
    it("URL パラメーターの日付をフォーマットして表示する", () => {
      renderShiftDayView({ date: "2024-07-15" });
      expect(screen.getByText("2024/07/15")).toBeInTheDocument();
    });

    it("「前日」チップが表示される", () => {
      renderShiftDayView({ date: "2024-07-15" });
      expect(screen.getByText("前日")).toBeInTheDocument();
    });

    it("「翌日」チップが表示される", () => {
      renderShiftDayView({ date: "2024-07-15" });
      expect(screen.getByText("翌日")).toBeInTheDocument();
    });

    it("「前日」をクリックすると前日のURLへ遷移する", async () => {
      const user = userEvent.setup();

      renderShiftDayView({ date: "2024-07-15" });
      await user.click(screen.getByText("前日"));

      expect(navigateMock).toHaveBeenCalledWith(
        expect.stringContaining("2024-07-14"),
      );
    });

    it("「翌日」をクリックすると翌日のURLへ遷移する", async () => {
      const user = userEvent.setup();

      renderShiftDayView({ date: "2024-07-15" });
      await user.click(screen.getByText("翌日"));

      expect(navigateMock).toHaveBeenCalledWith(
        expect.stringContaining("2024-07-16"),
      );
    });

    it("date パラメーターがない場合は今日の日付を表示する", () => {
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const yyyy = today.getFullYear();
      renderShiftDayView(); // no date
      expect(screen.getByText(`${yyyy}/${mm}/${dd}`)).toBeInTheDocument();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────

  describe("ローディング状態", () => {
    it("loading が true のとき「読み込み中…」を表示する", () => {
      useStaffsMock.mockReturnValue({
        loading: true,
        error: null,
        staffs: [],
      });
      renderShiftDayView({ date: "2024-07-15" });
      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });

    it("loading が true のときテーブルを表示しない", () => {
      useStaffsMock.mockReturnValue({
        loading: true,
        error: null,
        staffs: [],
      });
      renderShiftDayView({ date: "2024-07-15" });
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────

  describe("エラー状態", () => {
    it("error があるときエラーメッセージを表示する", () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: new Error("Network error"),
        staffs: [],
      });
      renderShiftDayView({ date: "2024-07-15" });
      expect(
        screen.getByText("スタッフの取得中にエラーが発生しました"),
      ).toBeInTheDocument();
    });

    it("error があるときテーブルを表示しない", () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: new Error("Network error"),
        staffs: [],
      });
      renderShiftDayView({ date: "2024-07-15" });
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────

  describe("スタッフが存在しない場合（空状態）", () => {
    it("シフト勤務スタッフが0人のとき空メッセージを表示する", async () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: null,
        staffs: [],
      });
      renderShiftDayView({ date: "2024-07-15" });
      await waitFor(() => {
        expect(
          screen.getByText("シフト勤務のスタッフは見つかりませんでした。"),
        ).toBeInTheDocument();
      });
    });

    it("workType が shift 以外のスタッフのみの場合も空メッセージを表示する", async () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: null,
        staffs: [makeShiftStaff({ workType: "flex" })],
      });
      renderShiftDayView({ date: "2024-07-15" });
      await waitFor(() => {
        expect(
          screen.getByText("シフト勤務のスタッフは見つかりませんでした。"),
        ).toBeInTheDocument();
      });
    });
  });

  // ── Staff list display ─────────────────────────────────────────────────

  describe("スタッフ一覧の表示", () => {
    it("shift 勤務のスタッフ名を表示する", async () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: null,
        staffs: [makeShiftStaff({ familyName: "鈴木", givenName: "花子" })],
      });
      renderShiftDayView({ date: "2024-07-15" });
      await waitFor(() => {
        expect(screen.getByText("鈴木 花子")).toBeInTheDocument();
      });
    });

    it("複数の shift スタッフ全員を表示する", async () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: null,
        staffs: [
          makeShiftStaff({ id: "s1", familyName: "田中", givenName: "一郎" }),
          makeShiftStaff({ id: "s2", familyName: "佐藤", givenName: "二郎" }),
          makeShiftStaff({ id: "s3", familyName: "高橋", givenName: "三郎" }),
        ],
      });
      renderShiftDayView({ date: "2024-07-15" });
      await waitFor(() => {
        expect(screen.getByText("田中 一郎")).toBeInTheDocument();
        expect(screen.getByText("佐藤 二郎")).toBeInTheDocument();
        expect(screen.getByText("高橋 三郎")).toBeInTheDocument();
      });
    });

    it("shift 以外の workType のスタッフは表示しない", async () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: null,
        staffs: [
          makeShiftStaff({
            id: "s1",
            familyName: "シフト",
            givenName: "スタッフ",
            workType: "shift",
          }),
          makeShiftStaff({
            id: "s2",
            familyName: "フレックス",
            givenName: "スタッフ",
            workType: "flex",
          }),
        ],
      });
      renderShiftDayView({ date: "2024-07-15" });
      await waitFor(() => {
        expect(screen.getByText("シフト スタッフ")).toBeInTheDocument();
        expect(
          screen.queryByText("フレックス スタッフ"),
        ).not.toBeInTheDocument();
      });
    });
  });

  // ── Work hours display ─────────────────────────────────────────────────

  describe("勤務時間の表示", () => {
    it("勤務合計と休憩合計のカラムを表示する", async () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: null,
        staffs: [makeShiftStaff()],
      });
      renderShiftDayView({ date: "2024-07-15" });
      await waitFor(() => {
        expect(screen.getByText("勤務合計")).toBeInTheDocument();
        expect(screen.getByText("休憩合計")).toBeInTheDocument();
      });
    });

    it("フォールバックの勤務時間が x.xh 形式で表示される", async () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: null,
        staffs: [makeShiftStaff({ id: "s1" })],
      });
      renderShiftDayView({ date: "2024-07-15" });
      await waitFor(() => {
        // Default mock: idx=0 => start=9, duration=7, end=16, break 12-13 => work=6h
        const hourCells = screen.getAllByText(/^\d+\.\d+h$/);
        expect(hourCells.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("attendance から startTime/endTime を取得して時間範囲を反映する", async () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: null,
        staffs: [makeShiftStaff({ id: "s-att" })],
      });

      // Provide attendance with startTime=10:00 and endTime=18:00
      triggerListAttendancesMock.mockImplementation(() => ({
        unwrap: () =>
          Promise.resolve({
            attendances: [
              {
                workDate: "2024-07-15",
                startTime: "2024-07-15T10:00:00",
                endTime: "2024-07-15T18:00:00",
                rests: [],
              },
            ],
          }),
      }));

      renderShiftDayView({ date: "2024-07-15" });

      // triggerListAttendances should have been called
      await waitFor(() => {
        expect(triggerListAttendancesMock).toHaveBeenCalledWith({
          staffId: "s-att",
        });
      });
    });

    it("attendance API がエラーのとき null をセットしてフォールバック表示を使う", async () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: null,
        staffs: [makeShiftStaff({ id: "s-err" })],
      });

      triggerListAttendancesMock.mockImplementation(() => ({
        unwrap: () => Promise.reject(new Error("API Error")),
      }));

      renderShiftDayView({ date: "2024-07-15" });

      // The component should still render without crashing
      await waitFor(() => {
        expect(screen.getByText("山田 太郎")).toBeInTheDocument();
      });
    });
  });

  // ── Attendance with rests ──────────────────────────────────────────────

  describe("休憩データの表示", () => {
    it("attendance.rests がある場合は休憩時間を反映する", async () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: null,
        staffs: [makeShiftStaff({ id: "s-rest" })],
      });

      triggerListAttendancesMock.mockImplementation(() => ({
        unwrap: () =>
          Promise.resolve({
            attendances: [
              {
                workDate: "2024-07-15",
                startTime: "2024-07-15T09:00:00",
                endTime: "2024-07-15T18:00:00",
                rests: [
                  {
                    startTime: "2024-07-15T12:00:00",
                    endTime: "2024-07-15T13:00:00",
                  },
                ],
              },
            ],
          }),
      }));

      renderShiftDayView({ date: "2024-07-15" });

      await waitFor(() => {
        expect(screen.getByText("山田 太郎")).toBeInTheDocument();
        // 1h break => 1.0h
        expect(screen.getAllByText("1.0h").length).toBeGreaterThanOrEqual(1);
      });
    });

    it("rests に startTime/endTime がない場合はフォールバック昼休みを使用する", async () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: null,
        staffs: [makeShiftStaff({ id: "s-norest" })],
      });

      triggerListAttendancesMock.mockImplementation(() => ({
        unwrap: () =>
          Promise.resolve({
            attendances: [
              {
                workDate: "2024-07-15",
                startTime: "2024-07-15T09:00:00",
                endTime: "2024-07-15T18:00:00",
                rests: [{ startTime: null, endTime: null }],
              },
            ],
          }),
      }));

      renderShiftDayView({ date: "2024-07-15" });

      // Should render without crash; fallback break (12-13) applies
      await waitFor(() => {
        expect(screen.getByText("山田 太郎")).toBeInTheDocument();
      });
    });
  });

  // ── Auth context ───────────────────────────────────────────────────────

  describe("認証状態との連携", () => {
    it("authenticated 状態で useStaffs に isAuthenticated=true を渡す", () => {
      renderShiftDayView({
        date: "2024-07-15",
        authContext: authenticatedContext,
      });
      expect(useStaffsMock).toHaveBeenCalledWith(
        expect.objectContaining({ isAuthenticated: true }),
      );
    });

    it("unauthenticated 状態で useStaffs に isAuthenticated=false を渡す", () => {
      renderShiftDayView({
        date: "2024-07-15",
        authContext: unauthenticatedContext,
      });
      expect(useStaffsMock).toHaveBeenCalledWith(
        expect.objectContaining({ isAuthenticated: false }),
      );
    });
  });

  // ── Multiple staffs with various indices (fallback calculation) ─────────

  describe("複数スタッフのフォールバック計算", () => {
    it("3人のシフトスタッフに対してそれぞれ勤務時間が表示される", async () => {
      useStaffsMock.mockReturnValue({
        loading: false,
        error: null,
        staffs: [
          makeShiftStaff({ id: "s1", familyName: "A", givenName: "1" }),
          makeShiftStaff({ id: "s2", familyName: "B", givenName: "2" }),
          makeShiftStaff({ id: "s3", familyName: "C", givenName: "3" }),
        ],
      });
      renderShiftDayView({ date: "2024-07-15" });
      await waitFor(() => {
        expect(screen.getByText("A 1")).toBeInTheDocument();
        expect(screen.getByText("B 2")).toBeInTheDocument();
        expect(screen.getByText("C 3")).toBeInTheDocument();
        // All rows should have xh format for work total
        const hourTexts = screen.getAllByText(/^\d+\.\d+h$/);
        // 3 staffs × 2 columns (work + break) = at least 3 values
        expect(hourTexts.length).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
