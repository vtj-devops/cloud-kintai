import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { Label } from "@features/attendance/edit/ui/mobile/Label";
import dayjs from "dayjs";
import { useContext, useState } from "react";
import { Controller } from "react-hook-form";

type SubstituteHolidayDateInputProps = {
  hideLabel?: boolean;
};

export function SubstituteHolidayDateInput({
  hideLabel = false,
}: SubstituteHolidayDateInputProps) {
  const { control, setValue, restReplace } = useContext(AttendanceEditContext);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<dayjs.Dayjs | null>(null);

  if (!control || !setValue || !restReplace) {
    return null;
  }

  return (
    <>
      {!hideLabel ? <Label variant="body1">振替休暇</Label> : null}
      <div className="mb-2 text-sm leading-6 text-slate-500">
        勤務した日を指定して振替休日を設定します。設定すると該当日は休暇扱いとなり、一部の入力がクリアされます。
      </div>
      <Controller
        name="substituteHolidayDate"
        control={control}
        render={({ field, fieldState }) => {
          const { value, onChange, ...restField } = field;

          return (
            <>
              <div>
                <input
                  {...restField}
                  type="date"
                  value={value ? dayjs(value).format("YYYY-MM-DD") : ""}
                  aria-label="勤務した日"
                  className="w-full rounded-[10px] border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  onChange={(e) => {
                    if (!e.target.value) {
                      onChange(null);
                      return;
                    }
                    const date = dayjs(e.target.value);
                    if (date.isValid()) {
                      setPendingDate(date);
                      setConfirmOpen(true);
                    }
                  }}
                />
                {fieldState.error?.message ? (
                  <p className="mt-2 text-sm text-rose-600">{fieldState.error.message}</p>
                ) : null}
              </div>

              {confirmOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4">
                  <div className="w-full max-w-sm rounded-[14px] border border-emerald-200 bg-white p-5 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)]">
                    <div className="text-base font-semibold text-slate-950">
                      振替休日を設定します
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      以下の方法を選択してください。
                    </p>
                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-[10px] border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        onClick={() => {
                          setConfirmOpen(false);
                          setPendingDate(null);
                        }}
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        className="rounded-[10px] border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => {
                      if (pendingDate) {
                        onChange(pendingDate.format(AttendanceDate.DataFormat));
                      }

                      setConfirmOpen(false);
                      setPendingDate(null);
                    }}
                  >
                    クリアせず設定
                      </button>
                      <button
                        type="button"
                        className="rounded-[10px] border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                    onClick={() => {
                      if (pendingDate) {
                        onChange(pendingDate.format(AttendanceDate.DataFormat));

                        setValue("paidHolidayFlag", false);
                        setValue("goDirectlyFlag", false);
                        setValue("returnDirectlyFlag", false);
                        setValue("startTime", null);
                        setValue("endTime", null);
                        restReplace([]);
                      }

                      setConfirmOpen(false);
                      setPendingDate(null);
                    }}
                  >
                    クリアして設定
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          );
        }}
      />
    </>
  );
}
