import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import type { Attendance } from "@shared/api/graphql/types";
import { render } from "@testing-library/react";
import dayjs from "dayjs";
import type { ReactNode } from "react";

import { AttendanceGraph } from "../AttendanceGraph";

type MockBarProps = {
  data: {
    labels: string[];
    datasets: Array<{ label: string; data: number[] }>;
  };
};

const mockBar = jest.fn((props: MockBarProps) => {
  capturedBarProps = props;
  return <div data-testid="attendance-graph-chart" />;
});

let capturedBarProps: MockBarProps | null = null;

jest.mock("react-chartjs-2", () => ({
  Bar: (props: MockBarProps) => mockBar(props),
}));

const makeAttendance = (overrides: Partial<Attendance> = {}): Attendance =>
  ({
    __typename: "Attendance",
    id: "att-1",
    staffId: "staff-1",
    workDate: "2024-06-01",
    startTime: "2024-06-01T09:00:00Z",
    endTime: "2024-06-01T18:00:00Z",
    paidHolidayFlag: false,
    rests: [],
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
    ...overrides,
  }) as Attendance;

function WithConfig({ children }: { children: ReactNode }) {
  return (
    <AppConfigContext.Provider
      value={
        {
          getStandardWorkHours: () => 8,
        } as React.ContextType<typeof AppConfigContext>
      }
    >
      {children}
    </AppConfigContext.Provider>
  );
}

describe("AttendanceGraph", () => {
  beforeEach(() => {
    capturedBarProps = null;
    jest.clearAllMocks();
  });

  it("有給休暇日の休憩時間はグラフに表示せず、有給休暇系列に計上する", () => {
    const attendances = [
      makeAttendance({
        paidHolidayFlag: true,
        rests: [
          {
            __typename: "Rest",
            startTime: "2024-06-01T12:00:00Z",
            endTime: "2024-06-01T13:00:00Z",
          },
        ],
      }),
    ];

    render(
      <WithConfig>
        <AttendanceGraph attendances={attendances} month={dayjs("2024-06-01")} />
      </WithConfig>,
    );

    if (!capturedBarProps) {
      throw new Error("Bar props were not captured");
    }

    const paidHolidayDataset = capturedBarProps.data.datasets.find(
      (dataset) => dataset.label === "有給休暇",
    );
    const restDataset = capturedBarProps.data.datasets.find(
      (dataset) => dataset.label === "休憩時間",
    );
    const workDataset = capturedBarProps.data.datasets.find(
      (dataset) => dataset.label === "勤務時間",
    );

    expect((paidHolidayDataset?.data ?? [])[0]).toBe(9);
    expect((restDataset?.data ?? [])[0]).toBe(0);
    expect((workDataset?.data ?? [])[0]).toBe(0);
  });
});
