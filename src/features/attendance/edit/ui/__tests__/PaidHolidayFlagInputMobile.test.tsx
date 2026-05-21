import type { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import PaidHolidayFlagInputMobile from "@features/attendance/edit/ui/PaidHolidayFlagInputMobile";
import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import type { ReactElement } from "react";
import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";

const mockFieldOnChange = jest.fn();
let mockFieldValue = false;

jest.mock("react-hook-form", () => ({
  Controller: ({
    render,
  }: {
    render: (params: {
      field: { value: boolean; onChange: jest.Mock };
    }) => ReactElement;
  }) =>
    render({
      field: {
        value: mockFieldValue,
        onChange: mockFieldOnChange,
      },
    }),
}));

jest.mock("@entities/app-config/model/useAppConfig", () => () => ({
  getStartTime: () => dayjs("2024-04-01T09:00:00"),
  getEndTime: () => dayjs("2024-04-01T18:00:00"),
  getLunchRestStartTime: () => dayjs("2024-04-01T12:00:00"),
  getLunchRestEndTime: () => dayjs("2024-04-01T13:00:00"),
}));

describe("PaidHolidayFlagInputMobile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFieldValue = false;
  });

  test("ON時に有給の自動設定を反映する", () => {
    const setValue = jest.fn() as unknown as UseFormSetValue<AttendanceEditInputs>;
    const getValues = ((name: keyof AttendanceEditInputs) => {
      if (name === "remarkTags") return [];
      if (name === "specialHolidayFlag") return true;
      return null;
    }) as unknown as UseFormGetValues<AttendanceEditInputs>;

    render(
      <PaidHolidayFlagInputMobile
        control={{} as never}
        setValue={setValue}
        workDate="2024-05-10"
        setPaidHolidayTimes
        getValues={getValues}
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));

    expect(mockFieldOnChange).toHaveBeenCalledWith(true);
    expect(setValue).toHaveBeenCalledWith("paidHolidayFlag", true);
    expect(setValue).toHaveBeenCalledWith(
      "remarkTags",
      expect.arrayContaining(["有給休暇"])
    );
    expect(setValue).toHaveBeenCalledWith("specialHolidayFlag", false);
    expect(setValue).toHaveBeenCalledWith(
      "rests",
      expect.arrayContaining([
        expect.objectContaining({
          startTime: expect.any(String),
          endTime: expect.any(String),
        }),
      ])
    );
  });

  test("OFF時に有給タグを外す", () => {
    mockFieldValue = true;
    const setValue = jest.fn() as unknown as UseFormSetValue<AttendanceEditInputs>;
    const getValues = ((name: keyof AttendanceEditInputs) => {
      if (name === "remarkTags") return ["有給休暇", "その他"];
      return null;
    }) as unknown as UseFormGetValues<AttendanceEditInputs>;

    render(
      <PaidHolidayFlagInputMobile
        control={{} as never}
        setValue={setValue}
        workDate="2024-05-10"
        setPaidHolidayTimes
        getValues={getValues}
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));

    expect(mockFieldOnChange).toHaveBeenCalledWith(false);
    expect(setValue).toHaveBeenCalledWith("paidHolidayFlag", false);
    expect(setValue).toHaveBeenCalledWith("remarkTags", ["その他"]);
    expect(setValue).not.toHaveBeenCalledWith("specialHolidayFlag", false);
  });
});
