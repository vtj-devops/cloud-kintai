import {
  CompanyHolidayCalendar,
  CreateCompanyHolidayCalendarInput,
} from "@shared/api/graphql/types";
import { CompanyHolidayCalendarMessage } from "@shared/lib/message/CompanyHolidayCalendarMessage";
import { CopyCalendarItem } from "@features/admin/holidayCalendar/ui/components/CopyCalendarItem";

export default function CompanyHolidayCalendarCopy({
  companyHolidayCalendar,
  createCompanyHolidayCalendar,
}: {
  companyHolidayCalendar: CompanyHolidayCalendar;
  createCompanyHolidayCalendar: (
    input: CreateCompanyHolidayCalendarInput,
  ) => Promise<void | CompanyHolidayCalendar>;
}) {
  return (
    <CopyCalendarItem
      item={companyHolidayCalendar}
      dialogTitle="会社休日をコピーして新規作成"
      dialogDescription="コピー元の内容を編集してから登録してください。"
      nameLabel="休日名"
      messageFactory={CompanyHolidayCalendarMessage()}
      getDate={(item) => item.holidayDate ?? ""}
      getName={(item) => item.name ?? ""}
      buildCreateInput={(data) => ({
        holidayDate: data.date,
        name: data.name,
      })}
      createItem={createCompanyHolidayCalendar}
    />
  );
}

