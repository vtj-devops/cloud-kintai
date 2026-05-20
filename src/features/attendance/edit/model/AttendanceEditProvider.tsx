import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { Attendance, AttendanceChangeRequest } from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { createContext, useContext } from "react";
import {
  Control,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFieldArrayReplace,
  UseFieldArrayUpdate,
  UseFormGetValues,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

import { AttendanceEditInputs } from "./common";

type AttendanceEditDataContextProps = {
  workDate: dayjs.Dayjs | null | undefined;
  attendance: Attendance | null | undefined;
  staff: StaffType | null | undefined;
};

type AttendanceEditUiContextProps = {
  onSubmit: (data: AttendanceEditInputs) => Promise<void>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  submitErrorMessage?: string | null;
  errorMessages?: string[];
  changeRequests: AttendanceChangeRequest[];
  readOnly?: boolean;
  isOnBreak?: boolean;
  hourlyPaidHolidayEnabled: boolean;
};

type AttendanceEditFormContextProps = {
  restFields: FieldArrayWithId<AttendanceEditInputs, "rests", "id">[];
  restAppend?: UseFieldArrayAppend<AttendanceEditInputs, "rests">;
  restRemove?: UseFieldArrayRemove;
  restUpdate?: UseFieldArrayUpdate<AttendanceEditInputs, "rests">;
  restReplace?: UseFieldArrayReplace<AttendanceEditInputs, "rests">;
  register?: UseFormRegister<AttendanceEditInputs>;
  control?: Control<AttendanceEditInputs>;
  setValue?: UseFormSetValue<AttendanceEditInputs>;
  getValues?: UseFormGetValues<AttendanceEditInputs>;
  watch?: UseFormWatch<AttendanceEditInputs>;
  handleSubmit?: UseFormHandleSubmit<AttendanceEditInputs>;
  hourlyPaidHolidayTimeFields: FieldArrayWithId<
    AttendanceEditInputs,
    "hourlyPaidHolidayTimes",
    "id"
  >[];
  hourlyPaidHolidayTimeAppend: UseFieldArrayAppend<
    AttendanceEditInputs,
    "hourlyPaidHolidayTimes"
  >;
  hourlyPaidHolidayTimeRemove: UseFieldArrayRemove;
  hourlyPaidHolidayTimeUpdate: UseFieldArrayUpdate<
    AttendanceEditInputs,
    "hourlyPaidHolidayTimes"
  >;
  hourlyPaidHolidayTimeReplace: UseFieldArrayReplace<
    AttendanceEditInputs,
    "hourlyPaidHolidayTimes"
  >;
};

export type AttendanceEditContextProps = AttendanceEditDataContextProps &
  AttendanceEditUiContextProps &
  AttendanceEditFormContextProps & {
    data?: AttendanceEditDataContextProps;
    ui?: AttendanceEditUiContextProps;
    form?: AttendanceEditFormContextProps;
    actions?: Pick<AttendanceEditUiContextProps, "onSubmit">;
  };

const defaultDataContextValue: AttendanceEditDataContextProps = {
  workDate: undefined,
  attendance: undefined,
  staff: undefined,
};

const defaultUiContextValue: AttendanceEditUiContextProps = {
  onSubmit: async () => {},
  isDirty: false,
  isValid: false,
  isSubmitting: false,
  submitErrorMessage: null,
  errorMessages: [],
  changeRequests: [],
  readOnly: false,
  isOnBreak: false,
  hourlyPaidHolidayEnabled: false,
};

const defaultFormContextValue: AttendanceEditFormContextProps = {
  restFields: [],
  hourlyPaidHolidayTimeFields: [],
  hourlyPaidHolidayTimeAppend: () => {},
  hourlyPaidHolidayTimeRemove: () => {},
  hourlyPaidHolidayTimeUpdate: () => {},
  hourlyPaidHolidayTimeReplace: () => {},
};

export const AttendanceEditContext = createContext<AttendanceEditContextProps>({
  ...defaultDataContextValue,
  ...defaultUiContextValue,
  ...defaultFormContextValue,
});

export const AttendanceEditDataContext =
  createContext<AttendanceEditDataContextProps>(defaultDataContextValue);

export const AttendanceEditUiContext =
  createContext<AttendanceEditUiContextProps>(defaultUiContextValue);

export const AttendanceEditFormContext =
  createContext<AttendanceEditFormContextProps>(defaultFormContextValue);

export function useAttendanceEditData() {
  return useContext(AttendanceEditDataContext);
}

export function useAttendanceEditUi() {
  return useContext(AttendanceEditUiContext);
}

export function useAttendanceEditForm() {
  return useContext(AttendanceEditFormContext);
}

export const defaultAttendanceEditContextValue: AttendanceEditContextProps = {
  ...defaultDataContextValue,
  ...defaultUiContextValue,
  ...defaultFormContextValue,
  data: defaultDataContextValue,
  ui: defaultUiContextValue,
  form: defaultFormContextValue,
  actions: {
    onSubmit: defaultUiContextValue.onSubmit,
  },
};

export default function AttendanceEditProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: AttendanceEditContextProps;
}) {
  const dataValue: AttendanceEditDataContextProps = {
    workDate: value.workDate,
    attendance: value.attendance,
    staff: value.staff,
  };
  const uiValue: AttendanceEditUiContextProps = {
    onSubmit: value.onSubmit,
    isDirty: value.isDirty,
    isValid: value.isValid,
    isSubmitting: value.isSubmitting,
    submitErrorMessage: value.submitErrorMessage,
    errorMessages: value.errorMessages,
    changeRequests: value.changeRequests,
    readOnly: value.readOnly,
    isOnBreak: value.isOnBreak,
    hourlyPaidHolidayEnabled: value.hourlyPaidHolidayEnabled,
  };
  const formValue: AttendanceEditFormContextProps = {
    restFields: value.restFields,
    restAppend: value.restAppend,
    restRemove: value.restRemove,
    restUpdate: value.restUpdate,
    restReplace: value.restReplace,
    register: value.register,
    control: value.control,
    setValue: value.setValue,
    getValues: value.getValues,
    watch: value.watch,
    handleSubmit: value.handleSubmit,
    hourlyPaidHolidayTimeFields: value.hourlyPaidHolidayTimeFields,
    hourlyPaidHolidayTimeAppend: value.hourlyPaidHolidayTimeAppend,
    hourlyPaidHolidayTimeRemove: value.hourlyPaidHolidayTimeRemove,
    hourlyPaidHolidayTimeUpdate: value.hourlyPaidHolidayTimeUpdate,
    hourlyPaidHolidayTimeReplace: value.hourlyPaidHolidayTimeReplace,
  };
  const groupedValue = {
    data: dataValue,
    ui: uiValue,
    form: formValue,
    actions: {
      onSubmit: value.onSubmit,
    },
  };

  return (
    <AttendanceEditContext.Provider value={{ ...value, ...groupedValue }}>
      <AttendanceEditDataContext.Provider value={dataValue}>
        <AttendanceEditUiContext.Provider value={uiValue}>
          <AttendanceEditFormContext.Provider value={formValue}>
            {children}
          </AttendanceEditFormContext.Provider>
        </AttendanceEditUiContext.Provider>
      </AttendanceEditDataContext.Provider>
    </AttendanceEditContext.Provider>
  );
}
