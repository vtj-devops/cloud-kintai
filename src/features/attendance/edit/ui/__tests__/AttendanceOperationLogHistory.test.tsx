import type { Attendance, OperationLog } from "@shared/api/graphql/types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AttendanceOperationLogHistory from "../AttendanceOperationLogHistory";

const fetchOperationLogsMock = jest.fn();

jest.mock("@entities/staff/model/useStaff/fetchStaff", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/entities/operation-log/model/fetchOperationLogs", () => ({
  __esModule: true,
  default: (...args: unknown[]) => fetchOperationLogsMock(...args),
}));

jest.mock("@/entities/operation-log/ui/OperationLogDetailDialog", () => ({
  OperationLogDetailDialog: ({ open }: { open: boolean }) =>
    open ? <div>detail dialog open</div> : null,
}));

const mockLog: OperationLog = {
  id: "log-1",
  action: "attendance.update",
  resource: "attendance",
  resourceId: "attendance-1",
  resourceKey: "attendance#attendance-1",
  summary: {
    message: "history object summary",
  } as unknown as OperationLog["summary"],
  details: null,
  timestamp: "2026-03-31T10:00:00.000Z",
  createdAt: "2026-03-31T10:00:00.000Z",
  updatedAt: "2026-03-31T10:00:00.000Z",
} as OperationLog;

describe("AttendanceOperationLogHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchOperationLogsMock.mockResolvedValue({
      items: [mockLog],
      nextToken: null,
    });
  });

  it("renders compact log rows with action badge and detail button", async () => {
    render(
      <AttendanceOperationLogHistory
        attendance={
          {
            id: "attendance-1",
            histories: [],
          } as unknown as Attendance
        }
      />,
    );

    await screen.findByTestId("attendance-operation-log-item");

    expect(screen.getByRole("button", { name: "詳細" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("[object Object]")).not.toBeInTheDocument();
    });
  });

  it("opens the detail dialog when the detail button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AttendanceOperationLogHistory
        attendance={
          {
            id: "attendance-1",
            histories: [],
          } as unknown as Attendance
        }
      />,
    );

    await screen.findByRole("button", { name: "詳細" });
    await user.click(screen.getByRole("button", { name: "詳細" }));

    expect(screen.getByText("detail dialog open")).toBeInTheDocument();
  });

  it("shows the empty state without fetching when attendance is not selected", () => {
    render(<AttendanceOperationLogHistory attendance={null} />);

    expect(screen.getByText("履歴がありません。")).toBeInTheDocument();
    expect(fetchOperationLogsMock).not.toHaveBeenCalled();
  });
});
