import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import {
  useLazyGetAttendanceByStaffAndDateQuery,
  useUpdateAttendanceMutation,
  useUpsertAttendanceByStaffAndDateMutation,
} from "@entities/attendance/api/attendanceApi";
import {
  clockInAction,
  clockOutAction,
} from "@entities/attendance/lib/actions/attendanceActions";
import { validateOfficeQrToken } from "@features/attendance/office-qr-register/lib/validateToken";
import { useOfficeQrRegister } from "@features/attendance/office-qr-register/model/useOfficeQrRegister";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";

jest.mock("@entities/attendance/api/attendanceApi", () => ({
  useLazyGetAttendanceByStaffAndDateQuery: jest.fn(),
  useUpdateAttendanceMutation: jest.fn(),
  useUpsertAttendanceByStaffAndDateMutation: jest.fn(),
}));
jest.mock("@entities/attendance/lib/actions/attendanceActions", () => ({
  clockInAction: jest.fn(),
  clockOutAction: jest.fn(),
}));
jest.mock(
  "@entities/attendance/lib/businessDate",
  () => ({
    resolveBusinessWorkDate: jest.fn(() => "2024-01-15"),
    resolveCurrentBusinessWorkDate: jest.fn(() => "2024-01-15"),
  }),
);
jest.mock("@entities/attendance/lib/operationContext", () => ({
  buildAttendanceIdempotencyKey: jest.fn(() => "idempotency-key"),
}));
jest.mock("@entities/attendance/lib/time", () => ({
  getNowISOStringWithZeroSeconds: jest.fn(() => "2024-01-15T09:00:00"),
}));
jest.mock(
  "@features/attendance/office-qr-register/lib/validateToken",
  () => ({
    validateOfficeQrToken: jest.fn(),
  }),
);
jest.mock("@shared/lib/logger", () => ({
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));
jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: jest.fn((payload) => ({ type: "notification/push", payload })),
}));
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  useSearchParams: jest.fn(),
}));

const mockDispatch = jest.fn();
const mockTriggerGetAttendance = jest.fn();
const mockTriggerUnwrap = jest.fn();
const mockUpsertMutation = jest.fn();
const mockUpdateMutation = jest.fn();

const mockClockIn = clockInAction as jest.Mock;
const mockClockOut = clockOutAction as jest.Mock;
const mockValidateToken = validateOfficeQrToken as jest.Mock;

const makeAttendance = () => ({
  id: "att-1",
  staffId: "user-1",
  workDate: "2024-01-15",
  startTime: "2024-01-15T09:00:00",
  endTime: null,
});

function buildWrapper(
  appConfigValue: Partial<{ getOfficeMode: () => boolean }> = {},
  authValue: Partial<{ cognitoUser: { id: string } | null }> = {},
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      AppConfigContext.Provider,
      {
        value: {
          getOfficeMode: jest.fn(() => true),
          ...appConfigValue,
        } as unknown as React.ContextType<typeof AppConfigContext>,
      },
      React.createElement(
        AuthContext.Provider,
        {
          value: {
            cognitoUser: { id: "user-1" },
            ...authValue,
          } as unknown as React.ContextType<typeof AuthContext>,
        },
        children,
      ),
    );
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
}

