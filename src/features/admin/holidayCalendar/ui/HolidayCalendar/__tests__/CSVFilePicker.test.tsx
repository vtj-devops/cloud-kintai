import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  openFileBulkAddDialog,
  simulateCsvUpload,
} from "../../__tests__/filePickerTestHelpers";
import { CSVFilePicker } from "../CSVFilePicker";

const mockDispatch = jest.fn();
jest.mock("@app/hooks", () => ({
  useAppDispatchV2: () => mockDispatch,
}));

jest.mock("@entities/attendance/lib/AttendanceDate", () => ({
  AttendanceDate: { DataFormat: "YYYY-MM-DD" },
}));

const pushNotificationMock = jest.fn(
  (payload: { tone: string; message: string }) => ({
    type: "notification/push",
    payload,
  }),
);
jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: (...args: Parameters<typeof pushNotificationMock>) =>
    pushNotificationMock(...args),
}));

jest.mock("@shared/lib/message/HolidayCalendarMessage", () => ({
  HolidayCalendarMessage: () => ({
    create: (status: string) =>
      status === "S"
        ? "法定休日を作成しました"
        : "法定休日の作成に失敗しました",
  }),
}));

function renderComponent(
  bulkCreate = jest.fn().mockResolvedValue([]),
): jest.Mock {
  render(<CSVFilePicker bulkCreateHolidayCalendar={bulkCreate} />);
  return bulkCreate;
}

async function openDialog() {
  await openFileBulkAddDialog();
}

function simulateFileUpload(
  csvContent: string,
  fileName = "holiday.csv",
  fileType = "text/csv",
) {
  simulateCsvUpload(csvContent, { name: fileName, type: fileType });
}

describe("HolidayCalendar CSVFilePicker", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("ダイアログを開いてファイル選択できる", async () => {
    renderComponent();
    await openDialog();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ファイルを選択" })).toBeInTheDocument();
  });

  it("有効なCSVを登録すると bulkCreate が呼ばれる", async () => {
    const bulkCreate = renderComponent();
    await openDialog();

    simulateFileUpload("holiday_date,name\r\n2024-01-01,元日\r\n");
    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(bulkCreate).toHaveBeenCalledWith([
        expect.objectContaining({ holidayDate: "2024-01-01", name: "元日" }),
      ]);
    });
  });

  it("confirmでキャンセルすると bulkCreate は呼ばれない", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    const bulkCreate = renderComponent();
    await openDialog();

    simulateFileUpload("holiday_date,name\r\n2024-01-01,元日\r\n");
    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    expect(bulkCreate).not.toHaveBeenCalled();
  });

  it("登録成功時にsuccess通知をdispatchする", async () => {
    renderComponent(jest.fn().mockResolvedValue([]));
    await openDialog();

    simulateFileUpload("holiday_date,name\r\n2024-01-01,元日\r\n");
    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "success" }),
      );
    });
  });

  it("登録失敗時にerror通知をdispatchする", async () => {
    renderComponent(jest.fn().mockRejectedValue(new Error("Server Error")));
    await openDialog();

    simulateFileUpload("holiday_date,name\r\n2024-01-01,元日\r\n");
    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
  });

  it("データ未選択で登録ボタンを押すとダイアログが閉じる", async () => {
    renderComponent();
    await openDialog();

    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(window.confirm).not.toHaveBeenCalled();
  });
});
