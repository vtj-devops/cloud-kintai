import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import { Button } from "@mui/material";
import { Attendance } from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { useContext } from "react";

import { AppConfigContext } from "@/context/AppConfigContext";
import { AttendanceDate } from "@/entities/attendance/lib/AttendanceDate";
import { FLAG_VALUES } from "@/entities/attendance/lib/businessLogic";
import { calcTotalRestTime } from "@/entities/attendance/lib/time";
import { BUTTON_MIN_WIDTH } from "@/shared/config/uiDimensions";

import downloadAttendances from "../lib/downloadAttendances";

interface Rest {
  startTime?: string | null;
  endTime?: string | null;
}

interface Props {
  workDates: string[];
  selectedStaff: StaffType[];
  fullWidth?: boolean;
}

export default function ExportButton({
  workDates,
  selectedStaff,
  fullWidth = false,
}: Props) {
  const { getHourlyPaidHolidayEnabled, getSpecialHolidayEnabled } =
    useContext(AppConfigContext);

  const disabled = workDates.length === 0 || selectedStaff.length === 0;

  const onClick = async (): Promise<void> => {
    await downloadAttendances(
      workDates.map((workDate: string) => ({
        workDate: {
          eq: workDate,
        },
      }))
    ).then((res: Attendance[]) => {
      const hourlyPaidHolidayEnabled: boolean = getHourlyPaidHolidayEnabled();
      const includeSpecialHoliday = getSpecialHolidayEnabled
        ? getSpecialHolidayEnabled()
        : false;
      const exportData: string = [
        [
          "営業日",
          "従業員コード",
          "名前",
          "休憩時間",
          "出勤打刻",
          "退勤打刻",
          "直行",
          "直帰",
          "欠勤",
          "有給休暇",
          "振替休日",
          ...(includeSpecialHoliday ? ["特別休暇"] : []),
          ...(hourlyPaidHolidayEnabled ? ["時間単位休暇(h)"] : []),
          "摘要",
        ].join(","),
        ...selectedStaff
          .toSorted((a: StaffType, b: StaffType) => {
            const aSortKey = a.sortKey || "";
            const bSortKey = b.sortKey || "";
            return aSortKey.localeCompare(bSortKey);
          })
          .map((staff: StaffType) => {
            const attendances: Attendance[] = res.filter(
              (attendance: Attendance) =>
                attendance.staffId === staff.cognitoUserId
            );

            return [
              ...workDates.map((workDate: string) => {
                const matchAttendance: Attendance | undefined =
                  attendances.find(
                    (attendance: Attendance) => attendance.workDate === workDate
                  );

                if (matchAttendance) {
                  const staffId = matchAttendance.staffId;
                  const startTime = matchAttendance.startTime;
                  const endTime = matchAttendance.endTime;
                  const goDirectlyFlag = !!matchAttendance.goDirectlyFlag;
                  const returnDirectlyFlag =
                    !!matchAttendance.returnDirectlyFlag;
                  const absentFlag = !!matchAttendance.absentFlag;
                  const paidHolidayFlag = !!matchAttendance.paidHolidayFlag;
                  const specialHolidayFlag =
                    !!matchAttendance.specialHolidayFlag;
                  const substituteHolidayDate =
                    matchAttendance.substituteHolidayDate;
                  const rests: (Rest | null)[] = matchAttendance.rests ?? [];
                  const remarks = matchAttendance.remarks;
                  const hourlyPaidHolidayHours =
                    matchAttendance.hourlyPaidHolidayHours;

                  const totalRestTime: number =
                    rests.reduce((acc: number, rest: Rest | null) => {
                      if (!rest) return acc;

                      const diff: number = calcTotalRestTime(
                        rest.startTime,
                        rest.endTime
                      );
                      return acc + diff;
                    }, 0) ?? 0;

                  const generateSummary = (): string => {
                    const textList: string[] = [];
                    if (substituteHolidayDate) {
                      const formattedSubstituteHolidayDate = dayjs(
                        substituteHolidayDate
                      ).format("M/D");
                      textList.push(`${formattedSubstituteHolidayDate}分振替`);
                    }
                    if (remarks) textList.push(remarks);
                    return textList.join(" ");
                  };

                  return [
                    dayjs(workDate).format(AttendanceDate.DisplayFormat),
                    staffId,
                    `${staff.familyName} ${staff.givenName}`,
                    totalRestTime.toFixed(2),
                    startTime ? dayjs(startTime).format("HH:mm") : "",
                    endTime ? dayjs(endTime).format("HH:mm") : "",
                    goDirectlyFlag ? FLAG_VALUES.TRUE : FLAG_VALUES.FALSE,
                    returnDirectlyFlag ? FLAG_VALUES.TRUE : FLAG_VALUES.FALSE,
                    absentFlag ? FLAG_VALUES.TRUE : FLAG_VALUES.FALSE,
                    paidHolidayFlag ? FLAG_VALUES.TRUE : FLAG_VALUES.FALSE,
                    substituteHolidayDate
                      ? FLAG_VALUES.TRUE
                      : FLAG_VALUES.FALSE,
                    ...(includeSpecialHoliday
                      ? [
                          specialHolidayFlag
                            ? FLAG_VALUES.TRUE
                            : FLAG_VALUES.FALSE,
                        ]
                      : []),
                    ...(hourlyPaidHolidayEnabled
                      ? [hourlyPaidHolidayHours ?? ""]
                      : []),
                    generateSummary(),
                  ].join(",");
                }

                return [
                  dayjs(workDate).format(AttendanceDate.DisplayFormat),
                  staff.cognitoUserId,
                  `${staff.familyName} ${staff.givenName}`,
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  ...(includeSpecialHoliday ? [""] : []),
                  ...(hourlyPaidHolidayEnabled ? [""] : []),
                  "",
                ].join(",");
              }),
            ].join("\n");
          }),
      ].join("\n");

      const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
      const blob = new Blob([bom, exportData], {
        type: "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `attendances_${dayjs().format(
        AttendanceDate.QueryParamFormat
      )}.csv`;
      a.href = url;
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <Button
      onClick={onClick}
      variant="contained"
      color="primary"
      size="medium"
      fullWidth={fullWidth}
      startIcon={<CloudDownloadOutlinedIcon />}
      disabled={disabled}
      disableElevation
      sx={{
        minWidth: BUTTON_MIN_WIDTH,
        fontWeight: "bold",
        transition: "transform 150ms ease",
        "&:hover": {
          backgroundColor: "primary.main",
          boxShadow: "none",
          transform: "translateY(-3px)",
        },
        "&:active": { transform: "translateY(-1px)" },
        "&.Mui-disabled": { transform: "none", opacity: 0.6 },
      }}
    >
      一括ダウンロード
    </Button>
  );
}
