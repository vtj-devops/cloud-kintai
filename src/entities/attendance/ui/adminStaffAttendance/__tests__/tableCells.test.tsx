import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { ReactNode } from "react";

import { CreatedAtTableCell } from "../CreatedAtTableCell";
import { RestTimeTableCell } from "../RestTimeTableCell";
import { SummaryTableCell } from "../SummaryTableCell";
import { UpdatedAtTableCell } from "../UpdatedAtTableCell";
import { WorkDateTableCell } from "../WorkDateTableCell";
import { WorkTimeTableCell } from "../WorkTimeTableCell";

jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    styled:
      (Component: React.ElementType) =>
      () =>
        function StyledComponent(props: Record<string, unknown>) {
          return <Component {...props} />;
        },
  };
});

const makeAppConfigContext = (
  overrides: Record<string, unknown> = {}
): React.ContextType<typeof AppConfigContext> =>
  ({
    getStartTime: () => dayjs("2024-01-01T09:00:00"),
    getEndTime: () => dayjs("2024-01-01T18:00:00"),
    getLunchRestStartTime: () => dayjs("2024-01-01T12:00:00"),
    getLunchRestEndTime: () => dayjs("2024-01-01T13:00:00"),
    ...overrides,
  }) as React.ContextType<typeof AppConfigContext>;

function WithConfig({
  children,
  ctx,
}: {
  children: ReactNode;
  ctx?: React.ContextType<typeof AppConfigContext>;
}) {
  return (
    <AppConfigContext.Provider value={ctx ?? makeAppConfigContext()}>
      <table>
        <tbody>
          <tr>{children}</tr>
        </tbody>
      </table>
    </AppConfigContext.Provider>
  );
}

const makeAttendance = (overrides = {}) => ({
  id: "a1",
  staffId: "s1",
  workDate: "2024-04-01",
  startTime: "2024-04-01T09:00:00.000Z",
  endTime: "2024-04-01T10:00:00.000Z",
  paidHolidayFlag: false,
  goDirectlyFlag: false,
  returnDirectlyFlag: false,
  rests: [],
  substituteHolidayDate: null,
  specialHolidayFlag: false,
  absentFlag: false,
  createdAt: "2024-04-01T00:00:00.000Z",
  updatedAt: "2024-04-01T01:00:00.000Z",
  ...overrides,
});

// ===== CreatedAtTableCell =====
describe("CreatedAtTableCell", () => {
  it("日時が整形されて表示される", () => {
    render(
      <table>
        <tbody>
          <tr>
            <CreatedAtTableCell createdAt="2024-04-01T00:00:00.000Z" />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByRole("cell")).toHaveTextContent("2024/04/01");
  });

  it("nullの場合は空文字を表示する", () => {
    render(
      <table>
        <tbody>
          <tr>
            <CreatedAtTableCell createdAt={null} />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByRole("cell")).toHaveTextContent("");
  });
});

// ===== UpdatedAtTableCell =====
describe("UpdatedAtTableCell", () => {
  it("日時が整形されて表示される", () => {
    render(
      <table>
        <tbody>
          <tr>
            <UpdatedAtTableCell updatedAt="2024-04-02T05:00:00.000Z" />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByRole("cell")).toHaveTextContent("2024/04/02");
  });

  it("nullの場合は空文字を表示する", () => {
    render(
      <table>
        <tbody>
          <tr>
            <UpdatedAtTableCell updatedAt={null} />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByRole("cell")).toHaveTextContent("");
  });
});

// ===== WorkDateTableCell =====
describe("WorkDateTableCell", () => {
  it("日付と曜日を表示する", () => {
    render(
      <table>
        <tbody>
          <tr>
            <WorkDateTableCell
              workDate="2024-04-01"
              holidayCalendars={[]}
              companyHolidayCalendars={[]}
            />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByRole("cell")).toHaveTextContent("4/1");
    expect(screen.getByRole("cell")).toHaveTextContent("月");
  });

  it("祝日名が含まれる場合表示する", () => {
    render(
      <table>
        <tbody>
          <tr>
            <WorkDateTableCell
              workDate="2024-01-01"
              holidayCalendars={[
                {
                  id: "h1",
                  holidayDate: "2024-01-01",
                  name: "元日",
                  createdAt: "",
                  updatedAt: "",
                },
              ]}
              companyHolidayCalendars={[]}
            />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByRole("cell")).toHaveTextContent("元日");
  });
});

