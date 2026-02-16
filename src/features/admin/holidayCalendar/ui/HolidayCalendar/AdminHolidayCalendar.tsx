import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import { type ReactNode, type SyntheticEvent, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import CompanyHolidayCalendarList from "../CompanyHolidayCalendar/CompanyHolidayCalendarList";
import EventCalendarList from "../EventCalendar/EventCalendarList";
import HolidayCalendarList from "./HolidayCalendarList";

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      <Box sx={{ p: 3 }}>{children}</Box>
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const tabParamKey = "tab";
const tabValues = ["legal", "company", "event"] as const;
type TabValue = (typeof tabValues)[number];

const getTabIndexFromParam = (param: string | null) => {
  if (!param) return 0;
  const index = tabValues.indexOf(param as TabValue);
  return index >= 0 ? index : 0;
};

const getTabParamFromIndex = (index: number): TabValue =>
  tabValues[index] ?? "legal";

export default function AdminHolidayCalendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = useMemo(
    () => getTabIndexFromParam(searchParams.get(tabParamKey)),
    [searchParams],
  );

  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    const next = new URLSearchParams(searchParams);
    next.set(tabParamKey, getTabParamFromIndex(newValue));
    setSearchParams(next, { replace: true });
  };

  return (
    <Stack spacing={2}>
      <Typography>
        こちらでは、法定休日、会社休日、およびイベントカレンダーを管理できます。
        <br />
        法定休日は労働基準法に基づく休日、会社休日は企業が独自に設定した休日、イベントカレンダーは休日以外の周知したい情報です。
        <br />
      </Typography>
      <Typography>
        法定休日は、政府が公開する祝日データを元に作成されています。詳細は「ファイルからまとめて追加」をご参照ください。
      </Typography>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
          >
            <Tab label="法定休日" {...a11yProps(0)} />
            <Tab label="会社休日" {...a11yProps(1)} />
            <Tab label="イベントカレンダー" {...a11yProps(2)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          <HolidayCalendarList />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <CompanyHolidayCalendarList />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          <EventCalendarList />
        </CustomTabPanel>
      </Box>
    </Stack>
  );
}
