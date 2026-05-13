import { useAppDispatchV2 } from "@app/hooks";
import { buildHolidayDateRange, HolidayDateRangeError, MAX_HOLIDAY_RANGE_DAYS } from "@features/admin/holidayCalendar/lib/buildHolidayDateRange";
import { AddCalendarDialogShell } from "@features/admin/holidayCalendar/ui/components/AddCalendarDialogShell";
import { TextField } from "@mui/material";
import { CreateHolidayCalendarInput, HolidayCalendar } from "@shared/api/graphql/types";
import { HolidayCalendarMessage } from "@shared/lib/message/HolidayCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";

type Inputs = {
  startDate: string;
  endDate: string;
  name: string;
};

const defaultValues: Inputs = {
  startDate: "",
  endDate: "",
  name: "",
};

type CreateHolidayCalendarHandler = (input: CreateHolidayCalendarInput) => Promise<void | HolidayCalendar>;
type BulkCreateHolidayCalendarHandler = (inputs: CreateHolidayCalendarInput[]) => Promise<void | HolidayCalendar[]>;

export function AddHolidayCalendar({
  createHolidayCalendar,
  bulkCreateHolidayCalendar,
}: {
  createHolidayCalendar: CreateHolidayCalendarHandler;
  bulkCreateHolidayCalendar: BulkCreateHolidayCalendarHandler;
}) {
  const dispatch = useAppDispatchV2();

  const onSubmit = async ({ startDate, endDate, name }: Inputs) => {
    const holidayCalendarMessage = HolidayCalendarMessage();
    const isRangeSubmission = Boolean(endDate);

    try {
      if (isRangeSubmission) {
        const range = buildHolidayDateRange(startDate, endDate);
        const inputs = range.map((holidayDate) => ({ holidayDate, name }));
        await bulkCreateHolidayCalendar(inputs);
        dispatch(
          pushNotification({
            tone: "success",
            message: `${holidayCalendarMessage.getCategoryName()}を${range.length}件作成しました`,
          }),
        );
      } else {
        const [holidayDate] = buildHolidayDateRange(startDate);
        await createHolidayCalendar({ holidayDate, name });
        dispatch(
          pushNotification({
            tone: "success",
            message: holidayCalendarMessage.create(MessageStatus.SUCCESS),
          }),
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HolidayDateRangeError) {
        dispatch(
          pushNotification({
            tone: "error",
            message: error.message,
          }),
        );

        return false;
      }

      dispatch(
        pushNotification({
          tone: "error",
          message: holidayCalendarMessage.create(MessageStatus.ERROR),
        }),
      );

      return false;
    }
  };

  return (
    <AddCalendarDialogShell<Inputs>
      addButtonLabel="休日を追加"
      addButtonProps={{ variant: "outline" }}
      dialogTitle="休日を追加"
      dialogDescription={
        <>
          休日としたい日付と休日名を入力してください。
          <br />
          <br />
          {`開始日のみ入力した場合は単日登録、終了日を指定すると開始日から終了日までをまとめて登録します（最大${MAX_HOLIDAY_RANGE_DAYS}日）。`}
        </>
      }
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      renderFields={({ register }) => (
        <TextField
          label="休日名"
          required
          {...register("name", {
            required: true,
          })}
        />
      )}
    />
  );
}
