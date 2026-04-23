import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import ExportButton from "../ExportButton";

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

// ─── Mock: businessLogic ─────────────────────────────────────────────────────
jest.mock("@entities/attendance/lib/businessLogic", () => ({
  FLAG_VALUES: { TRUE: 1, FALSE: 0 },
}));

// ─── Mock: calcTotalRestTime ─────────────────────────────────────────────────
jest.mock("@entities/attendance/lib/time", () => ({
  calcTotalRestTime: jest.fn(() => 0),
}));

// ─── URL API stubs (jsdom does not implement these) ──────────────────────────
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
const makeStaff = (overrides: Partial<{
  id: string;
  cognitoUserId: string;
  familyName: string;
  givenName: string;
  sortKey: string;
}> = {}) => ({
  id: overrides.id ?? "staff-1",
  cognitoUserId: overrides.cognitoUserId ?? "staff-1",
  familyName: overrides.familyName ?? "山田",
  givenName: overrides.givenName ?? "太郎",
  sortKey: overrides.sortKey ?? "yamada",
  mailAddress: "test@example.com",
  owner: false,
  role: "Staff" as const,
  enabled: true,
  status: "active",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
});

const makeAttendance = (overrides: Record<string, unknown> = {}) => ({
  id: "att-1",
  staffId: "staff-1",
  workDate: "2024-01-15",
  startTime: "2024-01-15T09:00:00.000Z",
  endTime: "2024-01-15T18:00:00.000Z",
  goDirectlyFlag: false,
  returnDirectlyFlag: false,
  paidHolidayFlag: false,
  absentFlag: false,
  specialHolidayFlag: false,
  substituteHolidayDate: null,
  hourlyPaidHolidayHours: null,
  rests: [],
  remarks: null,
  ...overrides,
});

const makeContextValue = (overrides: {
  getHourlyPaidHolidayEnabled?: () => boolean;
  getSpecialHolidayEnabled?: () => boolean;
} = {}) => ({
  getHourlyPaidHolidayEnabled: overrides.getHourlyPaidHolidayEnabled ?? (() => false),
  getSpecialHolidayEnabled: overrides.getSpecialHolidayEnabled ?? (() => false),
  fetchConfig: jest.fn(),
  saveConfig: jest.fn(),
  getConfigId: jest.fn(),
  getStartTime: jest.fn(),
  getEndTime: jest.fn(),
  getLunchRestStartTime: jest.fn(),
  getLunchRestEndTime: jest.fn(),
  getStandardWorkHours: jest.fn(),
  getLinks: jest.fn(),
  getReasons: jest.fn(),
  getOfficeMode: jest.fn(),
  getAttendanceStatisticsEnabled: jest.fn(),
  getWorkflowNotificationEnabled: jest.fn(),
  getTimeRecorderAnnouncement: jest.fn(),
  getShiftCollaborativeEnabled: jest.fn(),
  getShiftDefaultMode: jest.fn(),
  getQuickInputStartTimes: jest.fn(),
  getQuickInputEndTimes: jest.fn(),
  getShiftGroups: jest.fn(),
  getAmHolidayStartTime: jest.fn(),
  getAmHolidayEndTime: jest.fn(),
  getPmHolidayStartTime: jest.fn(),
  getPmHolidayEndTime: jest.fn(),
  getAmPmHolidayEnabled: jest.fn(),
  getAbsentEnabled: jest.fn(),
  getOverTimeCheckEnabled: jest.fn(),
  getWorkflowCategoryOrder: jest.fn(),
  getThemeColor: jest.fn(),
  getThemeTokens: jest.fn(),
});

function renderButton(props: {
  workDates?: string[];
  selectedStaff?: ReturnType<typeof makeStaff>[];
  fullWidth?: boolean;
  contextOverrides?: {
    getHourlyPaidHolidayEnabled?: () => boolean;
    getSpecialHolidayEnabled?: () => boolean;
  };
}) {
  const {
    workDates = ["2024-01-15"],
    selectedStaff = [makeStaff()],
    fullWidth,
    contextOverrides = {},
  } = props;

  return render(
    <AppConfigContext.Provider value={makeContextValue(contextOverrides) as never}>
      <ExportButton
        workDates={workDates}
        selectedStaff={selectedStaff as never}
        fullWidth={fullWidth}
      />
    </AppConfigContext.Provider>,
  );
}

// ─── Anchor mock ─────────────────────────────────────────────────────────────
const mockAnchorClick = jest.fn();
const mockAnchorRemove = jest.fn();
let capturedAnchorDownload = "";

