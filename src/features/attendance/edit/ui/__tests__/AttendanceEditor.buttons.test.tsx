import { render, screen } from "@testing-library/react";
import type { PropsWithChildren, ReactElement } from "react";
import type { Control, FieldValues } from "react-hook-form";

import AttendanceEditor from "../AttendanceEditor";

// モック群
jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
}));
jest.mock("@entities/attendance/api/attendanceApi", () => ({
  useCreateAttendanceMutation: () => [jest.fn()],
  useUpdateAttendanceMutation: () => [jest.fn()],
}));
jest.mock("@entities/app-config/model/useAppConfig", () => {
  const mockTime = { format: () => "09:00" };
  const mockTimeFn = () => mockTime;
  return () => ({
    derived: {
      lunchRestStartTime: undefined,
      lunchRestEndTime: undefined,
      hourlyPaidHolidayEnabled: false,
      specialHolidayEnabled: false,
      startTime: undefined,
      endTime: undefined,
      absentEnabled: true,
    },
    loading: false,
    config: null,
    getStartTime: mockTimeFn,
    getEndTime: mockTimeFn,
    getLunchRestStartTime: mockTimeFn,
    getLunchRestEndTime: mockTimeFn,
    getAmHolidayStartTime: mockTimeFn,
    getAmHolidayEndTime: mockTimeFn,
    getPmHolidayStartTime: mockTimeFn,
    getPmHolidayEndTime: mockTimeFn,
    getAmPmHolidayEnabled: () => false,
    getSpecialHolidayEnabled: () => false,
    getHourlyPaidHolidayEnabled: () => false,
    getAbsentEnabled: () => true,
  });
});
jest.mock("@app/providers/auth/AuthContext", () => ({
  AuthContext: jest
    .requireActual<typeof import("react")>("react")
    .createContext({
      authStatus: "authenticated",
      cognitoUser: null,
      session: { roles: [] },
      signOut: () => {},
      signIn: () => {},
      hasRole: () => false,
      isCognitoUserRole: () => false,
      isAuthenticated: true,
      isLoading: false,
      roles: [],
    }),
}));
jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  useStaffs: () => ({ loading: false, error: null }),
}));
jest.mock("react-router-dom", () => ({
  Link: ({ children }: PropsWithChildren) => <>{children}</>,
  useNavigate: () => jest.fn(),
  useParams: () => ({ targetWorkDate: "20240115", staffId: "dummy" }),
  useSearchParams: () => [{ get: () => null }, jest.fn()],
}));
jest.mock("@entities/attendance/hooks/useOvertimeRequest", () => ({
  useOvertimeRequest: () => ({
    overtimeRequestEndTime: null,
    hasOvertimeRequest: false,
  }),
}));
jest.mock("@shared/ui/feedback/usePageLeaveGuard", () => ({
  usePageLeaveGuard: () => ({ dialog: null, runWithoutGuard: jest.fn() }),
}));
jest.mock("../../model/useAttendanceRecord", () => ({
  useAttendanceRecord: () => ({
    attendance: null,
    staff: null,
    workDate: null,
    historiesLoading: false,
    sortedHistories: [],
    historyIndex: 0,
    setHistoryIndex: jest.fn(),
    applyHistory: jest.fn(),
    refetchAttendance: jest.fn(),
    hasAttendanceFetched: true,
  }),
}));

// react-hook-form mock — formState はテストごとに上書きできる可変オブジェクト
const currentFormState = {
  isDirty: false,
  isValid: true,
  isSubmitting: false,
};

jest.mock("react-hook-form", () => ({
  useForm: () => ({
    register: jest.fn(),
    control: {} as unknown as Control<FieldValues>,
    watch: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(),
    handleSubmit: () => jest.fn(),
    reset: jest.fn(),
    get formState() {
      return {
        errors: {},
        isDirty: currentFormState.isDirty,
        isValid: currentFormState.isValid,
        isSubmitting: currentFormState.isSubmitting,
      };
    },
  }),
  useFieldArray: () => ({
    fields: [],
    remove: jest.fn(),
    append: jest.fn(),
    replace: jest.fn(),
    update: jest.fn(),
  }),
  Controller: ({
    render,
  }: {
    render: (params: {
      field: Record<string, unknown>;
      fieldState: Record<string, unknown>;
      formState: Record<string, unknown>;
    }) => ReactElement;
  }) => render({ field: {}, fieldState: {}, formState: {} }),
  useWatch: jest.fn(),
  useFormState: () => ({ errors: {} }),
}));


describe("AttendanceEditor SaveButton", () => {
  const renderEditor = (state: {
    isDirty: boolean;
    isValid: boolean;
    isSubmitting: boolean;
  }) => {
    currentFormState.isDirty = state.isDirty;
    currentFormState.isValid = state.isValid;
    currentFormState.isSubmitting = state.isSubmitting;
    render(<AttendanceEditor readOnly={false} />);
  };

  test("保存ボタンは isDirty=false で無効", async () => {
    renderEditor({ isDirty: false, isValid: true, isSubmitting: false });
    const btn = await screen.findByRole("button", { name: "保存" });
    expect(btn).toBeDisabled();
  });

  test("保存ボタンは isValid=false で無効", async () => {
    renderEditor({ isDirty: true, isValid: false, isSubmitting: false });
    const btn = await screen.findByRole("button", { name: "保存" });
    expect(btn).toBeDisabled();
  });

  test("保存ボタンは isSubmitting=true で無効", async () => {
    renderEditor({ isDirty: true, isValid: true, isSubmitting: true });
    const btn = await screen.findByRole("button", { name: "保存中..." });
    expect(btn).toBeDisabled();
  });

  test("保存ボタンは isDirty=true && isValid=true && isSubmitting=false で有効", async () => {
    renderEditor({ isDirty: true, isValid: true, isSubmitting: false });
    const btn = await screen.findByRole("button", { name: "保存" });
    expect(btn).toBeEnabled();
  });
});

