import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import {
  GridActionsCellItem,
  GridColDef,
  GridRowModes,
  GridRowModesModel,
  GridRowParams,
  GridValueGetterParams,
} from "@mui/x-data-grid";
import dayjs from "dayjs";
import { NavigateFunction } from "react-router-dom";

import { AttendanceDate } from "@/lib/AttendanceDate";
import { CompanyHoliday } from "@/lib/CompanyHoliday";
import { DayOfWeek } from "@/lib/DayOfWeek";
import { Holiday } from "@/lib/Holiday";

import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
} from "../../../API";

export default function getColumns(
  rowModelsModel: GridRowModesModel,
  staffId: string | undefined,
  navigate: NavigateFunction,
  holidayCalendars: HolidayCalendar[],
  companyHolidayCalendars: CompanyHolidayCalendar[]
): GridColDef[] {
  return [
    {
      field: "workDate",
      headerName: "勤務日",
      width: 90,
      align: "right",
      valueGetter: (params: GridValueGetterParams<Attendance>) => {
        const { workDate } = params.row;

        const dayOfWeek = new DayOfWeek(holidayCalendars).getLabel(workDate);

        const date = dayjs(workDate);
        return `${date.format("M/D")}(${dayOfWeek})`;
      },
    },
    {
      field: "startTime",
      headerName: "出勤時間",
      width: 70,
      valueGetter: (params: GridValueGetterParams<Attendance>) => {
        const { startTime, paidHolidayFlag } = params.row;
        if (paidHolidayFlag) {
          return "09:00";
        }

        if (!startTime) return "";

        const date = dayjs(startTime);
        return date.format("HH:mm");
      },
    },
    {
      field: "endTime",
      headerName: "退勤時間",
      width: 70,
      valueGetter: (params: GridValueGetterParams<Attendance>) => {
        const { endTime, paidHolidayFlag } = params.row;

        if (paidHolidayFlag) {
          return "18:00";
        }

        if (!endTime) return "";

        const date = dayjs(endTime);
        return date.format("HH:mm");
      },
    },
    {
      field: "restStartTime",
      headerName: "休憩開始(最近)",
      width: 110,
      valueGetter: (params: GridValueGetterParams<Attendance>) => {
        const { paidHolidayFlag } = params.row;

        if (paidHolidayFlag) {
          return "12:00";
        }

        if (!params.row.rests) return "";

        const rests = params.row.rests.filter(
          (item): item is NonNullable<typeof item> => item !== null
        );
        if (rests.length === 0) return "";

        const latestRest = rests[rests.length - 1];

        if (!latestRest.startTime) return "";

        const date = dayjs(latestRest.startTime);
        return date.format("HH:mm");
      },
    },
    {
      field: "restEndTime",
      headerName: "休憩終了(最近)",
      width: 110,
      valueGetter: (params: GridValueGetterParams<Attendance>) => {
        const { paidHolidayFlag } = params.row;

        if (paidHolidayFlag) {
          return "13:00";
        }

        if (!params.row.rests) return "";

        const rests = params.row.rests.filter(
          (item): item is NonNullable<typeof item> => item !== null
        );

        if (rests.length === 0) return "";

        const latestRest = rests[rests.length - 1];

        if (!latestRest.endTime) return "";

        const date = dayjs(latestRest.endTime);
        return date.format("HH:mm");
      },
    },
    {
      field: "createdAt",
      headerName: "作成日時",
      width: 100,
      align: "right",
      valueGetter(params: GridValueGetterParams<Attendance>) {
        const { createdAt } = params.row;
        if (!createdAt) return "";

        const date = dayjs(createdAt);
        return date.format("MM/DD HH:mm");
      },
    },
    {
      field: "updatedAt",
      headerName: "更新日時",
      width: 100,
      align: "right",
      valueGetter(params: GridValueGetterParams<Attendance>) {
        const { updatedAt } = params.row;
        if (!updatedAt) return "";

        const date = dayjs(updatedAt);
        return date.format("MM/DD HH:mm");
      },
    },
    {
      field: "summary",
      headerName: "摘要",
      align: "left",
      sortable: false,
      width: 300,
      headerAlign: "center",
      valueGetter: (params: GridValueGetterParams<Attendance>) => {
        const { workDate, paidHolidayFlag, substituteHolidayDate } = params.row;
        const isHoliday = new Holiday(holidayCalendars, workDate).getHoliday();
        const isCompanyHoliday = new CompanyHoliday(
          companyHolidayCalendars,
          workDate
        ).getHoliday();

        const isSubstituteHoliday = substituteHolidayDate
          ? dayjs(substituteHolidayDate).isValid()
          : false;

        const summaryMessage = [];
        if (paidHolidayFlag) summaryMessage.push("有給休暇");
        if (isSubstituteHoliday) summaryMessage.push("振替休日");
        if (isHoliday) summaryMessage.push(isHoliday.name);
        if (isCompanyHoliday) summaryMessage.push(isCompanyHoliday.name);
        if (params.row.remarks) summaryMessage.push(params.row.remarks);

        return summaryMessage.join(" ");
      },
    },
    {
      field: "actions",
      type: "actions",
      getActions: (params: GridRowParams<Attendance>) => {
        const isEditMode =
          rowModelsModel[params.id]?.mode === GridRowModes.Edit;
        if (isEditMode) {
          return [
            <GridActionsCellItem
              key={params.row.id}
              icon={<SaveIcon />}
              label="保存"
            />,
            <GridActionsCellItem
              key={params.row.id}
              icon={<CloseIcon />}
              label="キャンセル"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            key={params.row.id}
            icon={<EditIcon />}
            label="編集"
            onClick={() => {
              if (!staffId) return;

              const workDate = dayjs(params.row.workDate).format(
                AttendanceDate.QueryParamFormat
              );
              navigate(`/admin/attendances/edit/${workDate}/${staffId}`);
            }}
          />,
        ];
      },
    },
  ];
}