// Capture the real createElement BEFORE any spy is installed (module scope)
const _origCreateElement = document.createElement.bind(document);
let createElementSpy: jest.SpyInstance;

beforeEach(() => {
  jest.resetAllMocks();

  mockDownloadAttendances.mockResolvedValue([]);
  (window.URL.createObjectURL as jest.Mock).mockReturnValue("blob:mock-url");

  capturedAnchorDownload = "";
  mockAnchorClick.mockReset();
  mockAnchorRemove.mockReset();

  const anchor = {
    set download(val: string) { capturedAnchorDownload = val; },
    get download() { return capturedAnchorDownload; },
    href: "",
    click: mockAnchorClick,
    remove: mockAnchorRemove,
  };

  createElementSpy = jest
    .spyOn(document, "createElement")
    .mockImplementation((tagName: string) => {
      if (tagName === "a") return anchor as unknown as HTMLElement;
      return _origCreateElement(tagName);
    });
});

afterEach(() => {
  createElementSpy.mockRestore();
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("ExportButton", () => {
  describe("レンダリング", () => {
    it("「一括ダウンロード」ボタンを表示する", () => {
      renderButton({});
      expect(screen.getByRole("button", { name: /一括ダウンロード/ })).toBeInTheDocument();
    });

    it("workDates が空のとき disabled になる", () => {
      renderButton({ workDates: [] });
      expect(screen.getByRole("button", { name: /一括ダウンロード/ })).toBeDisabled();
    });

    it("selectedStaff が空のとき disabled になる", () => {
      renderButton({ selectedStaff: [] });
      expect(screen.getByRole("button", { name: /一括ダウンロード/ })).toBeDisabled();
    });

    it("workDates と selectedStaff が両方あるとき enabled になる", () => {
      renderButton({ workDates: ["2024-01-15"], selectedStaff: [makeStaff()] });
      expect(screen.getByRole("button", { name: /一括ダウンロード/ })).toBeEnabled();
    });
  });

  describe("クリック時の動作", () => {
    it("クリック時に downloadAttendances を呼ぶ", async () => {
      const user = userEvent.setup();
      renderButton({ workDates: ["2024-01-15"] });
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => {
        expect(mockDownloadAttendances).toHaveBeenCalledTimes(1);
      });
    });

    it("workDates を or 条件として downloadAttendances に渡す", async () => {
      const user = userEvent.setup();
      renderButton({ workDates: ["2024-01-15", "2024-01-16"] });
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => {
        expect(mockDownloadAttendances).toHaveBeenCalledWith([
          { workDate: { eq: "2024-01-15" } },
          { workDate: { eq: "2024-01-16" } },
        ]);
      });
    });

    it("URL.createObjectURL を呼んで blob URL を生成する", async () => {
      const user = userEvent.setup();
      renderButton({});
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => {
        expect(window.URL.createObjectURL as jest.Mock).toHaveBeenCalledTimes(1);
      });
    });

    it("ダウンロード後に URL.revokeObjectURL を呼ぶ", async () => {
      const user = userEvent.setup();
      renderButton({});
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => {
        expect(window.URL.revokeObjectURL as jest.Mock).toHaveBeenCalledWith("blob:mock-url");
      });
    });

    it("アンカー要素の click を呼んでダウンロードを実行する", async () => {
      const user = userEvent.setup();
      renderButton({});
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => {
        expect(mockAnchorClick).toHaveBeenCalledTimes(1);
      });
    });

    it("アンカー要素の remove を呼んで後片付けをする", async () => {
      const user = userEvent.setup();
      renderButton({});
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => {
        expect(mockAnchorRemove).toHaveBeenCalledTimes(1);
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

    it("基本ヘッダー列（営業日・従業員コード・名前など）が含まれる", async () => {
      const user = userEvent.setup();
      renderButton({});
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).toContain("営業日");
      expect(capturedCSVContent).toContain("従業員コード");
      expect(capturedCSVContent).toContain("名前");
      expect(capturedCSVContent).toContain("休憩時間");
      expect(capturedCSVContent).toContain("出勤打刻");
      expect(capturedCSVContent).toContain("退勤打刻");
    });

    it("hourlyPaidHolidayEnabled が false のとき 時間単位休暇(h) ヘッダーが含まれない", async () => {
      const user = userEvent.setup();
      renderButton({ contextOverrides: { getHourlyPaidHolidayEnabled: () => false } });
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).not.toContain("時間単位休暇(h)");
    });

    it("hourlyPaidHolidayEnabled が true のとき 時間単位休暇(h) ヘッダーが含まれる", async () => {
      const user = userEvent.setup();
      renderButton({ contextOverrides: { getHourlyPaidHolidayEnabled: () => true } });
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).toContain("時間単位休暇(h)");
    });

    it("specialHolidayEnabled が false のとき 特別休暇 ヘッダーが含まれない", async () => {
      const user = userEvent.setup();
      renderButton({ contextOverrides: { getSpecialHolidayEnabled: () => false } });
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).not.toContain("特別休暇");
    });

    it("specialHolidayEnabled が true のとき 特別休暇 ヘッダーが含まれる", async () => {
      const user = userEvent.setup();
      renderButton({ contextOverrides: { getSpecialHolidayEnabled: () => true } });
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
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

    it("勤怠が存在しない日付は空の行として出力される", async () => {
      const user = userEvent.setup();
      const staff = makeStaff();
      mockDownloadAttendances.mockResolvedValue([]);
      renderButton({ workDates: ["2024-01-15"], selectedStaff: [staff] });
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      const lines = capturedCSVContent.split("\n");
      // header + 1 data line for 1 workDate / 1 staff
      expect(lines).toHaveLength(2);
    });

    it("複数 workDates では各日付の行が出力される（1スタッフ × 2日 = 2行）", async () => {
      const user = userEvent.setup();
      const staff = makeStaff();
      mockDownloadAttendances.mockResolvedValue([]);
      renderButton({ workDates: ["2024-01-15", "2024-01-16"], selectedStaff: [staff] });
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      const lines = capturedCSVContent.split("\n");
      // header + 2 date lines
      expect(lines).toHaveLength(3);
    });

    it("複数スタッフは sortKey でソートされる", async () => {
      const user = userEvent.setup();
      const staffA = makeStaff({ id: "s1", cognitoUserId: "s1", familyName: "鈴木", givenName: "一郎", sortKey: "suzuki" });
      const staffB = makeStaff({ id: "s2", cognitoUserId: "s2", familyName: "青木", givenName: "二郎", sortKey: "aoki" });
      mockDownloadAttendances.mockResolvedValue([]);
      renderButton({ workDates: ["2024-01-15"], selectedStaff: [staffA, staffB] });
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      // "aoki" sorts before "suzuki"
      expect(capturedCSVContent.indexOf("青木 二郎")).toBeLessThan(capturedCSVContent.indexOf("鈴木 一郎"));
    });

    it("振替休日がある場合 substituteHolidayDate が摘要に含まれる", async () => {
      const user = userEvent.setup();
      const staff = makeStaff();
      mockDownloadAttendances.mockResolvedValue([
        makeAttendance({
          staffId: "staff-1",
          workDate: "2024-01-15",
          substituteHolidayDate: "2024-01-20",
        }),
      ]);
      renderButton({ workDates: ["2024-01-15"], selectedStaff: [staff] });
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).toContain("分振替");
    });

    it("remarks がある場合、摘要に含まれる", async () => {
      const user = userEvent.setup();
      const staff = makeStaff();
      mockDownloadAttendances.mockResolvedValue([
        makeAttendance({
          staffId: "staff-1",
          workDate: "2024-01-15",
          remarks: "備考テスト",
        }),
      ]);
      renderButton({ workDates: ["2024-01-15"], selectedStaff: [staff] });
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).toContain("備考テスト");
    });

    it("hourlyPaidHolidayEnabled が true のとき hourlyPaidHolidayHours が出力される", async () => {
      const user = userEvent.setup();
      const staff = makeStaff();
      mockDownloadAttendances.mockResolvedValue([
        makeAttendance({
          staffId: "staff-1",
          workDate: "2024-01-15",
          hourlyPaidHolidayHours: "4",
        }),
      ]);
      renderButton({
        workDates: ["2024-01-15"],
        selectedStaff: [staff],
        contextOverrides: { getHourlyPaidHolidayEnabled: () => true },
      });
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => expect(capturedCSVContent).not.toBe(""));
      expect(capturedCSVContent).toContain(",4,");
    });
  });

  describe("CSV ファイル設定", () => {
    it("ファイル名に attendances_ が含まれる", async () => {
      const user = userEvent.setup();
      renderButton({});
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => {
        expect(capturedAnchorDownload).toMatch(/^attendances_\d+\.csv$/);
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
      await user.click(screen.getByRole("button", { name: /一括ダウンロード/ }));
      await waitFor(() => {
        expect(capturedType).toBe("text/csv");
      });
      global.Blob = _origBlob2;
    });
  });
});
