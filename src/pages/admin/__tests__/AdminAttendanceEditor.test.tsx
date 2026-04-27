import { renderWithProviders } from "@shared/test-utils";
import { screen } from "@testing-library/react";

import AdminAttendanceEditor from "../AdminAttendanceEditor";

// AttendanceEditor は依存が複雑なのでスタブ化する
jest.mock("@features/attendance/edit/ui/AttendanceEditor", () => ({
  __esModule: true,
  default: ({ readOnly }: { readOnly: boolean }) => (
    <div data-testid="attendance-editor" data-readonly={String(readOnly)} />
  ),
}));

describe("AdminAttendanceEditor", () => {
  it("クラッシュせずにレンダリングされる", () => {
    renderWithProviders(<AdminAttendanceEditor />);
    expect(screen.getByTestId("attendance-editor")).toBeInTheDocument();
  });

  it("クエリパラメータがない場合、readOnly=false で AttendanceEditor を表示する", () => {
    renderWithProviders(<AdminAttendanceEditor />, {
      initialEntries: ["/admin/attendance"],
    });
    expect(screen.getByTestId("attendance-editor")).toHaveAttribute(
      "data-readonly",
      "false",
    );
  });

  it("readOnly=true クエリパラメータがある場合、readOnly=true で AttendanceEditor を表示する", () => {
    renderWithProviders(<AdminAttendanceEditor />, {
      initialEntries: ["/admin/attendance?readOnly=true"],
    });
    expect(screen.getByTestId("attendance-editor")).toHaveAttribute(
      "data-readonly",
      "true",
    );
  });

  it("readOnly=false クエリパラメータがある場合、readOnly=false で AttendanceEditor を表示する", () => {
    renderWithProviders(<AdminAttendanceEditor />, {
      initialEntries: ["/admin/attendance?readOnly=false"],
    });
    expect(screen.getByTestId("attendance-editor")).toHaveAttribute(
      "data-readonly",
      "false",
    );
  });
});
