import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AggregateExportButton from "../AggregateExportButton";
import {
  createDownloadTestStaff,
  renderDownloadTestUI,
  setupDownloadAnchorMocks,
} from "./downloadFormTestUtils";

// ─── Mock: downloadAttendances ───────────────────────────────────────────────
const mockDownloadAttendances = jest.fn();
jest.mock("../../lib/downloadAttendances", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockDownloadAttendances(...args),
}));

// ─── Mock: AttendanceDate ────────────────────────────────────────────────────
jest.mock("@entities/attendance/lib/AttendanceDate", () => ({
  AttendanceDate: {
    DataFormat: "YYYY-MM-DD",
    DisplayFormat: "YYYY/MM/DD",
    QueryParamFormat: "YYYYMMDD",
  },
}));

// ─── Mock: calcTotalRestTime ─────────────────────────────────────────────────
jest.mock("@entities/attendance/lib/time", () => ({
  calcTotalRestTime: jest.fn(() => 0),
}));

// ─── URL API stubs (jsdom does not implement these) ──────────────────────────
// Defined once; jest.resetAllMocks() resets call state each test
Object.defineProperty(window.URL, "createObjectURL", {
  value: jest.fn(),
  configurable: true,
  writable: true,
});
Object.defineProperty(window.URL, "revokeObjectURL", {
  value: jest.fn(),
  configurable: true,
  writable: true,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeAttendance = (overrides: Record<string, unknown> = {}) => ({
  id: "att-1",
  staffId: "staff-1",
  workDate: "2024-01-15",
  startTime: "2024-01-15T09:00:00.000Z",
  endTime: "2024-01-15T18:00:00.000Z",
  paidHolidayFlag: false,
  absentFlag: false,
  substituteHolidayDate: null,
  specialHolidayFlag: false,
  hourlyPaidHolidayHours: null,
  rests: [],
  remarks: null,
  ...overrides,
});

function renderButton(props: {
  workDates?: string[];
  selectedStaff?: ReturnType<typeof createDownloadTestStaff>[];
  fullWidth?: boolean;
  contextOverrides?: {
    getHourlyPaidHolidayEnabled?: () => boolean;
    getSpecialHolidayEnabled?: () => boolean;
  };
}) {
  const {
    workDates = ["2024-01-15"],
    selectedStaff = [createDownloadTestStaff()],
    fullWidth,
    contextOverrides = {},
  } = props;

  return renderDownloadTestUI(
    <AggregateExportButton
      workDates={workDates}
      selectedStaff={selectedStaff as never}
      fullWidth={fullWidth}
    />,
    {
      hourlyPaidHolidayEnabled:
        contextOverrides.getHourlyPaidHolidayEnabled?.() ?? false,
      specialHolidayEnabled: contextOverrides.getSpecialHolidayEnabled?.() ?? false,
    },
  );
}

// ─── Anchor mock ─────────────────────────────────────────────────────────────
let anchorMocks: ReturnType<typeof setupDownloadAnchorMocks>;

beforeEach(() => {
  jest.resetAllMocks();

  mockDownloadAttendances.mockResolvedValue([]);
  (window.URL.createObjectURL as jest.Mock).mockReturnValue("blob:mock-url");

  anchorMocks = setupDownloadAnchorMocks();
});

afterEach(() => {
  anchorMocks.restore();
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("AggregateExportButton", () => {
  describe("レンダリング", () => {
    it("「集計ダウンロード」ボタンを表示する", () => {
      renderButton({});
      expect(screen.getByRole("button", { name: /集計ダウンロード/ })).toBeInTheDocument();
    });

    it("workDates が空のとき disabled になる", () => {
      renderButton({ workDates: [] });
      expect(screen.getByRole("button", { name: /集計ダウンロード/ })).toBeDisabled();
    });

    it("selectedStaff が空のとき disabled になる", () => {
      renderButton({ selectedStaff: [] });
      expect(screen.getByRole("button", { name: /集計ダウンロード/ })).toBeDisabled();
    });

    it("workDates も selectedStaff も空のとき disabled になる", () => {
      renderButton({ workDates: [], selectedStaff: [] });
      expect(screen.getByRole("button", { name: /集計ダウンロード/ })).toBeDisabled();
    });

    it("workDates と selectedStaff が両方あるとき enabled になる", () => {
      renderButton({
        workDates: ["2024-01-15"],
        selectedStaff: [createDownloadTestStaff()],
      });
      expect(screen.getByRole("button", { name: /集計ダウンロード/ })).toBeEnabled();
    });
  });

  describe("クリック時の動作", () => {
    it("disabled のとき（workDates 空）は downloadAttendances を呼ばない", async () => {
      const user = userEvent.setup();
      renderButton({ workDates: [] });
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      expect(mockDownloadAttendances).not.toHaveBeenCalled();
    });

    it("クリック時に downloadAttendances を呼ぶ", async () => {
      const user = userEvent.setup();
      renderButton({ workDates: ["2024-01-15"] });
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => {
        expect(mockDownloadAttendances).toHaveBeenCalledTimes(1);
      });
    });

    it("workDates を or 条件として downloadAttendances に渡す", async () => {
      const user = userEvent.setup();
      renderButton({ workDates: ["2024-01-15", "2024-01-16"] });
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => {
        expect(mockDownloadAttendances).toHaveBeenCalledWith([
          { workDate: { eq: "2024-01-15" } },
          { workDate: { eq: "2024-01-16" } },
        ]);
      });
    });

    it("CSV ダウンロードのため URL.createObjectURL を呼ぶ", async () => {
      const user = userEvent.setup();
      renderButton({});
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => {
        expect(window.URL.createObjectURL as jest.Mock).toHaveBeenCalledTimes(1);
      });
    });

    it("CSV ダウンロード後に URL.revokeObjectURL を呼ぶ", async () => {
      const user = userEvent.setup();
      renderButton({});
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => {
        expect(window.URL.revokeObjectURL as jest.Mock).toHaveBeenCalledWith("blob:mock-url");
      });
    });

    it("アンカー要素の click を呼んでダウンロードを実行する", async () => {
      const user = userEvent.setup();
      renderButton({});
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => {
        expect(anchorMocks.mockAnchorClick).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("CSV ヘッダー", () => {
    // Capture CSV content from Blob parts directly (jsdom Blob lacks .text())
    let capturedCSVContent = "";
    const _origBlob = global.Blob;

    beforeEach(() => {
      capturedCSVContent = "";
      global.Blob = jest.fn().mockImplementation((parts: BlobPart[], options?: BlobPropertyBag) => {
        capturedCSVContent = parts.filter((p): p is string => typeof p === "string").join("");
        return { type: options?.type ?? "" } as Blob;
      }) as unknown as typeof Blob;
    });

    afterEach(() => {
      global.Blob = _origBlob;
    });

    it("基本ヘッダー列が含まれる", async () => {
      const user = userEvent.setup();
      renderButton({});
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).toContain("従業員コード");
      expect(capturedCSVContent).toContain("名前");
      expect(capturedCSVContent).toContain("出勤日数");
      expect(capturedCSVContent).toContain("実働合計(h)");
    });

    it("hourlyPaidHolidayEnabled が false のとき 時間単位休暇合計(h) ヘッダーが含まれない", async () => {
      const user = userEvent.setup();
      renderButton({ contextOverrides: { getHourlyPaidHolidayEnabled: () => false } });
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).not.toContain("時間単位休暇合計(h)");
    });

    it("hourlyPaidHolidayEnabled が true のとき 時間単位休暇合計(h) ヘッダーが含まれる", async () => {
      const user = userEvent.setup();
      renderButton({ contextOverrides: { getHourlyPaidHolidayEnabled: () => true } });
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).toContain("時間単位休暇合計(h)");
    });

    it("specialHolidayEnabled が false のとき 特別休暇 ヘッダーが含まれない", async () => {
      const user = userEvent.setup();
      renderButton({ contextOverrides: { getSpecialHolidayEnabled: () => false } });
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).not.toContain("特別休暇");
    });

    it("specialHolidayEnabled が true のとき 特別休暇 ヘッダーが含まれる", async () => {
      const user = userEvent.setup();
      renderButton({ contextOverrides: { getSpecialHolidayEnabled: () => true } });
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).toContain("特別休暇");
    });
  });

  describe("CSV データ行", () => {
    let capturedCSVContent = "";
    const _origBlob = global.Blob;

    beforeEach(() => {
      capturedCSVContent = "";
      global.Blob = jest.fn().mockImplementation((parts: BlobPart[], options?: BlobPropertyBag) => {
        capturedCSVContent = parts.filter((p): p is string => typeof p === "string").join("");
        return { type: options?.type ?? "" } as Blob;
      }) as unknown as typeof Blob;
    });

    afterEach(() => {
      global.Blob = _origBlob;
    });

    it("スタッフの認証 ID と名前がデータ行に含まれる", async () => {
      const user = userEvent.setup();
      const staff = createDownloadTestStaff({
        cognitoUserId: "user-abc",
        familyName: "田中",
        givenName: "花子",
      });
      mockDownloadAttendances.mockResolvedValue([
        makeAttendance({ staffId: "user-abc", workDate: "2024-01-15" }),
      ]);
      renderButton({ workDates: ["2024-01-15"], selectedStaff: [staff] });
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).toContain("user-abc");
      expect(capturedCSVContent).toContain("田中 花子");
    });

    it("出勤日数が正しく集計される（1件）", async () => {
      const user = userEvent.setup();
      const staff = createDownloadTestStaff();
      mockDownloadAttendances.mockResolvedValue([
        makeAttendance({ staffId: "staff-1", workDate: "2024-01-15" }),
      ]);
      renderButton({ workDates: ["2024-01-15"], selectedStaff: [staff] });
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      const lines = capturedCSVContent.split("\n");
      // Data row index 1 (after header). Cols: staffId,name,targetDays,attendDays,...
      // attendDays (col index 3) should be 1
      const dataCols = lines[1].split(",");
      expect(dataCols[3]).toBe("1");
    });

    it("勤怠データが 0 件のスタッフも行が出力される", async () => {
      const user = userEvent.setup();
      const staff = createDownloadTestStaff({ cognitoUserId: "no-attendance" });
      mockDownloadAttendances.mockResolvedValue([]);
      renderButton({ workDates: ["2024-01-15"], selectedStaff: [staff] });
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      const lines = capturedCSVContent.split("\n");
      expect(lines).toHaveLength(2); // header + 1 staff row
    });

    it("複数スタッフは sortKey でソートされる", async () => {
      const user = userEvent.setup();
      const staffA = createDownloadTestStaff({
        id: "s1",
        cognitoUserId: "s1",
        familyName: "鈴木",
        givenName: "一郎",
        sortKey: "suzuki",
      });
      const staffB = createDownloadTestStaff({
        id: "s2",
        cognitoUserId: "s2",
        familyName: "青木",
        givenName: "二郎",
        sortKey: "aoki",
      });
      mockDownloadAttendances.mockResolvedValue([]);
      renderButton({ workDates: ["2024-01-15"], selectedStaff: [staffA, staffB] });
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      // "aoki" sorts before "suzuki", so 青木 should appear before 鈴木
      expect(capturedCSVContent.indexOf("青木 二郎")).toBeLessThan(capturedCSVContent.indexOf("鈴木 一郎"));
    });

    it("有給休暇フラグが立った勤怠は paidHolidayCount に加算される", async () => {
      const user = userEvent.setup();
      const staff = createDownloadTestStaff();
      mockDownloadAttendances.mockResolvedValue([
        makeAttendance({ staffId: "staff-1", workDate: "2024-01-15", paidHolidayFlag: true }),
      ]);
      renderButton({ workDates: ["2024-01-15"], selectedStaff: [staff] });
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      const lines = capturedCSVContent.split("\n");
      // header: 従業員コード,名前,対象日数,出勤日数,欠勤日数,実働合計(h),休憩合計(h),有給日数,...
      // Index 7 = 有給日数
      const dataCols = lines[1].split(",");
      expect(dataCols[7]).toBe("1");
    });

    it("摘要が複数あるとき半角スペースで結合される", async () => {
      const user = userEvent.setup();
      const staff = createDownloadTestStaff();
      mockDownloadAttendances.mockResolvedValue([
        makeAttendance({ staffId: "staff-1", workDate: "2024-01-15", remarks: "メモA" }),
        makeAttendance({ id: "att-2", staffId: "staff-1", workDate: "2024-01-16", remarks: "メモB" }),
      ]);
      renderButton({ workDates: ["2024-01-15", "2024-01-16"], selectedStaff: [staff] });
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).toContain("メモA メモB");
    });
  });

  describe("CSV ファイル", () => {
    it("ファイル名に attendance_aggregate_ が含まれる", async () => {
      const user = userEvent.setup();
      renderButton({});
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => {
        expect(anchorMocks.capturedAnchorDownload).toMatch(/^attendance_aggregate_\d+\.csv$/);
      });
    });

    it("Blob は text/csv で作成される", async () => {
      const user = userEvent.setup();
      const _origBlob2 = global.Blob;
      let capturedType = "";
      global.Blob = jest.fn().mockImplementation((_parts: BlobPart[], options?: BlobPropertyBag) => {
        capturedType = options?.type ?? "";
        return { type: options?.type ?? "" } as Blob;
      }) as unknown as typeof Blob;

      renderButton({});
      await user.click(screen.getByRole("button", { name: /集計ダウンロード/ }));
      await waitFor(() => {
        expect(capturedType).toBe("text/csv");
      });
      global.Blob = _origBlob2;
    });
  });
});
