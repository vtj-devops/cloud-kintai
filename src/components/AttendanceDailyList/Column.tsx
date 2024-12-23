import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import {
  GridActionsCellItem,
  GridColDef,
  GridRowParams,
  GridValueGetterParams,
} from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import { AttendanceTime } from "@/lib/AttendanceTime";

import { AttendanceDaily } from "../../hooks/useAttendanceDaily/useAttendanceDaily";

export default function GetColumns(): GridColDef[] {
  const navigate = useNavigate();

  return [
    {
      field: "actions",
      type: "actions",
      sortable: false,
      getActions: (params: GridRowParams<AttendanceDaily>) => [
        <GridActionsCellItem
          key={params.id}
          icon={<CalendarMonthIcon />}
          onClick={() => {
            const { sub: staffId } = params.row;
            navigate(`/admin/staff/${staffId}/attendance`);
          }}
          label="一覧"
        />,
      ],
    },
    {
      field: "fullName",
      type: "string",
      headerName: "氏名",
      align: "left",
      sortable: false,
      headerAlign: "center",
      width: 200,
      valueGetter: (params: GridValueGetterParams<AttendanceDaily>) => {
        const { familyName, givenName } = params.row;
        if (!familyName && !givenName) return "(未設定)";

        return `${familyName || ""} ${givenName || ""}`;
      },
    },
    {
      field: "startTime",
      type: "string",
      headerName: "出勤時刻",
      align: "center",
      sortable: false,
      headerAlign: "center",
      valueGetter(params: GridValueGetterParams<AttendanceDaily>) {
        if (params.row.attendance === null) return AttendanceTime.None;

        const { startTime } = params.row.attendance;
        if (!startTime) return AttendanceTime.None;

        return dayjs(startTime).format("HH:mm");
      },
    },
    {
      field: "endTime",
      type: "string",
      headerName: "退勤時刻",
      align: "center",
      sortable: false,
      headerAlign: "center",
      valueGetter(params: GridValueGetterParams<AttendanceDaily>) {
        if (params.row.attendance === null) return AttendanceTime.None;

        const { endTime } = params.row.attendance;
        if (!endTime) return AttendanceTime.None;

        return dayjs(endTime).format("HH:mm");
      },
    },
  ];
}
