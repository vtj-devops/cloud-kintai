import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { useCalendars } from "@entities/calendar/model/useCalendars";
import { SettingsButton } from "@features/admin/layout/ui/SettingsPrimitives";
import { CloseDate, CreateCloseDateInput } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import DateField from "@shared/ui/form/DateField";
import { SubsectionTitle } from "@shared/ui/typography";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type BulkFormValues = {
  startMonth: dayjs.Dayjs | null;
  closingDay: number | null;
  monthCount: number | null;
  adjustDirection: "previous" | "next";
  considerWeekend: boolean;
  considerHolidayCalendar: boolean;
  considerCompanyHolidayCalendar: boolean;
};
type PreviewItem = {
  closeMonth: dayjs.Dayjs;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  baseEndDate: dayjs.Dayjs;
  adjustmentReason?: string;
  isDuplicate: boolean;
};
type Props = {
  existingCloseDates: CloseDate[];
  createCloseDate: (input: CreateCloseDateInput) => Promise<void>;
};
const defaultValues: BulkFormValues = {
  startMonth: dayjs().startOf("month"),
  closingDay: 31,
  monthCount: 6,
  adjustDirection: "previous",
  considerWeekend: true,
  considerHolidayCalendar: true,
  considerCompanyHolidayCalendar: true,
};
export default function JobTermBulkRegister({
  existingCloseDates,
  createCloseDate,
}: Props) {
  const dispatch = useAppDispatchV2();
  const [submitting, setSubmitting] = useState(false);
  const {
    holidayCalendars,
    companyHolidayCalendars,
    isLoading: loadingCalendars,
  } = useCalendars();
  const {
    control,
    handleSubmit,
    watch,
    formState: { isValid },
    setValue,
  } = useForm<BulkFormValues>({
    mode: "onChange",
    defaultValues,
  });
  const startMonth = watch("startMonth");
  const closingDay = watch("closingDay");
  const monthCount = watch("monthCount");
  const adjustDirection = watch("adjustDirection");
  const considerWeekend = watch("considerWeekend");
  const considerHolidayCalendar = watch("considerHolidayCalendar");
  const considerCompanyHolidayCalendar = watch(
    "considerCompanyHolidayCalendar",
  );
  const holidaySet = useMemo(() => {
    const dates = holidayCalendars.map((item) =>
      dayjs(item.holidayDate).format(AttendanceDate.DataFormat),
    );
    return new Set(dates);
  }, [holidayCalendars]);
  const companyHolidaySet = useMemo(() => {
    const dates = companyHolidayCalendars.map((item) =>
      dayjs(item.holidayDate).format(AttendanceDate.DataFormat),
    );
    return new Set(dates);
  }, [companyHolidayCalendars]);
  const isNonWorkingDay = useCallback(
    (date: dayjs.Dayjs) => {
      const reasons: string[] = [];
      if (considerWeekend) {
        const day = date.day();
        if (day === 0 || day === 6) {
          reasons.push("土日");
        }
      }
      const key = date.format(AttendanceDate.DataFormat);
      if (considerHolidayCalendar && holidaySet.has(key)) {
        reasons.push("休日カレンダー");
      }
      if (considerCompanyHolidayCalendar && companyHolidaySet.has(key)) {
        reasons.push("会社休日カレンダー");
      }
      return reasons;
    },
    [
      considerCompanyHolidayCalendar,
      considerHolidayCalendar,
      considerWeekend,
      companyHolidaySet,
      holidaySet,
    ],
  );
  const adjustCloseDate = useCallback(
    (target: dayjs.Dayjs) => {
      let current = target;
      let lastReasons: string[] = [];
      let steps = 0;
      while (true) {
        const reasons = isNonWorkingDay(current);
        if (reasons.length === 0) break;
        lastReasons = reasons;
        current =
          adjustDirection === "previous"
            ? current.subtract(1, "day")
            : current.add(1, "day");
        steps += 1;
        if (steps > 90) break; // safety guard
      }
      return { adjusted: current, lastReasons };
    },
    [adjustDirection, isNonWorkingDay],
  );
  const previewItems = useMemo<PreviewItem[]>(() => {
    if (!startMonth || !closingDay || !monthCount) return [];
    const startOfMonth = startMonth.startOf("month");
    const existingMonthKeys = new Set(
      existingCloseDates.map((closeDate) =>
        dayjs(closeDate.closeDate).format("YYYY-MM"),
      ),
    );
    const baseItems = Array.from({ length: monthCount }).map((_, index) => {
      const closeMonth = startOfMonth.add(index, "month");
      const endDay = Math.min(closingDay, closeMonth.daysInMonth());
      const baseEndDate = closeMonth.date(endDay);
      const { adjusted: endDate, lastReasons } = adjustCloseDate(baseEndDate);
      const startDate = endDate.subtract(1, "month").add(1, "day");
      const isDuplicate = existingMonthKeys.has(closeMonth.format("YYYY-MM"));
      const adjustmentReason = endDate.isSame(baseEndDate, "day")
        ? undefined
        : `${lastReasons.join("・")}のため${adjustDirection === "previous" ? "前倒し" : "後ろ倒し"}`;
      return {
        closeMonth,
        startDate,
        endDate,
        baseEndDate,
        adjustmentReason,
        isDuplicate,
      };
    });
    // 前月を前倒しした場合、次月の開始日をスライドして隙間を埋める
    return baseItems.reduce<PreviewItem[]>((acc, current, index) => {
      if (index === 0) return [current];
      const prev = acc[index - 1];
      const desiredStart = prev.endDate.add(1, "day");
      if (current.startDate.isAfter(desiredStart, "day")) {
        const slideDays = current.startDate.diff(desiredStart, "day");
        acc.push({
          ...current,
          startDate: desiredStart,
          adjustmentReason: current.adjustmentReason
            ? `${current.adjustmentReason} / 前月前倒し分${slideDays}日開始日スライド`
            : `前月前倒し分${slideDays}日開始日スライド`,
        });
        return acc;
      }
      acc.push(current);
      return acc;
    }, []);
  }, [
    startMonth,
    closingDay,
    monthCount,
    existingCloseDates,
    adjustCloseDate,
    adjustDirection,
  ]);
  const creatableItems = previewItems.filter((item) => !item.isDuplicate);
  const onSubmit = handleSubmit(async () => {
    if (creatableItems.length === 0) {
      dispatch(
        pushNotification({
          tone: "error",
          message: "登録可能な月がありません。すでに登録済みです。",
        }),
      );
      return;
    }
    setSubmitting(true);
    try {
      for (const item of creatableItems) {
        await createCloseDate({
          closeDate: item.closeMonth.toISOString(),
          startDate: item.startDate.toISOString(),
          endDate: item.endDate.toISOString(),
        });
      }
      dispatch(
        pushNotification({
          tone: "success",
          message: `${creatableItems.length}件の集計対象月を登録しました`,
        }),
      );
    } catch {
      dispatch(
        pushNotification({
          tone: "error",
          message: "集計対象月の登録に失敗しました",
        }),
      );
    } finally {
      setSubmitting(false);
    }
  });
  const disableSubmit = submitting || !isValid || creatableItems.length === 0;
  return (
    <div className="flex flex-col gap-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <SubsectionTitle className="text-lg font-semibold text-slate-900">
          締め日指定でまとめて登録
        </SubsectionTitle>
        <p className="text-sm text-slate-600">
          締め日が存在しない月は月末を締め日として扱います。既に登録済みの月はスキップ対象として表示します。
        </p>
        <p className="text-sm text-slate-600">
          土日・休日カレンダー・会社休日カレンダーに該当する場合は、指定方向にずらして締め日を決定します。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Controller
          name="startMonth"
          control={control}
          rules={{ required: true }}
          render={({ field, fieldState }) => (
            <DateField
              label="開始月"
              format="YYYY/MM"
              monthOnly
              value={field.value}
              onChange={(value) =>
                field.onChange(value?.startOf("month") ?? null)
              }
              errorText={fieldState.error ? "必須項目です" : undefined}
            />
          )}
        />

        <Controller
          name="closingDay"
          control={control}
          rules={{ required: true, min: 1, max: 31 }}
          render={({ field, fieldState }) => (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">締め日</span>
              <input
                type="number"
                min={1}
                max={31}
                value={field.value ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === "" ? null : Number(value));
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
              {fieldState.error ? (
                <p className="m-0 text-xs leading-5 text-rose-600">
                  1〜31で入力してください
                </p>
              ) : null}
            </label>
          )}
        />

        <Controller
          name="monthCount"
          control={control}
          rules={{ required: true, min: 1, max: 12 }}
          render={({ field, fieldState }) => (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">
                登録月数
              </span>
              <input
                type="number"
                min={1}
                max={12}
                value={field.value ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === "" ? null : Number(value));
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
              {fieldState.error ? (
                <p className="m-0 text-xs leading-5 text-rose-600">
                  1〜12で入力してください
                </p>
              ) : null}
            </label>
          )}
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-slate-800">非稼働日の調整</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {[
              {
                value: "previous",
                label: "前倒し（直近の稼働日）",
              },
              {
                value: "next",
                label: "後ろ倒し（次の稼働日）",
              },
            ].map((option) => (
              <label
                key={option.value}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
              >
                <input
                  type="radio"
                  name="adjust-direction"
                  value={option.value}
                  checked={adjustDirection === option.value}
                  onChange={(e) =>
                    setValue(
                      "adjustDirection",
                      e.target.value as "previous" | "next",
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      },
                    )
                  }
                />
                {option.label}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={considerWeekend}
                onChange={(e) =>
                  setValue("considerWeekend", e.target.checked, {
                    shouldDirty: true,
                  })
                }
              />
              土日を考慮
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={considerHolidayCalendar}
                onChange={(e) =>
                  setValue("considerHolidayCalendar", e.target.checked, {
                    shouldDirty: true,
                  })
                }
              />
              休日カレンダーを考慮
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={considerCompanyHolidayCalendar}
                onChange={(e) =>
                  setValue("considerCompanyHolidayCalendar", e.target.checked, {
                    shouldDirty: true,
                  })
                }
              />
              会社休日カレンダーを考慮
            </label>
          </div>
        </div>
        {loadingCalendars && (
          <p className="text-sm text-slate-500">
            休日カレンダー情報を読み込み中です…
          </p>
        )}
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-800">
          登録内容プレビュー
        </p>
        {previewItems.length === 0 ? (
          <p className="text-sm text-slate-500">
            条件を入力するとプレビューが表示されます。
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {previewItems.map((item) => (
              <div
                key={item.closeMonth.format("YYYY-MM")}
                className={[
                  "rounded-2xl border px-4 py-3",
                  item.isDuplicate
                    ? "border-sky-200 bg-sky-50"
                    : "border-emerald-200 bg-emerald-50",
                ].join(" ")}
              >
                <div className="flex flex-col gap-1 text-sm text-slate-700 md:flex-row md:items-start md:gap-4">
                  <div className="min-w-[120px] font-semibold text-slate-900">
                    {item.closeMonth.format("YYYY年M月")}
                    {item.isDuplicate ? " (登録済み)" : ""}
                  </div>
                  <div>
                    {item.startDate.format(AttendanceDate.DisplayFormat)} 〜{" "}
                    {item.endDate.format(AttendanceDate.DisplayFormat)}
                    {item.baseEndDate.isSame(item.endDate, "day") ? null : (
                      <span className="ml-1 text-slate-500">
                        (元の締め日{" "}
                        {item.baseEndDate.format(AttendanceDate.DisplayFormat)}{" "}
                        → 調整後)
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500">{item.adjustmentReason}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SettingsButton onClick={onSubmit} disabled={disableSubmit}>
          まとめて登録
        </SettingsButton>
      </div>
    </div>
  );
}
