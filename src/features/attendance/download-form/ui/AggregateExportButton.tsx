import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import { Button } from "@mui/material";
import { Attendance } from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { useContext } from "react";

import { AppConfigContext } from "@/context/AppConfigContext";
import { AttendanceDate } from "@/entities/attendance/lib/AttendanceDate";
import { calcTotalRestTime } from "@/entities/attendance/lib/time";
import { BUTTON_MIN_WIDTH } from "@/shared/config/uiDimensions";

import downloadAttendances from "../lib/downloadAttendances";

type Props = {
  workDates: string[];
  selectedStaff: StaffType[];
  fullWidth?: boolean;
};

export default function AggregateExportButton({
  workDates,
  selectedStaff,
  fullWidth = false,
}: Props) {
  const { getHourlyPaidHolidayEnabled, getSpecialHolidayEnabled } =
    useContext(AppConfigContext);

  const onClick = async () => {
    if (workDates.length === 0 || selectedStaff.length === 0) return;

    const res: Attendance[] = await downloadAttendances(
      workDates.map((workDate) => ({ workDate: { eq: workDate } }))
    );

    const hourlyPaidHolidayEnabled = getHourlyPaidHolidayEnabled();
    const includeSpecialHoliday = getSpecialHolidayEnabled
      ? getSpecialHolidayEnabled()
      : false;

    const header = [
      "従業員コード",
      "名前",
      "対象日数",
      "出勤日数",
      "欠勤日数",
      "実働合計(h)",
      "休憩合計(h)",
      "有給日数",
      "振替休日日数",
      ...(includeSpecialHoliday ? ["特別休暇"] : []),
      ...(hourlyPaidHolidayEnabled ? ["時間単位休暇合計(h)"] : []),
      "摘要",
    ];

    const lines = selectedStaff
      .toSorted((a, b) => (a.sortKey || "").localeCompare(b.sortKey || ""))
      .map((staff) => {
        const attendances = res.filter(
          (a) =>
            a.staffId === staff.cognitoUserId && workDates.includes(a.workDate)
        );

        const attendanceDates = new Set(attendances.map((a) => a.workDate));
        const 出勤日数 = attendanceDates.size;

        let totalWork = 0;
        let totalRest = 0;
        let paidHolidayCount = 0;
        let absentCount = 0;
        let substituteCount = 0;
        let specialHolidayCount = 0;
        let hourlyPaidHolidayHoursSum = 0;
        const remarks: string[] = [];

        attendances.forEach((att) => {
          if (att.paidHolidayFlag) paidHolidayCount += 1;
          if (att.absentFlag) absentCount += 1;
          if (att.substituteHolidayDate) substituteCount += 1;
          if (att.specialHolidayFlag) specialHolidayCount += 1;
          if (hourlyPaidHolidayEnabled && att.hourlyPaidHolidayHours)
            hourlyPaidHolidayHoursSum +=
              Number(att.hourlyPaidHolidayHours) || 0;

          const rests = att.rests ?? [];
          const restForDay = rests.reduce((acc: number, r) => {
            if (!r) return acc;
            return acc + calcTotalRestTime(r.startTime, r.endTime);
          }, 0);
          totalRest += restForDay;

          if (att.startTime && att.endTime) {
            const duration = dayjs(att.endTime).diff(
              dayjs(att.startTime),
              "hour",
              true
            );
            totalWork += Math.max(0, duration - restForDay);
          }

          if (att.remarks) remarks.push(att.remarks);
        });

        const cols: (string | number)[] = [
          staff.cognitoUserId,
          `${staff.familyName} ${staff.givenName}`,
          workDates.length,
          出勤日数,
          absentCount,
          totalWork.toFixed(2),
          totalRest.toFixed(2),
          paidHolidayCount,
          substituteCount,
          ...(includeSpecialHoliday ? [specialHolidayCount] : []),
          ...(hourlyPaidHolidayEnabled
            ? [hourlyPaidHolidayHoursSum.toFixed(2)]
            : []),
          remarks.join(" "),
        ];

        return cols.join(",");
      });

    const exportData = [header.join(","), ...lines].join("\n");

    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, exportData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `attendance_aggregate_${dayjs().format(
      AttendanceDate.QueryParamFormat
    )}.csv`;
    a.href = url;
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="contained"
      color="secondary"
      size="medium"
      onClick={onClick}
      startIcon={<CloudDownloadOutlinedIcon />}
      fullWidth={fullWidth}
      disabled={workDates.length === 0 || selectedStaff.length === 0}
      disableElevation
      sx={{
        minWidth: BUTTON_MIN_WIDTH,
        fontWeight: "bold",
        transition: "transform 150ms ease",
        "&:hover": {
          backgroundColor: "secondary.main",
          boxShadow: "none",
          transform: "translateY(-3px)",
        },
        "&:active": { transform: "translateY(-1px)" },
        "&.Mui-disabled": { transform: "none", opacity: 0.6 },
      }}
    >
      集計ダウンロード
    </Button>
  );
}
