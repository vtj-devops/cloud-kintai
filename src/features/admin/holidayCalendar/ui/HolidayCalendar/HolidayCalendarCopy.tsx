import {
  CreateHolidayCalendarInput,
  HolidayCalendar,
} from "@shared/api/graphql/types";
import { HolidayCalendarMessage } from "@shared/lib/message/HolidayCalendarMessage";
import { CopyCalendarItem } from "@features/admin/holidayCalendar/ui/components/CopyCalendarItem";

export default function HolidayCalendarCopy({
  holidayCalendar,
  createHolidayCalendar,
}: {
  holidayCalendar: HolidayCalendar;
  createHolidayCalendar: (
    input: CreateHolidayCalendarInput,
  ) => Promise<void | HolidayCalendar>;
}) {
  return (
    <CopyCalendarItem
      item={holidayCalendar}
      dialogTitle="法定休日をコピーして新規作成"
      dialogDescription="コピー元の内容を編集してから登録してください。"
      nameLabel="休日名"
      messageFactory={HolidayCalendarMessage()}
      getDate={(item) => item.holidayDate ?? ""}
      getName={(item) => item.name ?? ""}
      buildCreateInput={(data) => ({
        holidayDate: data.date,
        name: data.name,
      })}
      createItem={createHolidayCalendar}
    />
  );
}

