import { HolidayCalendar } from "@shared/api/graphql/types";
import { HolidayCalendarMessage } from "@shared/lib/message/HolidayCalendarMessage";
import { EditCalendarItem } from "@features/admin/holidayCalendar/ui/components/EditCalendarItem";

export default function HolidayCalendarEdit({
  holidayCalendar,
  updateHolidayCalendar,
}: {
  holidayCalendar: HolidayCalendar;
  updateHolidayCalendar: (input: HolidayCalendar) => Promise<HolidayCalendar>;
}) {
  return (
    <EditCalendarItem
      item={holidayCalendar}
      dialogTitle="法定休日を編集"
      dialogDescription="休日としたい日付と休日名を入力してください。"
      nameLabel="休日名"
      messageFactory={HolidayCalendarMessage()}
      getDate={(item) => item.holidayDate}
      getName={(item) => item.name}
      buildUpdatePayload={(item, { date, name }) => ({
        ...item,
        holidayDate: date!.toISOString(),
        name,
      })}
      updateItem={updateHolidayCalendar}
    />
  );
}


