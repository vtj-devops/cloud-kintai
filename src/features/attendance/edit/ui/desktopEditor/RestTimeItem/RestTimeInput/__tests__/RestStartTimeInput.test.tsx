import {
  AppConfigContext,
  AppConfigContextProps,
  FALLBACK_DERIVED,
} from "@entities/app-config/model/AppConfigContext";
import {
  AttendanceEditContext,
  AttendanceEditUiContext,
  defaultAttendanceEditContextValue,
} from "@features/attendance/edit/model/AttendanceEditProvider";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import React from "react";
import { FieldArrayWithId, useForm } from "react-hook-form";

import RestStartTimeInput from "../RestStartTimeInput";

// ─── AppConfig mock value ──────────────────────────────────────────────────────

const mockAppConfigContext: AppConfigContextProps = {
  ...{} as AppConfigContextProps,
  config: null,
  fetchConfig: async () => {},
  saveConfig: async () => {},
  getConfigId: () => null,
  getStartTime: () => dayjs("2024-04-01T09:00:00"),
  getEndTime: () => dayjs("2024-04-01T18:00:00"),
  getLunchRestStartTime: () => dayjs("2024-04-01T12:00:00"),
  getLunchRestEndTime: () => dayjs("2024-04-01T13:00:00"),
  getStandardWorkHours: () => 8,
  getLinks: () => [],
  getReasons: () => [],
  getOfficeMode: () => false,
  getAttendanceStatisticsEnabled: () => false,
  getWorkflowNotificationEnabled: () => false,
  getTimeRecorderAnnouncement: () => ({ enabled: false, message: "" }),
  getShiftCollaborativeEnabled: () => false,
  getShiftDefaultMode: () => "normal",
  getQuickInputStartTimes: () => [],
  getQuickInputEndTimes: () => [],
  getShiftGroups: () => [],
  getHourlyPaidHolidayEnabled: () => false,
  getAmHolidayStartTime: () => dayjs("2024-04-01T09:00:00"),
  getAmHolidayEndTime: () => dayjs("2024-04-01T12:00:00"),
  getPmHolidayStartTime: () => dayjs("2024-04-01T13:00:00"),
  getPmHolidayEndTime: () => dayjs("2024-04-01T18:00:00"),
  getAmPmHolidayEnabled: () => false,
  getSpecialHolidayEnabled: () => false,
  getAbsentEnabled: () => false,
  getOverTimeCheckEnabled: () => false,
  getWorkflowCategoryOrder: () => [],
  getThemeColor: () => FALLBACK_DERIVED.themeColor,
  getThemeTokens: () => FALLBACK_DERIVED.themeTokens,
};

// ─── Wrapper component ─────────────────────────────────────────────────────────

interface WrapperProps {
  startTimeValue?: string | null;
  changeRequests?: { __typename: "AttendanceChangeRequest" }[];
  readOnly?: boolean;
  restUpdateMock?: jest.Mock;
  testIdPrefix?: string;
  index?: number;
}

