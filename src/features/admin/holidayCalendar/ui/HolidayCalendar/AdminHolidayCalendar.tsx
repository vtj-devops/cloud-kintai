import { AppTabs } from "@shared/ui/tabs";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import CompanyHolidayCalendarList from "../CompanyHolidayCalendar/CompanyHolidayCalendarList";
import EventCalendarList from "../EventCalendar/EventCalendarList";
import HolidayCalendarList from "./HolidayCalendarList";

const tabParamKey = "tab";
const tabValues = ["legal", "company", "event"] as const;
type TabValue = (typeof tabValues)[number];

const getTabValueFromParam = (param: string | null): TabValue =>
  tabValues.includes(param as TabValue) ? (param as TabValue) : "legal";

export default function AdminHolidayCalendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = useMemo(
    () => getTabValueFromParam(searchParams.get(tabParamKey)),
    [searchParams],
  );

  const handleChange = (newValue: TabValue) => {
    const next = new URLSearchParams(searchParams);
    next.set(tabParamKey, newValue);
    setSearchParams(next, { replace: true });
  };

  const tabs = useMemo(
    () => [
      {
        value: "legal" as const,
        label: "法定休日",
        content: <HolidayCalendarList />,
      },
      {
        value: "company" as const,
        label: "会社休日",
        content: <CompanyHolidayCalendarList />,
      },
      {
        value: "event" as const,
        label: "イベントカレンダー",
        content: <EventCalendarList />,
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-slate-700">
        こちらでは、法定休日、会社休日、およびイベントカレンダーを管理できます。
        <br />
        法定休日は労働基準法に基づく休日、会社休日は企業が独自に設定した休日、イベントカレンダーは休日以外の周知したい情報です。
      </p>
      <p className="m-0 text-slate-700">
        法定休日は、政府が公開する祝日データを元に作成されています。詳細は「ファイルからまとめて追加」をご参照ください。
      </p>
      <div className="w-full">
        <AppTabs
          value={value}
          onChange={handleChange}
          items={tabs}
          appearance="underline"
          panelPadding={3}
          tabsProps={{
            "aria-label": "祝日カレンダータブ",
            variant: "scrollable",
          }}
        />
      </div>
    </div>
  );
}