// ===== WorkTimeTableCell =====
describe("WorkTimeTableCell", () => {
  it("開始・終了時刻を表示する", () => {
    render(
      <WithConfig>
        <WorkTimeTableCell attendance={makeAttendance()} />
      </WithConfig>
    );
    const cell = screen.getByRole("cell");
    expect(cell).toHaveTextContent("〜");
  });

  it("有給休暇の場合は既定値を表示する", () => {
    render(
      <WithConfig>
        <WorkTimeTableCell attendance={makeAttendance({ paidHolidayFlag: true, startTime: null, endTime: null })} />
      </WithConfig>
    );
    const cell = screen.getByRole("cell");
    expect(cell).toHaveTextContent("9:00");
    expect(cell).toHaveTextContent("18:00");
  });

  it("開始・終了が未設定の場合は空セルを返す", () => {
    render(
      <WithConfig>
        <WorkTimeTableCell
          attendance={makeAttendance({ startTime: null, endTime: null })}
        />
      </WithConfig>
    );
    expect(screen.getByRole("cell")).toHaveTextContent("");
  });

  it("直行フラグがある場合「直行」を表示する", () => {
    render(
      <WithConfig>
        <WorkTimeTableCell attendance={makeAttendance({ goDirectlyFlag: true })} />
      </WithConfig>
    );
    expect(screen.getByRole("cell")).toHaveTextContent("直行");
  });

  it("直帰フラグがある場合「直帰」を表示する", () => {
    render(
      <WithConfig>
        <WorkTimeTableCell attendance={makeAttendance({ returnDirectlyFlag: true })} />
      </WithConfig>
    );
    expect(screen.getByRole("cell")).toHaveTextContent("直帰");
  });
});

// ===== RestTimeTableCell =====
describe("RestTimeTableCell", () => {
  it("休憩開始・終了時刻を表示する", () => {
    render(
      <WithConfig>
        <RestTimeTableCell
          attendance={makeAttendance({
            rests: [
              {
                startTime: "2024-04-01T03:00:00.000Z",
                endTime: "2024-04-01T04:00:00.000Z",
              },
            ],
          })}
        />
      </WithConfig>
    );
    const cell = screen.getByRole("cell");
    expect(cell).toHaveTextContent("〜");
  });

  it("有給休暇の場合は既定値を表示する", () => {
    render(
      <WithConfig>
        <RestTimeTableCell
          attendance={makeAttendance({ paidHolidayFlag: true, rests: [] })}
        />
      </WithConfig>
    );
    const cell = screen.getByRole("cell");
    expect(cell).toHaveTextContent("12:00");
    expect(cell).toHaveTextContent("13:00");
  });

  it("休憩なしの場合は空セルを返す", () => {
    render(
      <WithConfig>
        <RestTimeTableCell attendance={makeAttendance({ rests: [] })} />
      </WithConfig>
    );
    expect(screen.getByRole("cell")).toHaveTextContent("");
  });

  it("restsがnullの場合は空セルを返す", () => {
    render(
      <WithConfig>
        <RestTimeTableCell attendance={makeAttendance({ rests: null })} />
      </WithConfig>
    );
    expect(screen.getByRole("cell")).toHaveTextContent("");
  });
});

// ===== SummaryTableCell =====
describe("SummaryTableCell", () => {
  it("特別休暇チップを表示する", () => {
    render(
      <table>
        <tbody>
          <tr>
            <SummaryTableCell
              substituteHolidayDate={null}
              specialHolidayFlag={true}
            />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByText("特別休暇")).toBeInTheDocument();
  });

  it("有給休暇チップを表示する", () => {
    render(
      <table>
        <tbody>
          <tr>
            <SummaryTableCell
              substituteHolidayDate={null}
              paidHolidayFlag={true}
            />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByText("有給休暇")).toBeInTheDocument();
  });

  it("欠勤チップを表示する", () => {
    render(
      <table>
        <tbody>
          <tr>
            <SummaryTableCell
              substituteHolidayDate={null}
              absentFlag={true}
            />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByText("欠勤")).toBeInTheDocument();
  });

  it("振替休日の場合「振替休日」テキストを表示する", () => {
    render(
      <table>
        <tbody>
          <tr>
            <SummaryTableCell substituteHolidayDate="2024-04-15" />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByRole("cell")).toHaveTextContent("振替休日");
  });

  it("フラグなしの場合はチップを表示しない", () => {
    render(
      <table>
        <tbody>
          <tr>
            <SummaryTableCell substituteHolidayDate={null} />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.queryByText("特別休暇")).not.toBeInTheDocument();
    expect(screen.queryByText("有給休暇")).not.toBeInTheDocument();
    expect(screen.queryByText("欠勤")).not.toBeInTheDocument();
  });
});
