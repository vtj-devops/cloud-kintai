import { AuthContext } from "@app/providers/auth/AuthContext";
import { useGetAttendanceByStaffAndDateQuery } from "@entities/attendance/api/attendanceApi";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { StaffType, useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { Attendance } from "@shared/api/graphql/types";
import { useAppNotification } from "@shared/lib/useAppNotification";
import dayjs from "dayjs";
import { useContext, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import * as MESSAGE_CODE from "@/errors";

const MONTH_QUERY_KEY = "month";

export function useAttendanceEditData() {
  const { notify } = useAppNotification();
  const { cognitoUser, authStatus } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const { targetWorkDate } = useParams();

  const attendanceListPath = useMemo(() => {
    const month = searchParams.get(MONTH_QUERY_KEY);
    if (!month) {
      return "/attendance/list";
    }

    return `/attendance/list?${new URLSearchParams({
      [MONTH_QUERY_KEY]: month,
    }).toString()}`;
  }, [searchParams]);

  const isAuthenticated = authStatus === "authenticated";
  const {
    staffs,
    loading: staffsLoading,
    error: staffSError,
  } = useStaffs({
    isAuthenticated,
  });

  const targetWorkDateISO = useMemo(() => {
    if (!targetWorkDate) {
      return null;
    }
    return dayjs(targetWorkDate).format(AttendanceDate.DataFormat);
  }, [targetWorkDate]);

  const staff = useMemo<StaffType | null | undefined>(() => {
    if (!cognitoUser?.id) return undefined;
    const { id: staffId } = cognitoUser;
    return staffs.find((s) => s.cognitoUserId === staffId) || null;
  }, [staffs, cognitoUser]);

  const staffId = staff?.cognitoUserId ?? null;
  const shouldFetchAttendance = Boolean(staffId && targetWorkDateISO);

  const {
    data: attendanceData,
    isLoading: isAttendanceInitialLoading,
    isFetching: isAttendanceFetching,
    isUninitialized: isAttendanceUninitialized,
    error: attendanceError,
  } = useGetAttendanceByStaffAndDateQuery(
    {
      staffId: staffId ?? "",
      workDate: targetWorkDateISO ?? "",
    },
    { skip: !shouldFetchAttendance },
  );

  const attendance: Attendance | null = attendanceData ?? null;

  const attendanceLoading =
    !shouldFetchAttendance ||
    isAttendanceInitialLoading ||
    isAttendanceFetching ||
    isAttendanceUninitialized;

  useEffect(() => {
    if (!shouldFetchAttendance || !attendanceError) {
      return;
    }

    notify({
      title: "データ取得エラー",
      description: MESSAGE_CODE.E02001,
      tone: "error",
      dedupeKey: "attendance-fetch-error",
    });
  }, [attendanceError, shouldFetchAttendance, notify]);

  return {
    cognitoUser,
    targetWorkDate,
    targetWorkDateISO,
    staff,
    staffs,
    staffsLoading,
    staffSError,
    attendance,
    attendanceLoading,
    attendanceListPath,
  };
}
