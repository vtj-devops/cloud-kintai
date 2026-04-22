import { render, screen } from "@testing-library/react";
import type { PropsWithChildren, ReactElement } from "react";
import type { Control, FieldValues } from "react-hook-form";

// モック群
jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
}));
jest.mock("@entities/attendance/api/attendanceApi", () => ({
  useCreateAttendanceMutation: () => [jest.fn()],
  useUpdateAttendanceMutation: () => [jest.fn()],
}));
jest.mock("@entities/app-config/model/useAppConfig", () => () => ({
  getLunchRestStartTime: () => undefined,
  getLunchRestEndTime: () => undefined,
  getHourlyPaidHolidayEnabled: () => false,
  getSpecialHolidayEnabled: () => false,
  getStartTime: () => undefined,
  getEndTime: () => undefined,
  getAbsentEnabled: () => true,
  loading: false,
}));
jest.mock("@app/providers/auth/AuthContext", () => ({
  AuthContext: {
    _currentValue: { authStatus: "authenticated", cognitoUser: null },
  },
}));
jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  useStaffs: () => ({ loading: false, error: null }),
}));
jest.mock("react-router-dom", () => ({
  Link: ({ children }: PropsWithChildren) => <>{children}</>,
  useNavigate: () => jest.fn(),
  useParams: () => ({ targetWorkDate: "20240115", staffId: "dummy" }),
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

// useForm を状態可変でモック
const makeUseFormMock =
  (opts: { isDirty: boolean; isValid: boolean; isSubmitting: boolean }) =>
  () => ({
    register: jest.fn(),
    control: {} as unknown as Control<FieldValues>,
    watch: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(),
    handleSubmit: () => jest.fn(),
    reset: jest.fn(),
    formState: {
      errors: {},
      isDirty: opts.isDirty,
      isValid: opts.isValid,
      isSubmitting: opts.isSubmitting,
    },
  });

const makeUseFieldArrayMock = () => () => ({
  fields: [],
  remove: jest.fn(),
  append: jest.fn(),
  replace: jest.fn(),
  update: jest.fn(),
});

describe.skip("AttendanceEditor SaveButton", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  const renderEditor = async (state: {
    isDirty: boolean;
    isValid: boolean;
    isSubmitting: boolean;
  }) => {
    jest.doMock("react-hook-form", () => ({
      useForm: makeUseFormMock(state),
      useFieldArray: makeUseFieldArrayMock(),
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
    }));
    const AttendanceEditor = (await import("../AttendanceEditor")).default;
    render(<AttendanceEditor readOnly={false} />);
  };

  test("保存ボタンは isDirty=false で無効", async () => {
    await renderEditor({ isDirty: false, isValid: true, isSubmitting: false });
    const btn = await screen.findByText("保存");
    expect(btn).toBeDisabled();
  });

  test("保存ボタンは isValid=false で無効", async () => {
    await renderEditor({ isDirty: true, isValid: false, isSubmitting: false });
    const btn = await screen.findByText("保存");
    expect(btn).toBeDisabled();
  });

  test("保存ボタンは isSubmitting=true で無効", async () => {
    await renderEditor({ isDirty: true, isValid: true, isSubmitting: true });
    const btn = await screen.findByText("保存");
    expect(btn).toBeDisabled();
  });

  test("保存ボタンは isDirty=true && isValid=true && isSubmitting=false で有効", async () => {
    await renderEditor({ isDirty: true, isValid: true, isSubmitting: false });
    const btn = await screen.findByText("保存");
    expect(btn).toBeEnabled();
  });
});
