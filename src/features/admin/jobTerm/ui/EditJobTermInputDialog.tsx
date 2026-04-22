import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { defaultValues, Inputs } from "@features/admin/jobTerm/lib/common";
import { CloseDate, UpdateCloseDateInput } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import AppDialog from "@shared/ui/feedback/AppDialog";
import { useDialogCloseGuard } from "@shared/ui/feedback/useDialogCloseGuard";
import DateField from "@shared/ui/form/DateField";
import dayjs from "dayjs";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import * as MESSAGE_CODE from "@/errors";

export default function EditJobTermInputDialog({ targetData, open, onClose, candidateCloseDates, updateCloseDate, }: {
    targetData: CloseDate | null;
    open: boolean;
    onClose: () => void;
    candidateCloseDates: dayjs.Dayjs[];
    updateCloseDate: (input: UpdateCloseDateInput) => Promise<void>;
}) {
    const dispatch = useAppDispatchV2();
    const { control, setValue, reset, handleSubmit, formState: { isValid, isDirty, isSubmitting }, } = useForm<Inputs>({
        mode: "onChange",
        defaultValues,
    });
    const { dialog, requestClose, closeWithoutGuard } = useDialogCloseGuard({
        isDirty,
        isBusy: isSubmitting,
        onClose,
    });
    const onSubmit = (data: Inputs) => {
        if (!targetData?.id ||
            !data.closeDate ||
            !data.startDate ||
            !data.endDate) {
            return;
        }
        updateCloseDate({
            id: targetData.id,
            closeDate: data.closeDate.toISOString(),
            startDate: data.startDate.toISOString(),
            endDate: data.endDate.toISOString(),
        })
            .then(() => {
            dispatch(pushNotification({
                tone: "success",
                message: MESSAGE_CODE.S09003
            }));
            closeWithoutGuard();
        })
            .catch(() => dispatch(pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E09003
        })));
    };
    useEffect(() => {
        if (!targetData) {
            reset(defaultValues);
            return;
        }
        setValue("closeDate", dayjs(targetData.closeDate));
        setValue("startDate", dayjs(targetData.startDate));
        setValue("endDate", dayjs(targetData.endDate));
    }, [targetData]);
    return (<>
      {dialog}
      <AppDialog open={open} onClose={requestClose} title="集計対象月を変更" description="変更する集計対象月の情報を入力してください。" actions={<>
          <AppButton variant="outline" tone="neutral" onClick={requestClose}>キャンセル</AppButton>
          <AppButton variant="solid" disabled={!isValid || !isDirty || isSubmitting} onClick={handleSubmit(onSubmit)}>変更</AppButton>
        </>}>
      <div className="flex flex-col gap-4">
        <Controller name="closeDate" control={control} rules={{ required: true }} render={({ field: { value, onChange } }) => (<label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">集計対象月</span>
              <select value={value ? value.format("YYYY-MM") : ""} onChange={(event) => {
                const selected = candidateCloseDates.find((item) => item.format("YYYY-MM") === event.target.value);
                onChange(selected ?? null);
            }} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
                <option value="">選択してください</option>
                {candidateCloseDates.map((option) => (<option key={option.format("YYYY-MM")} value={option.format("YYYY-MM")}>
                    {option.format("YYYY/MM")}
                  </option>))}
              </select>
            </label>)}/>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <Controller name="startDate" control={control} rules={{ required: true }} render={({ field }) => (<DateField label="開始日" format={AttendanceDate.DisplayFormat} value={field.value} onChange={field.onChange} errorText={!field.value ? "必須項目です" : undefined}/>)}/>
          <div className="pb-2 text-center text-slate-500">〜</div>
          <Controller name="endDate" control={control} rules={{ required: true }} render={({ field }) => (<DateField label="終了日" format={AttendanceDate.DisplayFormat} value={field.value} onChange={field.onChange} errorText={!field.value ? "必須項目です" : undefined}/>)}/>
        </div>
      </div>
    </AppDialog>
    </>);
}
