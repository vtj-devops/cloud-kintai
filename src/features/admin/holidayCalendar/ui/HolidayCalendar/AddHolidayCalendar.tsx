import { AddCalendarItem } from "@features/admin/holidayCalendar/ui/components/AddCalendarItem";
import { CreateHolidayCalendarInput, HolidayCalendar } from "@shared/api/graphql/types";
import { HolidayCalendarMessage } from "@shared/lib/message/HolidayCalendarMessage";

type CreateHolidayCalendarHandler = (input: CreateHolidayCalendarInput) => Promise<void | HolidayCalendar>;
type BulkCreateHolidayCalendarHandler = (inputs: CreateHolidayCalendarInput[]) => Promise<void | HolidayCalendar[]>;

export function AddHolidayCalendar({
  createHolidayCalendar,
  bulkCreateHolidayCalendar,
}: {
  createHolidayCalendar: CreateHolidayCalendarHandler;
  bulkCreateHolidayCalendar: BulkCreateHolidayCalendarHandler;
}) {
  return (
    <AddCalendarItem<CreateHolidayCalendarInput>
      addButtonLabel="休日を追加"
      addButtonProps={{ variant: "outline" }}
      dialogTitle="休日を追加"
      dialogDescription="休日としたい日付と休日名を入力してください。"
      nameLabel="休日名"
      messageFactory={HolidayCalendarMessage()}
      buildSingleInput={(holidayDate, name) => ({ holidayDate, name })}
      buildBulkInputs={(range, name) => range.map((holidayDate) => ({ holidayDate, name }))}
      createItem={createHolidayCalendar}
      bulkCreateItems={bulkCreateHolidayCalendar}
    />
  );
}