function Wrapper({
  startTimeValue = null,
  changeRequests = [],
  readOnly = false,
  restUpdateMock = jest.fn(),
  testIdPrefix = "desktop",
  index = 0,
}: WrapperProps) {
  const { control } = useForm<AttendanceEditInputs>({
    defaultValues: {
      rests: [{ startTime: startTimeValue, endTime: null }],
    },
  });

  const workDate = dayjs("2024-04-01");

  const rest = {
    id: "field-0",
    startTime: startTimeValue,
    endTime: null,
  } as unknown as FieldArrayWithId<AttendanceEditInputs, "rests", "id">;

  return (
    <AttendanceEditContext.Provider
      value={{
        ...defaultAttendanceEditContextValue,
        workDate,
        control,
        changeRequests: changeRequests as never,
        restUpdate: restUpdateMock,
      }}
    >
      <AttendanceEditUiContext.Provider
        value={{
          ...defaultAttendanceEditContextValue,
          readOnly,
        }}
      >
        <AppConfigContext.Provider value={mockAppConfigContext}>
          <RestStartTimeInput
            rest={rest}
            index={index}
            testIdPrefix={testIdPrefix}
          />
        </AppConfigContext.Provider>
      </AttendanceEditUiContext.Provider>
    </AttendanceEditContext.Provider>
  );
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("RestStartTimeInput", () => {
  describe("rendering", () => {
    it("renders the input field", () => {
      render(<Wrapper />);
      expect(
        screen.getByTestId("rest-start-time-input-desktop-0"),
      ).toBeInTheDocument();
    });

    it("uses custom testIdPrefix in data-testid", () => {
      render(<Wrapper testIdPrefix="mobile" />);
      expect(
        screen.getByTestId("rest-start-time-input-mobile-0"),
      ).toBeInTheDocument();
    });

    it("uses index in data-testid", () => {
      render(<Wrapper index={2} />);
      expect(
        screen.getByTestId("rest-start-time-input-desktop-2"),
      ).toBeInTheDocument();
    });

    it("shows existing time value formatted as HH:mm", () => {
      // Use a local-time ISO string (no "Z") to avoid timezone issues
      render(<Wrapper startTimeValue="2024-04-01T09:30:00" />);
      const input = screen.getByTestId("rest-start-time-input-desktop-0");
      expect(input).toHaveValue("09:30");
    });

    it("shows empty string when startTime is null", () => {
      render(<Wrapper startTimeValue={null} />);
      const input = screen.getByTestId("rest-start-time-input-desktop-0");
      expect(input).toHaveValue("");
    });
  });

  describe("returns null when context is incomplete", () => {
    it("renders nothing when workDate is null", () => {
      const { result: formResult } = renderHook(() =>
        useForm<AttendanceEditInputs>({
          defaultValues: { rests: [{ startTime: null, endTime: null }] },
        }),
      );
      const control = formResult.current.control;

      const rest = {
        id: "field-0",
        startTime: null,
        endTime: null,
      } as unknown as FieldArrayWithId<AttendanceEditInputs, "rests", "id">;

      const { container } = render(
        <AttendanceEditContext.Provider
          value={{
            ...defaultAttendanceEditContextValue,
            workDate: null,
            control,
            changeRequests: [],
            restUpdate: jest.fn(),
          }}
        >
          <AttendanceEditUiContext.Provider
            value={{ ...defaultAttendanceEditContextValue, readOnly: false }}
          >
            <AppConfigContext.Provider value={mockAppConfigContext}>
              <RestStartTimeInput rest={rest} index={0} />
            </AppConfigContext.Provider>
          </AttendanceEditUiContext.Provider>
        </AttendanceEditContext.Provider>,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("disabled state", () => {
    it("disables the input when changeRequests is non-empty", () => {
      render(
        <Wrapper
          changeRequests={[{ __typename: "AttendanceChangeRequest" }]}
        />,
      );
      const input = screen.getByTestId("rest-start-time-input-desktop-0");
      expect(input).toBeDisabled();
    });

    it("enables the input when changeRequests is empty", () => {
      render(<Wrapper changeRequests={[]} />);
      const input = screen.getByTestId("rest-start-time-input-desktop-0");
      expect(input).not.toBeDisabled();
    });

    it("disables the input when readOnly is true", () => {
      render(<Wrapper readOnly={true} />);
      const input = screen.getByTestId("rest-start-time-input-desktop-0");
      expect(input).toBeDisabled();
    });
  });

  describe("dropdown toggle button", () => {
    it("renders the dropdown toggle button with correct aria-label", () => {
      render(<Wrapper index={0} />);
      expect(
        screen.getByRole("button", { name: "rest-start-time-0-options" }),
      ).toBeInTheDocument();
    });

    it("dropdown toggle button is disabled when readOnly", () => {
      render(<Wrapper readOnly={true} />);
      const btn = screen.getByRole("button", {
        name: "rest-start-time-0-options",
      });
      expect(btn).toBeDisabled();
    });

    it("dropdown toggle button is disabled when changeRequests is non-empty", () => {
      render(
        <Wrapper
          changeRequests={[{ __typename: "AttendanceChangeRequest" }]}
        />,
      );
      const btn = screen.getByRole("button", {
        name: "rest-start-time-0-options",
      });
      expect(btn).toBeDisabled();
    });
  });

  describe("focus behavior", () => {
    it("opens dropdown on focus when not readOnly and not disabled", async () => {
      const user = userEvent.setup({ delay: null });
      render(<Wrapper />);
      const input = screen.getByTestId("rest-start-time-input-desktop-0");
      await user.click(input);
      // Dropdown shows the lunch time option (12:00 from mock config)
      await waitFor(() => {
        expect(screen.getByText("12:00")).toBeInTheDocument();
      });
    });

    it("does not open dropdown on focus when readOnly", async () => {
      const user = userEvent.setup({ delay: null });
      render(<Wrapper readOnly={true} />);
      const input = screen.getByTestId("rest-start-time-input-desktop-0");
      await user.click(input);
      expect(screen.queryByText("12:00")).not.toBeInTheDocument();
    });

    it("does not open dropdown on focus when disabled", async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Wrapper
          changeRequests={[{ __typename: "AttendanceChangeRequest" }]}
        />,
      );
      const input = screen.getByTestId("rest-start-time-input-desktop-0");
      await user.click(input);
      expect(screen.queryByText("12:00")).not.toBeInTheDocument();
    });
  });

  describe("typing behavior", () => {
    it("accepts digit input and normalizes to HH:mm format after 4 digits", async () => {
      const user = userEvent.setup({ delay: null });
      const restUpdateMock = jest.fn();
      render(<Wrapper restUpdateMock={restUpdateMock} />);
      const input = screen.getByTestId("rest-start-time-input-desktop-0");
      await user.click(input);
      await user.type(input, "1200");
      // restUpdate should be called with the formatted ISO time
      await waitFor(() => {
        expect(restUpdateMock).toHaveBeenCalled();
      });
      const call = restUpdateMock.mock.calls[0];
      expect(call[0]).toBe(0);
      // startTime is an ISO string; verify local hour is 12:00
      expect(dayjs(call[1].startTime).format("HH:mm")).toBe("12:00");
    });

    it("does not call restUpdate for incomplete time input", async () => {
      const user = userEvent.setup({ delay: null });
      const restUpdateMock = jest.fn();
      render(<Wrapper restUpdateMock={restUpdateMock} />);
      const input = screen.getByTestId("rest-start-time-input-desktop-0");
      await user.click(input);
      await user.type(input, "12");
      expect(restUpdateMock).not.toHaveBeenCalled();
    });
  });

  describe("select from dropdown", () => {
    it("calls restUpdate when a time is selected from dropdown", async () => {
      const user = userEvent.setup({ delay: null });
      const restUpdateMock = jest.fn();
      render(<Wrapper restUpdateMock={restUpdateMock} />);
      const input = screen.getByTestId("rest-start-time-input-desktop-0");
      await user.click(input);
      // Dropdown should show 12:00 from mock config
      await waitFor(() => {
        expect(screen.getByText("12:00")).toBeInTheDocument();
      });
      const option = screen.getByText("12:00");
      await user.pointer([{ target: option, keys: "[MouseLeft>]" }]);
      await waitFor(() => {
        expect(restUpdateMock).toHaveBeenCalled();
      });
      const [calledIndex, calledRest] = restUpdateMock.mock.calls[0];
      expect(calledIndex).toBe(0);
      expect(dayjs(calledRest.startTime).format("HH:mm")).toBe("12:00");
    });
  });

  describe("blur behavior", () => {
    it("calls restUpdate on blur if inputDraft is a complete time", async () => {
      const user = userEvent.setup({ delay: null });
      const restUpdateMock = jest.fn();
      render(
        <div>
          <Wrapper restUpdateMock={restUpdateMock} />
          <button type="button">outside</button>
        </div>,
      );
      const input = screen.getByTestId("rest-start-time-input-desktop-0");
      await user.click(input);
      await user.type(input, "0930");
      await user.click(screen.getByRole("button", { name: "outside" }));
      await waitFor(() => {
        expect(restUpdateMock).toHaveBeenCalled();
      });
    });
  });

  describe("dropdown toggle interaction", () => {
    it("toggles dropdown open/closed via dropdown toggle button", async () => {
      const user = userEvent.setup({ delay: null });
      render(<Wrapper />);
      const toggleBtn = screen.getByRole("button", {
        name: "rest-start-time-0-options",
      });
      // Open dropdown
      await user.pointer([{ target: toggleBtn, keys: "[MouseLeft>]" }]);
      await waitFor(() => {
        expect(screen.getByText("12:00")).toBeInTheDocument();
      });
      // Toggle closes it
      await user.pointer([{ target: toggleBtn, keys: "[MouseLeft>]" }]);
      await waitFor(() => {
        expect(screen.queryByText("12:00")).not.toBeInTheDocument();
      });
    });

    it("does nothing when readOnly and dropdown button is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      render(<Wrapper readOnly={true} />);
      const toggleBtn = screen.getByRole("button", {
        name: "rest-start-time-0-options",
      });
      await user.pointer([{ target: toggleBtn, keys: "[MouseLeft>]" }]);
      expect(screen.queryByText("12:00")).not.toBeInTheDocument();
    });
  });
});
