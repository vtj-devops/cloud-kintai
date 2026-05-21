import type { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import AttendanceEditProvider, {
  AttendanceEditContext,
} from "@features/attendance/edit/model/AttendanceEditProvider";
import type { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import type { AttendanceChangeRequest } from "@shared/api/graphql/types";
import { render, screen } from "@testing-library/react";
import React, { type ReactElement } from "react";
import type {
  Control,
  UseFormGetValues,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { MemoryRouter } from "react-router-dom";

// react-hook-formのuseFormState/Controllerを軽量モック
jest.mock("react-hook-form", () => ({
  useFormState: () => ({ errors: {} }),
  Controller: ({
    render,
  }: {
    render: (params: {
      field: Record<string, unknown>;
      fieldState: Record<string, unknown>;
      formState: Record<string, unknown>;
    }) => ReactElement;
  }) => render({ field: {}, fieldState: {}, formState: {} }),
}));
jest.mock("@entities/app-config/model/useAppConfig", () => () => ({
  getStartTime: () => undefined,
}));
jest.mock("@entities/operation-log/model/useOperationLog", () => () => ({
  create: jest.fn(),
}));

describe("AttendanceEditForm buttons", () => {
  const renderWithContext = async (
    ctx: Partial<React.ContextType<typeof AttendanceEditContext>>
  ) => {
    const watchMock = (arg: unknown) => {
      if (typeof arg === "string") return [];
      if (typeof arg === "function") return () => {};
      return undefined;
    };

    const value: React.ContextType<typeof AttendanceEditContext> = {
      workDate: null,
      attendance: null,
      staff: { cognitoUserId: "staff-id" } as StaffType,
      onSubmit: async () => {},
      isDirty: false,
      isValid: false,
      isSubmitting: false,
      errorMessages: [],
      restFields: [],
      changeRequests: [],
      readOnly: false,
      isOnBreak: false,
      register: jest.fn() as unknown as UseFormRegister<AttendanceEditInputs>,
      control: {} as unknown as Control<AttendanceEditInputs>,
      setValue: jest.fn() as unknown as UseFormSetValue<AttendanceEditInputs>,
      getValues: ((name: keyof AttendanceEditInputs) =>
        name === "remarkTags"
          ? []
          : null) as unknown as UseFormGetValues<AttendanceEditInputs>,
      watch: watchMock as unknown as UseFormWatch<AttendanceEditInputs>,
      handleSubmit:
        jest.fn() as unknown as UseFormHandleSubmit<AttendanceEditInputs>,
      hourlyPaidHolidayTimeFields: [],
      hourlyPaidHolidayTimeAppend: () => {},
      hourlyPaidHolidayTimeRemove: () => {},
      hourlyPaidHolidayTimeUpdate: () => {},
      hourlyPaidHolidayTimeReplace: () => {},
      hourlyPaidHolidayEnabled: false,
      ...ctx,
    };

    const { AttendanceEditForm } = await import("../AttendanceEditForm");
    return render(
      <MemoryRouter>
        <AttendanceEditProvider value={value}>
          <AttendanceEditForm />
        </AttendanceEditProvider>
      </MemoryRouter>
    );
  };

  test("申請ボタンは isDirty=false で無効", async () => {
    await renderWithContext({
      isDirty: false,
      isValid: true,
      isSubmitting: false,
    });
    const btn = screen.getByTestId("attendance-submit-button");
    expect(btn).toBeDisabled();
  });

  test("申請ボタンは isValid=false で無効", async () => {
    await renderWithContext({
      isDirty: true,
      isValid: false,
      isSubmitting: false,
    });
    const btn = screen.getByTestId("attendance-submit-button");
    expect(btn).toBeDisabled();
  });

  test("申請ボタンは isSubmitting=true で無効", async () => {
    await renderWithContext({
      isDirty: true,
      isValid: true,
      isSubmitting: true,
    });
    const btn = screen.getByTestId("attendance-submit-button");
    expect(btn).toBeDisabled();
  });

  test("申請ボタンは changeRequests>0 で無効", async () => {
    await renderWithContext({
      isDirty: true,
      isValid: true,
      isSubmitting: false,
      changeRequests: [{} as unknown as AttendanceChangeRequest],
    });
    const btn = screen.getByTestId("attendance-submit-button");
    expect(btn).toBeDisabled();
  });

  test("申請ボタンは isDirty=true && isValid=true && isSubmitting=false && changeRequests=0 で有効", async () => {
    await renderWithContext({
      isDirty: true,
      isValid: true,
      isSubmitting: false,
      changeRequests: [],
    });
    const btn = screen.getByTestId("attendance-submit-button");
    expect(btn).toBeEnabled();
  });
});
