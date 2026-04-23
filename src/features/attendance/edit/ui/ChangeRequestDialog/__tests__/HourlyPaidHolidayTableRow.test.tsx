import { HourlyPaidHolidayTime } from "@shared/api/graphql/types";
import { render, screen } from "@testing-library/react";
import React from "react";

import HourlyPaidHolidayTableRow from "../HourlyPaidHolidayTableRow";

const makeTime = (
  startTime: string,
  endTime: string,
): HourlyPaidHolidayTime => ({
  __typename: "HourlyPaidHolidayTime",
  startTime,
  endTime,
});

const renderRow = (
  props: React.ComponentProps<typeof HourlyPaidHolidayTableRow>,
) =>
  render(
    <table>
      <tbody>
        <HourlyPaidHolidayTableRow {...props} />
      </tbody>
    </table>,
  );

describe("HourlyPaidHolidayTableRow", () => {
  it("renders the label '時間単位休暇'", () => {
    renderRow({ hours: null });
    expect(screen.getByText("時間単位休暇")).toBeInTheDocument();
  });

  describe("renderValue – variant='before' (default)", () => {
    it("renders '変更なし' when hours is null and no times", () => {
      renderRow({ hours: null });
      expect(screen.getByText("変更なし")).toBeInTheDocument();
    });

    it("renders 'なし' when hours is 0 and no times", () => {
      renderRow({ hours: 0 });
      expect(screen.getByText("なし")).toBeInTheDocument();
    });

    it("renders HH:mm formatted time for whole hours", () => {
      renderRow({ hours: 2 });
      expect(screen.getByText("02:00")).toBeInTheDocument();
    });

    it("renders HH:mm formatted time for fractional hours", () => {
      renderRow({ hours: 1.5 });
      expect(screen.getByText("01:30")).toBeInTheDocument();
    });

    it("renders 'なし' when hours is undefined and no times", () => {
      renderRow({ hours: undefined });
      expect(screen.getByText("変更なし")).toBeInTheDocument();
    });
  });

  describe("renderValue – variant='after'", () => {
    it("renders '変更なし' when hours is null and no times", () => {
      renderRow({ hours: null, variant: "after" });
      expect(screen.getByText("変更なし")).toBeInTheDocument();
    });

    it("renders formatted time for hours value", () => {
      renderRow({ hours: 3, variant: "after" });
      expect(screen.getByText("03:00")).toBeInTheDocument();
    });
  });

  describe("times rendering", () => {
    it("renders time range string from times array", () => {
      const times = [makeTime("2024-01-15T09:00:00", "2024-01-15T10:00:00")];
      renderRow({ hours: null, times });
      expect(screen.getByText("09:00〜10:00")).toBeInTheDocument();
    });

    it("renders multiple time ranges joined by ', '", () => {
      const times = [
        makeTime("2024-01-15T09:00:00", "2024-01-15T10:00:00"),
        makeTime("2024-01-15T14:00:00", "2024-01-15T15:00:00"),
      ];
      renderRow({ hours: null, times });
      expect(screen.getByText("09:00〜10:00, 14:00〜15:00")).toBeInTheDocument();
    });

    it("filters out null entries in times array", () => {
      const times = [
        null,
        makeTime("2024-01-15T09:00:00", "2024-01-15T10:00:00"),
      ];
      renderRow({ hours: null, times });
      expect(screen.getByText("09:00〜10:00")).toBeInTheDocument();
    });
  });

  describe("changed styling", () => {
    it("renders value cell without special styling when value matches before", () => {
      const { container } = renderRow({
        hours: 2,
        variant: "after",
        beforeHours: 2,
      });
      const cells = container.querySelectorAll("td");
      const valueCell = cells[1];
      expect(valueCell.textContent).toBe("02:00");
    });

    it("renders value cell with error colour when changed from beforeHours", () => {
      const { container } = renderRow({
        hours: 3,
        variant: "after",
        beforeHours: 2,
      });
      const cells = container.querySelectorAll("td");
      const valueCell = cells[1];
      expect(valueCell.textContent).toBe("03:00");
    });

    it("renders 'なし' without changed indicator when beforeHours is also 0", () => {
      renderRow({ hours: 0, variant: "before", beforeHours: 0 });
      expect(screen.getByText("なし")).toBeInTheDocument();
    });

    it("renders '変更なし' with no changed indicator when both hours are null", () => {
      renderRow({ hours: null, variant: "after", beforeHours: null });
      expect(screen.getByText("変更なし")).toBeInTheDocument();
    });

    it("renders with changed indicator when times differ from beforeTimes", () => {
      const times = [makeTime("2024-01-15T09:00:00", "2024-01-15T10:00:00")];
      const beforeTimes = [
        makeTime("2024-01-15T10:00:00", "2024-01-15T11:00:00"),
      ];
      renderRow({ hours: null, times, variant: "after", beforeTimes });
      expect(screen.getByText("09:00〜10:00")).toBeInTheDocument();
    });
  });

  describe("beforeHours / beforeTimes display logic", () => {
    it("does not crash when beforeHours is provided and afterHours is null", () => {
      renderRow({ hours: null, variant: "after", beforeHours: 2 });
      expect(screen.getByText("変更なし")).toBeInTheDocument();
    });

    it("renders time range from beforeTimes when beforeTimes is provided", () => {
      const beforeTimes = [
        makeTime("2024-01-15T09:00:00", "2024-01-15T10:00:00"),
      ];
      renderRow({
        hours: 2,
        variant: "after",
        beforeHours: null,
        beforeTimes,
      });
      expect(screen.getByText("02:00")).toBeInTheDocument();
    });
  });
});