describe("useOfficeQrRegister", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
    mockTriggerUnwrap.mockResolvedValue(makeAttendance());
    mockTriggerGetAttendance.mockReturnValue({ unwrap: mockTriggerUnwrap });
    (useLazyGetAttendanceByStaffAndDateQuery as jest.Mock).mockReturnValue([
      mockTriggerGetAttendance,
      {},
    ]);
    mockUpsertMutation.mockReturnValue({ unwrap: jest.fn().mockResolvedValue(makeAttendance()) });
    mockUpdateMutation.mockReturnValue({ unwrap: jest.fn().mockResolvedValue(makeAttendance()) });
    (useUpsertAttendanceByStaffAndDateMutation as jest.Mock).mockReturnValue([mockUpsertMutation]);
    (useUpdateAttendanceMutation as jest.Mock).mockReturnValue([mockUpdateMutation]);
    (useSearchParams as jest.Mock).mockReturnValue([
      new URLSearchParams("mode=clock_in&timestamp=2024-01-15T09:00:00&token=valid-token"),
    ]);
    mockValidateToken.mockResolvedValue(true);
  });

  describe("token validation", () => {
    it("sets isValidToken true when token is valid", async () => {
      mockValidateToken.mockResolvedValue(true);
      const { result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper(),
      });

      await waitFor(() => {
        expect(mockValidateToken).toHaveBeenCalledWith(
          "2024-01-15T09:00:00",
          "valid-token",
        );
        expect(result.current.errorMessage).toBeNull();
      });
    });

    it("sets errorMessage when token is invalid", async () => {
      mockValidateToken.mockResolvedValue(false);
      const { result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper(),
      });

      await waitFor(() => {
        expect(result.current.errorMessage).toContain("無効なトークン");
      });
    });
  });

  describe("qrMode derivation", () => {
    it("returns clock_in mode when mode param is clock_in", () => {
      (useSearchParams as jest.Mock).mockReturnValue([
        new URLSearchParams("mode=clock_in&timestamp=t&token=tok"),
      ]);
      const { result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper(),
      });

      expect(result.current.mode).toBe("clock_in");
    });

    it("returns clock_out mode when mode param is clock_out", () => {
      (useSearchParams as jest.Mock).mockReturnValue([
        new URLSearchParams("mode=clock_out&timestamp=t&token=tok"),
      ]);
      const { result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper(),
      });

      expect(result.current.mode).toBe("clock_out");
    });

    it("returns null mode for unknown mode param and shows error", async () => {
      mockValidateToken.mockResolvedValue(true);
      (useSearchParams as jest.Mock).mockReturnValue([
        new URLSearchParams("mode=unknown&timestamp=t&token=tok"),
      ]);
      const { result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper(),
      });

      await waitFor(() => {
        expect(result.current.mode).toBeNull();
        expect(result.current.errorMessage).toContain("無効なアクセス");
      });
    });
  });

  describe("attendance fetching", () => {
    it("fetches attendance when officeMode enabled and user authenticated", async () => {
      const { result: _result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper({ getOfficeMode: () => true }),
      });

      await waitFor(() => {
        expect(mockTriggerGetAttendance).toHaveBeenCalledWith({
          staffId: "user-1",
          workDate: "2024-01-15",
        });
      });
    });

    it("does not fetch attendance when officeMode is disabled", async () => {
      const { result: _result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper({ getOfficeMode: () => false }),
      });

      await waitFor(() => {
        expect(mockTriggerGetAttendance).not.toHaveBeenCalled();
      });
    });

    it("does not fetch attendance when user is not authenticated", async () => {
      const { result: _result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper({}, { cognitoUser: null }),
      });

      await waitFor(() => {
        expect(mockTriggerGetAttendance).not.toHaveBeenCalled();
      });
    });

    it("dispatches error notification when attendance fetch fails", async () => {
      mockTriggerUnwrap.mockRejectedValue(new Error("Fetch error"));
      const { result: _result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper({ getOfficeMode: () => true }),
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({ type: "notification/push" }),
        );
        expect(pushNotification).toHaveBeenCalledWith(
          expect.objectContaining({ tone: "error" }),
        );
      });
    });
  });

  describe("handleClockIn", () => {
    it("calls clockInAction and dispatches success notification", async () => {
      const updatedAttendance = makeAttendance();
      mockClockIn.mockResolvedValue(updatedAttendance);

      const { result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.handleClockIn();
      });

      expect(mockClockIn).toHaveBeenCalledWith(
        expect.objectContaining({ staffId: "user-1" }),
      );
      expect(pushNotification).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "success", message: expect.stringContaining("出勤") }),
      );
    });

    it("dispatches error notification when clockInAction fails", async () => {
      mockClockIn.mockRejectedValue(new Error("Clock in failed"));

      const { result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.handleClockIn();
      });

      expect(pushNotification).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error", message: expect.stringContaining("出勤") }),
      );
    });

    it("does nothing when user is not authenticated", async () => {
      const { result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper({}, { cognitoUser: null }),
      });

      await act(async () => {
        await result.current.handleClockIn();
      });

      expect(mockClockIn).not.toHaveBeenCalled();
    });
  });

  describe("handleClockOut", () => {
    it("calls clockOutAction and dispatches success notification", async () => {
      const updatedAttendance = makeAttendance();
      mockClockOut.mockResolvedValue(updatedAttendance);

      const { result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.handleClockOut();
      });

      expect(mockClockOut).toHaveBeenCalledWith(
        expect.objectContaining({ staffId: "user-1" }),
      );
      expect(pushNotification).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "success", message: expect.stringContaining("退勤") }),
      );
    });

    it("dispatches error notification when clockOutAction fails", async () => {
      mockClockOut.mockRejectedValue(new Error("Clock out failed"));

      const { result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper(),
      });

      await act(async () => {
        await result.current.handleClockOut();
      });

      expect(pushNotification).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error", message: expect.stringContaining("退勤") }),
      );
    });

    it("does nothing when user is not authenticated", async () => {
      const { result } = renderHook(() => useOfficeQrRegister(), {
        wrapper: buildWrapper({}, { cognitoUser: null }),
      });

      await act(async () => {
        await result.current.handleClockOut();
      });

      expect(mockClockOut).not.toHaveBeenCalled();
    });
  });
});
