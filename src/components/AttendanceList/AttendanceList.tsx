import {
  Box,
  Breadcrumbs,
  LinearProgress,
  Stack,
  styled,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { Logger } from "aws-amplify";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AttendanceDate } from "@/lib/AttendanceDate";
import { calcTotalRestTime } from "@/pages/AttendanceEdit/DesktopEditor/RestTimeItem/RestTimeInput/RestTimeInput";
import { calcTotalWorkTime } from "@/pages/AttendanceEdit/DesktopEditor/WorkTimeInput/WorkTimeInput";

import { Staff } from "../../API";
import { useAppDispatchV2 } from "../../app/hooks";
import * as MESSAGE_CODE from "../../errors";
import useAttendances from "../../hooks/useAttendances/useAttendances";
import useCompanyHolidayCalendars from "../../hooks/useCompanyHolidayCalendars/useCompanyHolidayCalendars";
import useHolidayCalendars from "../../hooks/useHolidayCalendars/useHolidayCalendars";
import fetchStaff from "../../hooks/useStaff/fetchStaff";
import { AuthContext } from "../../Layout";
import { setSnackbarError } from "../../lib/reducers/snackbarReducer";
import Title from "../Title/Title";
import DesktopList from "./DesktopList";
import MobileList from "./MobileList/MobileList";

const DescriptionTypography = styled(Typography)(({ theme }) => ({
  padding: "0px 40px",
  [theme.breakpoints.down("md")]: {
    padding: "0px 10px",
  },
}));

export default function AttendanceTable() {
  const { cognitoUser } = useContext(AuthContext);
  const dispatch = useAppDispatchV2();
  const navigate = useNavigate();
  const { attendances, getAttendances } = useAttendances();
  const {
    holidayCalendars,
    loading: holidayCalendarLoading,
    error: holidayCalendarError,
  } = useHolidayCalendars();
  const {
    companyHolidayCalendars,
    loading: companyHolidayCalendarLoading,
    error: companyHolidayCalendarError,
  } = useCompanyHolidayCalendars();

  const [staff, setStaff] = useState<Staff | null | undefined>(undefined);
  const [totalTime, setTotalTime] = useState<number>(0);

  const logger = new Logger(
    "AttendanceList",
    import.meta.env.DEV ? "DEBUG" : "ERROR"
  );

  useEffect(() => {
    if (!cognitoUser) return;

    getAttendances(cognitoUser.id).catch((error) => {
      logger.debug(error);
      dispatch(setSnackbarError(MESSAGE_CODE.E02001));
    });

    fetchStaff(cognitoUser.id)
      .then((res) => {
        setStaff(res);
      })
      .catch((error) => {
        logger.debug(error);
        dispatch(setSnackbarError(MESSAGE_CODE.E00001));
      });
  }, [cognitoUser]);

  useEffect(() => {
    const totalWorkTime = attendances.reduce((acc, attendance) => {
      if (!attendance.startTime || !attendance.endTime) return acc;

      const workTime = calcTotalWorkTime(
        attendance.startTime,
        attendance.endTime
      );
      return acc + workTime;
    }, 0);

    const totalRestTime = attendances.reduce((acc, attendance) => {
      if (!attendance.rests) return acc;

      const restTime = attendance.rests
        .filter((item): item is NonNullable<typeof item> => !!item)
        .reduce((acc, rest) => {
          if (!rest.startTime || !rest.endTime) return acc;

          return acc + calcTotalRestTime(rest.startTime, rest.endTime);
        }, 0);

      return acc + restTime;
    }, 0);

    setTotalTime(totalWorkTime - totalRestTime);
  }, [attendances]);

  if (holidayCalendarLoading || companyHolidayCalendarLoading) {
    return <LinearProgress />;
  }

  if (holidayCalendarError || companyHolidayCalendarError) {
    dispatch(setSnackbarError(MESSAGE_CODE.E00001));
    return null;
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Breadcrumbs>
          <Link to="/" color="inherit">
            TOP
          </Link>
          <Typography color="text.primary">勤怠一覧</Typography>
        </Breadcrumbs>
      </Box>
      <Box>
        <Title>{`勤怠一覧(${totalTime.toFixed(1)}h)`}</Title>
      </Box>
      <DescriptionTypography variant="body1">
        今日から30日前までの勤怠情報を表示しています
      </DescriptionTypography>
      <Box
        sx={{
          pl: {
            md: 5,
          },
        }}
      >
        <DatePicker
          value={dayjs()}
          format={AttendanceDate.DisplayFormat}
          label="日付を指定して移動"
          slotProps={{
            textField: { size: "small" },
          }}
          onChange={(date) => {
            if (date) {
              navigate(
                `/attendance/${date.format(
                  AttendanceDate.QueryParamFormat
                )}/edit`
              );
            }
          }}
        />
      </Box>
      <DesktopList
        attendances={attendances}
        holidayCalendars={holidayCalendars}
        companyHolidayCalendars={companyHolidayCalendars}
        navigate={navigate}
        staff={staff}
      />
      <MobileList
        attendances={attendances}
        holidayCalendars={holidayCalendars}
        companyHolidayCalendars={companyHolidayCalendars}
        staff={staff}
      />
    </Stack>
  );
}
