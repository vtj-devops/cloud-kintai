import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { CompanyHolidayCalendar } from "@shared/api/graphql/types";
import { CompanyHolidayCalendarMessage } from "@shared/lib/message/CompanyHolidayCalendarMessage";
import { EditCalendarItem } from "@features/admin/holidayCalendar/ui/components/EditCalendarItem";

export default function CompanyHolidayCalendarEdit({
  holidayCalendar,
  updateCompanyHolidayCalendar,
}: {
  holidayCalendar: CompanyHolidayCalendar;
  updateCompanyHolidayCalendar: (
    input: CompanyHolidayCalendar,
  ) => Promise<CompanyHolidayCalendar>;
}) {
  return (
    <EditCalendarItem
      item={holidayCalendar}
      dialogTitle="会社休日を編集"
      dialogDescription="休日としたい日付と休日名を入力してください。"
      nameLabel="休日名"
      messageFactory={CompanyHolidayCalendarMessage()}
      getDate={(item) => item.holidayDate}
      getName={(item) => item.name}
      buildUpdatePayload={(item, { date, name }) => ({
        ...item,
        holidayDate: date!.format(AttendanceDate.DataFormat),
        name,
      })}
      updateItem={updateCompanyHolidayCalendar}
    />
  );
}

