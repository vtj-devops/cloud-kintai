import { render, screen } from "@testing-library/react";

import RegisterDashboard from "../RegisterDashboard";

jest.mock("../RegisterAnnouncementPanel", () => ({
  __esModule: true,
  default: ({
    configId,
    announcement,
  }: {
    configId: string | null;
    announcement: { enabled: boolean; message: string };
  }) => (
    <div data-testid="register-announcement-panel-mock">
      {configId}:{announcement.message}
    </div>
  ),
}));

jest.mock("../ElapsedDurationCards", () => ({
  __esModule: true,
  default: ({
    elapsedWorkInfo,
  }: {
    elapsedWorkInfo: {
      visible: boolean;
      workDurationLabel: string;
      restDurationLabel: string;
    };
  }) => (
    <div data-testid="elapsed-duration-cards-mock">
      {elapsedWorkInfo.visible ? elapsedWorkInfo.workDurationLabel : "hidden"}
    </div>
  ),
}));

jest.mock("../RegisterAttendanceSummaryCard", () => ({
  __esModule: true,
  default: ({
    attendanceErrorCount,
    attendanceErrorListPath,
  }: {
    attendanceErrorCount: number;
    attendanceErrorListPath?: string;
  }) => (
    <div
      data-testid="register-attendance-summary-card-mock"
      data-attendance-error-list-path={attendanceErrorListPath ?? ""}
    >
      {attendanceErrorCount}
    </div>
  ),
}));

jest.mock("@/widgets/layout/header/AdminPendingApprovalSummary", () => ({
  __esModule: true,
  default: ({
    layoutMode,
  }: {
    layoutMode?: "default" | "inline-cards" | "two-columns";
  }) => (
    <div
      data-testid="admin-pending-approval-summary-mock"
      data-layout-mode={layoutMode ?? "default"}
    />
  ),
}));

describe("RegisterDashboard", () => {
  it("右側カラムのカード群を props とともに描画する", () => {
    render(
      <RegisterDashboard
        configId="config-id"
        announcement={{ enabled: true, message: "管理者アナウンス" }}
        elapsedWorkInfo={{
          visible: true,
          workDurationLabel: "02:10",
          restDurationLabel: "00:15",
        }}
        attendanceErrorCount={2}
      />,
    );

    const dashboardSlot = screen.getByTestId("register-dashboard-slot");
    expect(dashboardSlot).toHaveClass("register-dashboard");
    expect(
      screen.getByTestId("register-announcement-panel-mock"),
    ).toHaveTextContent("config-id:管理者アナウンス");
    expect(
      screen.getByTestId("admin-pending-approval-summary-mock"),
    ).toHaveAttribute("data-layout-mode", "two-columns");
    expect(screen.getByTestId("elapsed-duration-cards-mock")).toHaveTextContent(
      "02:10",
    );
    expect(
      screen.getByTestId("register-attendance-summary-card-mock"),
    ).toHaveTextContent("2");
    expect(
      screen.getByTestId("register-attendance-summary-card-mock"),
    ).toHaveAttribute("data-attendance-error-list-path", "/attendance/list");
  });
});
