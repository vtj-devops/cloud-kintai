import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { buildHolidayDateRange, HolidayDateRangeError, MAX_HOLIDAY_RANGE_DAYS, } from "@features/admin/holidayCalendar/lib/buildHolidayDateRange";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { Stack, TextField, } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { CreateHolidayCalendarInput, HolidayCalendar, } from "@shared/api/graphql/types";
import { HolidayCalendarMessage } from "@shared/lib/message/HolidayCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import AppDialog from "@shared/ui/feedback/AppDialog";
import { useDialogCloseGuard } from "@shared/ui/feedback/useDialogCloseGuard";
import dayjs from "dayjs";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
/**
 * AddHolidayCalendar コンポーネントのフォーム入力型
 *
 * startDate: 追加対象の休日の開始日（表示/送信に使う文字列）
 * endDate: 追加対象の休日の終了日（任意）
 * name: 休日の名称
 */
type Inputs = {
    startDate: string;
    endDate: string;
    name: string;
};
/**
 * フォームの初期値
 */
const defaultValues: Inputs = {
    startDate: "",
    endDate: "",
    name: "",
};
/**
 * 会社休日を追加するダイアログを提供するコンポーネント。
 *
 * @param createHolidayCalendar - HolidayCalendar を作成する非同期関数。
 *   引数に CreateHolidayCalendarInput を取り、作成した HolidayCalendar または void を返す Promise を返す。
 */
type CreateHolidayCalendarHandler = (input: CreateHolidayCalendarInput) => Promise<void | HolidayCalendar>;
type BulkCreateHolidayCalendarHandler = (inputs: CreateHolidayCalendarInput[]) => Promise<void | HolidayCalendar[]>;
export function AddHolidayCalendar({ createHolidayCalendar, bulkCreateHolidayCalendar, }: {
    createHolidayCalendar: CreateHolidayCalendarHandler;
    bulkCreateHolidayCalendar: BulkCreateHolidayCalendarHandler;
}) {
    const dispatch = useAppDispatchV2();
    const [open, setOpen] = useState(false);
    const { register, control, handleSubmit, reset, watch, formState: { isValid, isDirty, isSubmitting }, } = useForm<Inputs>({
        mode: "onChange",
        defaultValues,
    });
    const { dialog, requestClose, closeWithoutGuard } = useDialogCloseGuard({
        isDirty,
        isBusy: isSubmitting,
        onClose: () => {
            reset(defaultValues);
            setOpen(false);
        },
    });
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const startDateValue = watch("startDate");
    /**
     * フォーム送信ハンドラ。
     * createHolidayCalendar を呼び出し、成功/失敗に応じてスナックバーを表示する。
     *
     * @param data - フォーム入力（Inputs）
     */
    const onSubmit = async ({ startDate, endDate, name }: Inputs) => {
        const holidayCalendarMessage = HolidayCalendarMessage();
        const isRangeSubmission = Boolean(endDate);
        try {
            if (isRangeSubmission) {
                const range = buildHolidayDateRange(startDate, endDate);
                const inputs = range.map((holidayDate) => ({
                    holidayDate,
                    name,
                }));
                await bulkCreateHolidayCalendar(inputs);
                const successMessage = `${holidayCalendarMessage.getCategoryName()}を${range.length}件作成しました`;
                dispatch(pushNotification({
                    tone: "success",
                    message: successMessage
                }));
            }
            else {
                const [holidayDate] = buildHolidayDateRange(startDate);
                await createHolidayCalendar({ holidayDate, name });
                dispatch(pushNotification({
                    tone: "success",
                    message: holidayCalendarMessage.create(MessageStatus.SUCCESS)
                }));
            }
            reset(defaultValues);
            closeWithoutGuard();
        }
        catch (error) {
            if (error instanceof HolidayDateRangeError) {
                dispatch(pushNotification({
                    tone: "error",
                    message: error.message
                }));
                return;
            }
            dispatch(pushNotification({
                tone: "error",
                message: holidayCalendarMessage.create(MessageStatus.ERROR)
            }));
        }
    };
    return (<>
      <AppButton variant="outline" startIcon={<AddCircleOutlineOutlinedIcon />} onClick={() => setOpen(true)}>
        休日を追加
      </AppButton>
      {dialog}
      <AppDialog open={open} onClose={requestClose} title="休日を追加" description={<>休日としたい日付と休日名を入力してください。<br/><br/>{`開始日のみ入力した場合は単日登録、終了日を指定すると開始日から終了日までをまとめて登録します（最大${MAX_HOLIDAY_RANGE_DAYS}日）。`}</>} actions={<>
          <AppButton variant="outline" tone="neutral" onClick={requestClose}>キャンセル</AppButton>
          <AppButton disabled={!isValid || !isDirty || isSubmitting} onClick={handleSubmit(onSubmit)}>登録</AppButton>
        </>}>
      <Stack spacing={2}>
            <Controller name="startDate" control={control} rules={{ required: "開始日は必須項目です。" }} render={({ field, fieldState }) => {
            const { ref, value, onChange, name, onBlur, ...rest } = field;
            return (<DatePicker {...rest} label="開始日" format={AttendanceDate.DisplayFormat} value={value ? dayjs(value) : null} onChange={(date) => onChange(date ? date.format(AttendanceDate.DataFormat) : "")} slotProps={{
                    textField: {
                        required: true,
                        inputRef: ref,
                        name,
                        onBlur,
                        error: Boolean(fieldState.error),
                        helperText: fieldState.error?.message,
                    },
                }}/>);
        }}/>
            <Controller name="endDate" control={control} rules={{
            validate: (value) => {
                if (!value) {
                    return true;
                }
                if (!startDateValue) {
                    return "開始日を先に入力してください。";
                }
                const start = dayjs(startDateValue, AttendanceDate.DataFormat, true);
                const end = dayjs(value, AttendanceDate.DataFormat, true);
                if (!start.isValid()) {
                    return "開始日はYYYY-MM-DD形式で入力してください。";
                }
                if (!end.isValid()) {
                    return "終了日はYYYY-MM-DD形式で入力してください。";
                }
                if (end.isBefore(start)) {
                    return "終了日は開始日以降の日付を指定してください。";
                }
                return true;
            },
        }} render={({ field, fieldState }) => {
            const { ref, value, onChange, name, onBlur, ...rest } = field;
            return (<DatePicker {...rest} label="終了日 (任意)" format={AttendanceDate.DisplayFormat} value={value ? dayjs(value) : null} onChange={(date) => onChange(date ? date.format(AttendanceDate.DataFormat) : "")} slotProps={{
                    textField: {
                        inputRef: ref,
                        name,
                        onBlur,
                        error: Boolean(fieldState.error),
                        helperText: fieldState.error?.message,
                    },
                }}/>);
        }}/>
            <TextField label="休日名" required {...register("name", {
        required: true,
    })}/>
      </Stack>
    </AppDialog>
    </>);
}
