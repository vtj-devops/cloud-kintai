import { Breadcrumbs, Link, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useContext } from "react";

import { AttendanceDate } from "@/lib/AttendanceDate";

import { AttendanceEditContext } from "./AttendanceEditProvider";

export default function AttendanceEditBreadcrumb() {
  const { workDate } = useContext(AttendanceEditContext);

  if (!workDate) return null;

  return (
    <Breadcrumbs>
      <Link href="/" color="inherit">
        TOP
      </Link>
      <Link href={"/attendance/list"} color="inherit">
        勤怠一覧
      </Link>
      <Typography color="text.primary">
        {dayjs(workDate).format(AttendanceDate.DisplayFormat)}
      </Typography>
    </Breadcrumbs>
  );
}
