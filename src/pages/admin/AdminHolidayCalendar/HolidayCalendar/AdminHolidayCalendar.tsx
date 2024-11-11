import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";

import CompanyHolidayCalendarList from "../CompanyHolidayCalendar/CompanyHolidayCalendarList";
import HolidayCalendarList from "./HolidayCalendarList";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function Title() {
  return (
    <Typography
      variant="h4"
      sx={{ pl: 1, borderBottom: "solid 5px #0FA85E", color: "#0FA85E" }}
    >
      休日カレンダー管理
    </Typography>
  );
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function AdminHolidayCalendar() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Stack spacing={2}>
      <Title />
      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
          >
            <Tab label="法定休日" {...a11yProps(0)} />
            <Tab label="会社休日" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          <HolidayCalendarList />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <CompanyHolidayCalendarList />
        </CustomTabPanel>
      </Box>
    </Stack>
  );
}
