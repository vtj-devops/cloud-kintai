import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { buildHolidayDateRange, HolidayDateRangeError, MAX_HOLIDAY_RANGE_DAYS, } from "@features/admin/holidayCalendar/lib/buildHolidayDateRange";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { Stack, TextField, } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { CreateEventCalendarInput, EventCalendar, } from "@shared/api/graphql/types";
import { EventCalendarMessage } from "@shared/lib/message/EventCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import AppDialog from "@shared/ui/feedback/AppDialog";
import { useDialogCloseGuard } from "@shared/ui/feedback/useDialogCloseGuard";
import dayjs from "dayjs";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
/**
 * AddEventCalendar コンポーネントのフォーム入力型
 *
 * startDate: 追加対象のイベントの開始日（表示/送信に使う文字列）
 * endDate: 追加対象のイベントの終了日（任意）
 * name: イベントの名称
 * description: イベントの詳細説明（任意）
 */
type Inputs = {
    startDate: string;
    endDate: string;
    name: string;
    description: string;
};
/**
 * フォームの初期値
 */
const defaultValues: Inputs = {
    startDate: "",
    endDate: "",
    name: "",
    description: "",
};
/**
 * イベントカレンダーを追加するダイアログを提供するコンポーネント。
 *
 * @param createEventCalendar - EventCalendar を作成する非同期関数。
 *   引数に CreateEventCalendarInput を取り、作成した EventCalendar または void を返す Promise を返す。
 */
type CreateEventCalendarHandler = (input: CreateEventCalendarInput) => Promise<void | EventCalendar>;
type BulkCreateEventCalendarHandler = (inputs: CreateEventCalendarInput[]) => Promise<void | EventCalendar[]>;
export function AddEventCalendar({ createEventCalendar, bulkCreateEventCalendar, }: {
    createEventCalendar: CreateEventCalendarHandler;
    bulkCreateEventCalendar: BulkCreateEventCalendarHandler;
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
     * createEventCalendar を呼び出し、成功/失敗に応じてスナックバーを表示する。
     *
     * @param data - フォーム入力（Inputs）
     */
    const onSubmit = async ({ startDate, endDate, name, description, }: Inputs) => {
        const eventCalendarMessage = EventCalendarMessage();
        const isRangeSubmission = Boolean(endDate);
        try {
            if (isRangeSubmission) {
                const range = buildHolidayDateRange(startDate, endDate);
                const inputs = range.map((eventDate) => ({
                    eventDate,
                    name,
                    description: description || undefined,
                }));
                await bulkCreateEventCalendar(inputs);
                const successMessage = `${eventCalendarMessage.getCategoryName()}を${range.length}件作成しました`;
                dispatch(pushNotification({
                    tone: "success",
                    message: successMessage
                }));
            }
            else {
                const [eventDate] = buildHolidayDateRange(startDate);
                await createEventCalendar({
                    eventDate,
                    name,
                    description: description || undefined,
                });
                dispatch(pushNotification({
                    tone: "success",
                    message: eventCalendarMessage.create(MessageStatus.SUCCESS)
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
                message: eventCalendarMessage.create(MessageStatus.ERROR)
            }));
        }
    };
    return (<>
      <AppButton variant="outline" startIcon={<AddCircleOutlineOutlinedIcon />} onClick={() => setOpen(true)}>
        イベントを追加
      </AppButton>
      {dialog}
      <AppDialog open={open} onClose={requestClose} title="イベントを追加" description={<>イベント日と名前、詳細（任意）を入力してください。<br/><br/>{`開始日のみ入力した場合は単日登録、終了日を指定すると開始日から終了日までをまとめて登録します（最大${MAX_HOLIDAY_RANGE_DAYS}日）。`}</>} actions={<>
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
            <TextField label="イベント名" required {...register("name", {
        required: true,
    })}/>
            <TextField label="詳細 (任意)" multiline rows={3} {...register("description")}/>
        </Stack>
      </AppDialog>
    </>);
}
