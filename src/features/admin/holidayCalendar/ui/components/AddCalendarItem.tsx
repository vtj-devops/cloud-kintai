import { useAppDispatchV2 } from "@app/hooks";
import {
  buildHolidayDateRange,
  HolidayDateRangeError,
  MAX_HOLIDAY_RANGE_DAYS,
} from "@features/admin/holidayCalendar/lib/buildHolidayDateRange";
import { TextField } from "@mui/material";
import type { ReactNode } from "react";
import type { UseFormRegister } from "react-hook-form";
import type { MessageGenerator } from "@shared/lib/message/Message";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AddCalendarDialogShell } from "./AddCalendarDialogShell";

type BaseInputs = {
  startDate: string;
  endDate: string;
  name: string;
  description: string;
};

const defaultValues: BaseInputs = {
  startDate: "",
  endDate: "",
  name: "",
  description: "",
};

type AddCalendarItemProps<TInput> = {
  addButtonLabel: string;
  addButtonProps?: {
    variant?: "solid" | "outline" | "ghost";
    tone?: "primary" | "secondary" | "danger" | "neutral";
    size?: "sm" | "md" | "lg";
  };
  dialogTitle: string;
  dialogDescription: ReactNode;
  nameLabel: string;
  messageFactory: MessageGenerator;
  buildSingleInput: (date: string, name: string, description: string) => TInput;
  buildBulkInputs: (dates: string[], name: string, description: string) => TInput[];
  createItem: (input: TInput) => Promise<unknown>;
  bulkCreateItems: (inputs: TInput[]) => Promise<unknown>;
  renderExtraFields?: (register: UseFormRegister<BaseInputs>) => ReactNode;
};

export function AddCalendarItem<TInput>({
  addButtonLabel,
  addButtonProps,
  dialogTitle,
  dialogDescription,
  nameLabel,
  messageFactory,
  buildSingleInput,
  buildBulkInputs,
  createItem,
  bulkCreateItems,
  renderExtraFields,
}: AddCalendarItemProps<TInput>) {
  const dispatch = useAppDispatchV2();

  const onSubmit = async ({ startDate, endDate, name, description }: BaseInputs) => {
    const isRangeSubmission = Boolean(endDate);

    try {
      if (isRangeSubmission) {
        const range = buildHolidayDateRange(startDate, endDate);
        await bulkCreateItems(buildBulkInputs(range, name, description));
        dispatch(
          pushNotification({
            tone: "success",
            message: `${messageFactory.getCategoryName()}を${range.length}件作成しました`,
          }),
        );
      } else {
        const [date] = buildHolidayDateRange(startDate);
        await createItem(buildSingleInput(date, name, description));
        dispatch(
          pushNotification({
            tone: "success",
            message: messageFactory.create(MessageStatus.SUCCESS),
          }),
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HolidayDateRangeError) {
        dispatch(pushNotification({ tone: "error", message: error.message }));
        return false;
      }

      dispatch(
        pushNotification({
          tone: "error",
          message: messageFactory.create(MessageStatus.ERROR),
        }),
      );

      return false;
    }
  };

  return (
    <AddCalendarDialogShell<BaseInputs>
      addButtonLabel={addButtonLabel}
      addButtonProps={addButtonProps}
      dialogTitle={dialogTitle}
      dialogDescription={
        <>
          {dialogDescription}
          <br />
          <br />
          {`開始日のみ入力した場合は単日登録、終了日を指定すると開始日から終了日までをまとめて登録します（最大${MAX_HOLIDAY_RANGE_DAYS}日）。`}
        </>
      }
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      renderFields={({ register }) => (
        <>
          <TextField
            label={nameLabel}
            required
            {...register("name", { required: true })}
          />
          {renderExtraFields?.(register)}
        </>
      )}
    />
  );
}
