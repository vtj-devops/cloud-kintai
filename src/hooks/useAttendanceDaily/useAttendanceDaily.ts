import dayjs from "dayjs";
import { useEffect, useState } from "react";

import { AttendanceDate } from "@/lib/AttendanceDate";

import { Attendance } from "../../API";
import { AttendanceDataManager } from "../useAttendance/AttendanceDataManager";
import useStaffs from "../useStaffs/useStaffs";

export interface AttendanceDaily {
  sub: string;
  givenName: string;
  familyName: string;
  sortKey: string;
  attendance: Attendance | null;
}

export default function useAttendanceDaily() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attendanceDailyList, setAttendanceDailyList] = useState<
    AttendanceDaily[]
  >([]);

  const { staffs, loading: staffLoading, error: staffError } = useStaffs();

  const now = dayjs();
  const workDate = now.format(AttendanceDate.DataFormat);

  useEffect(() => {
    if (staffLoading || staffError) return;
    if (staffs.length === 0) return;

    setLoading(true);
    setError(null);
    fetchAllByWorkDate(workDate)
      .catch((e: Error) => {
        setError(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [staffs, staffLoading, staffError, workDate]);

  const fetchAllByWorkDate = async (targetDate: string) => {
    return await Promise.all(
      staffs.map(async ({ cognitoUserId, givenName, familyName, sortKey }) => {
        const attendance = await new AttendanceDataManager().fetchAll(
          cognitoUserId,
          targetDate
        );

        return {
          sub: cognitoUserId,
          givenName,
          familyName,
          attendance,
          sortKey: sortKey || "",
        } as AttendanceDaily;
      })
    ).then((res) => {
      setAttendanceDailyList(res);
      return res;
    });
  };

  return {
    loading,
    error,
    attendanceDailyList,
    fetchAllByWorkDate,
  };
}
