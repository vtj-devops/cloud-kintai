import { AddCalendarItem } from "@features/admin/holidayCalendar/ui/components/AddCalendarItem";
import {
  CompanyHolidayCalendar,
  CreateCompanyHolidayCalendarInput,
} from "@shared/api/graphql/types";
import { CompanyHolidayCalendarMessage } from "@shared/lib/message/CompanyHolidayCalendarMessage";

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
  return (
    <AddCalendarItem<CreateCompanyHolidayCalendarInput>
      addButtonLabel="休日を追加"
      addButtonProps={{ variant: "outline", tone: "primary", size: "sm" }}
      dialogTitle="会社休日を追加"
      dialogDescription="休日としたい日付と休日名を入力してください。"
      nameLabel="休日名"
      messageFactory={CompanyHolidayCalendarMessage()}
      buildSingleInput={(holidayDate, name) => ({ holidayDate, name })}
      buildBulkInputs={(range, name) => range.map((holidayDate) => ({ holidayDate, name }))}
      createItem={createCompanyHolidayCalendar}
      bulkCreateItems={bulkCreateCompanyHolidayCalendar}
    />
  );
}

