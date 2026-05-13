import { useAppDispatchV2 } from "@app/hooks";
import {
  buildHolidayDateRange,
  HolidayDateRangeError,
  MAX_HOLIDAY_RANGE_DAYS,
} from "@features/admin/holidayCalendar/lib/buildHolidayDateRange";
import { AddCalendarDialogShell } from "@features/admin/holidayCalendar/ui/components/AddCalendarDialogShell";
import { TextField } from "@mui/material";
import {
  CompanyHolidayCalendar,
  CreateCompanyHolidayCalendarInput,
} from "@shared/api/graphql/types";
import { CompanyHolidayCalendarMessage } from "@shared/lib/message/CompanyHolidayCalendarMessage";
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

export default function AddCompanyHolidayCalendar({
  createCompanyHolidayCalendar,
  bulkCreateCompanyHolidayCalendar,
}: {
  createCompanyHolidayCalendar: (
    input: CreateCompanyHolidayCalendarInput,
  ) => Promise<CompanyHolidayCalendar>;
  bulkCreateCompanyHolidayCalendar: (
    inputs: CreateCompanyHolidayCalendarInput[],
  ) => Promise<CompanyHolidayCalendar[]>;
}) {
  const dispatch = useAppDispatchV2();

  const onSubmit = async ({ startDate, endDate, name }: Inputs) => {
    const companyHolidayCalendarMessage = CompanyHolidayCalendarMessage();
    const isRangeSubmission = Boolean(endDate);

    try {
      if (isRangeSubmission) {
        const range = buildHolidayDateRange(startDate, endDate);
        const inputs = range.map((holidayDate) => ({ holidayDate, name }));
        await bulkCreateCompanyHolidayCalendar(inputs);
        dispatch(
          pushNotification({
            tone: "success",
            message: `${companyHolidayCalendarMessage.getCategoryName()}を${range.length}件作成しました`,
          }),
        );
      } else {
        const [holidayDate] = buildHolidayDateRange(startDate);
        await createCompanyHolidayCalendar({ holidayDate, name });
        dispatch(
          pushNotification({
            tone: "success",
            message: companyHolidayCalendarMessage.create(MessageStatus.SUCCESS),
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
          message: companyHolidayCalendarMessage.create(MessageStatus.ERROR),
        }),
      );

      return false;
    }
  };

  return (
    <AddCalendarDialogShell<Inputs>
      addButtonLabel="休日を追加"
      addButtonProps={{ variant: "outline", tone: "primary", size: "sm" }}
      dialogTitle="会社休日を追加"
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
