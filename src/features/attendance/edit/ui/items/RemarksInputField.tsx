import {
  AttendanceControl,
  AttendanceGetValues,
  AttendanceSetValue,
} from "@features/attendance/edit/model/types";
import { getRemarksValue, updateRemarks } from "@features/attendance/edit/ui/items/remarksItemUtils";
import { Controller } from "react-hook-form";

const INPUT_PLACEHOLDER = "備考を入力してください（タグは上に表示されます）";

type RemarksInputFieldProps = {
  control: AttendanceControl | undefined;
  getValues: AttendanceGetValues;
  setValue: AttendanceSetValue | undefined;
  readOnly: boolean;
};

export function RemarksInputField({
  control,
  getValues,
  setValue,
  readOnly,
}: RemarksInputFieldProps) {
  if (control) {
    return (
      <Controller
        name="remarks"
        control={control}
        render={({ field }) => (
          <input
            {...field}
            value={field.value ?? ""}
            data-testid="remarks-input"
            className="w-full border-none bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-500"
            placeholder={INPUT_PLACEHOLDER}
            disabled={readOnly}
          />
        )}
      />
    );
  }

  return (
    <input
      data-testid="remarks-input"
      className="w-full border-none bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-500"
      value={getRemarksValue(getValues)}
      onChange={(e) => updateRemarks(setValue, readOnly, e.target.value)}
      placeholder={INPUT_PLACEHOLDER}
      disabled={readOnly}
    />
  );
}
