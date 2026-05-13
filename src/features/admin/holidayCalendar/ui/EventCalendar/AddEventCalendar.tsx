import { useAppDispatchV2 } from "@app/hooks";
import { buildHolidayDateRange, HolidayDateRangeError, MAX_HOLIDAY_RANGE_DAYS } from "@features/admin/holidayCalendar/lib/buildHolidayDateRange";
import { AddCalendarDialogShell } from "@features/admin/holidayCalendar/ui/components/AddCalendarDialogShell";
import { TextField } from "@mui/material";
import { CreateEventCalendarInput, EventCalendar } from "@shared/api/graphql/types";
import { EventCalendarMessage } from "@shared/lib/message/EventCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";

type Inputs = {
  startDate: string;
  endDate: string;
  name: string;
  description: string;
};

const defaultValues: Inputs = {
  startDate: "",
  endDate: "",
  name: "",
  description: "",
};

type CreateEventCalendarHandler = (input: CreateEventCalendarInput) => Promise<void | EventCalendar>;
type BulkCreateEventCalendarHandler = (inputs: CreateEventCalendarInput[]) => Promise<void | EventCalendar[]>;

export function AddEventCalendar({
  createEventCalendar,
  bulkCreateEventCalendar,
}: {
  createEventCalendar: CreateEventCalendarHandler;
  bulkCreateEventCalendar: BulkCreateEventCalendarHandler;
}) {
  const dispatch = useAppDispatchV2();

  const onSubmit = async ({ startDate, endDate, name, description }: Inputs) => {
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
        dispatch(
          pushNotification({
            tone: "success",
            message: `${eventCalendarMessage.getCategoryName()}を${range.length}件作成しました`,
          }),
        );
      } else {
        const [eventDate] = buildHolidayDateRange(startDate);
        await createEventCalendar({
          eventDate,
          name,
          description: description || undefined,
        });
        dispatch(
          pushNotification({
            tone: "success",
            message: eventCalendarMessage.create(MessageStatus.SUCCESS),
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
          message: eventCalendarMessage.create(MessageStatus.ERROR),
        }),
      );

      return false;
    }
  };

  return (
    <AddCalendarDialogShell<Inputs>
      addButtonLabel="イベントを追加"
      addButtonProps={{ variant: "outline" }}
      dialogTitle="イベントを追加"
      dialogDescription={
        <>
          イベント日と名前、詳細（任意）を入力してください。
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
            label="イベント名"
            required
            {...register("name", {
              required: true,
            })}
          />
          <TextField label="詳細 (任意)" multiline rows={3} {...register("description")} />
        </>
      )}
    />
  );
}
