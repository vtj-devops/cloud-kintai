import "./AttendanceList.scss";

import { AuthContext } from "@app/providers/auth/AuthContext";
import { useListAttendancesByDateRangeQuery } from "@entities/attendance/api/attendanceApi";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import useCloseDates from "@entities/attendance/model/useCloseDates";
import { useCalendars } from "@entities/calendar/model/useCalendars";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  onCreateAttendance,
  onDeleteAttendance,
  onUpdateAttendance,
} from "@shared/api/graphql/documents/subscriptions";
import {
  OnCreateAttendanceSubscription,
  OnDeleteAttendanceSubscription,
  OnUpdateAttendanceSubscription,
  Staff,
} from "@shared/api/graphql/types";
import { Logger } from "@shared/lib/logger";
import { formatMonthQueryValue } from "@shared/lib/monthQuery";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import dayjs, { Dayjs } from "dayjs";
import { Loader2 } from "lucide-react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

import * as MESSAGE_CODE from "@/errors";

import AttendanceListCard from "./AttendanceListCard";
import { AttendanceListProvider } from "./AttendanceListContext";
import AttendanceListHeader from "./AttendanceListHeader";
import {
  formatDateRangeLabel,
  getAttendanceQueryDateRange,
  getCurrentMonthFromQuery,
  getEffectiveDateRange,
  MONTH_QUERY_KEY,
  shouldRefetchForAttendanceEvent,
} from "./attendanceListUtils";
import DesktopList from "./DesktopList";
import MobileList from "./MobileList/MobileList";

export default function AttendanceTable() {
  const { cognitoUser } = useContext(AuthContext);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const shouldFetchAttendances = Boolean(cognitoUser?.id);
  const currentMonth = useMemo(
    () => getCurrentMonthFromQuery(searchParams.get(MONTH_QUERY_KEY)),
    [searchParams],
  );
  const handleMonthChange = useCallback(
    (nextMonth: Dayjs) => {
      const normalizedMonth = nextMonth.startOf("month");
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set(MONTH_QUERY_KEY, formatMonthQueryValue(normalizedMonth));
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );
  const {
    holidayCalendars,
    companyHolidayCalendars,
    isLoading: calendarLoading,
    error: calendarsError,
  } = useCalendars();
  const {
    closeDates,
    loading: closeDatesLoading,
    error: closeDatesError,
  } = useCloseDates();
  const effectiveDateRange = useMemo(
    () => getEffectiveDateRange(currentMonth, closeDates),
    [currentMonth, closeDates],
  );
  const attendanceQueryDateRange = useMemo(
    () => getAttendanceQueryDateRange(currentMonth, effectiveDateRange),
    [currentMonth, effectiveDateRange],
  );
  const startDate = attendanceQueryDateRange.start.format(
    AttendanceDate.DataFormat,
  );
  const endDate = attendanceQueryDateRange.end.format(
    AttendanceDate.DataFormat,
  );
  const {
    data: attendances = [],
    isLoading: isAttendancesInitialLoading,
    isFetching: isAttendancesFetching,
    isUninitialized: isAttendancesUninitialized,
    error: attendancesError,
    refetch: refetchAttendances,
  } = useListAttendancesByDateRangeQuery(
    {
      staffId: cognitoUser?.id ?? "",
      startDate,
      endDate,
    },
    {
      skip: !shouldFetchAttendances,
      refetchOnMountOrArgChange: true,
    },
  );
  const attendanceLoading =
    !shouldFetchAttendances ||
    isAttendancesInitialLoading ||
    isAttendancesFetching ||
    isAttendancesUninitialized;

  useEffect(() => {
    const currentStaffId = cognitoUser?.id;
    if (!currentStaffId || !shouldFetchAttendances) return;
    let refetchTimer: ReturnType<typeof setTimeout> | null = null;
    const queryRange = { start: dayjs(startDate), end: dayjs(endDate) };
    const scheduleRefetch = () => {
      if (refetchTimer) {
        clearTimeout(refetchTimer);
      }
      refetchTimer = setTimeout(() => {
        void refetchAttendances();
      }, 300);
    };
    const createSubscription = graphqlClient
      .graphql({ query: onCreateAttendance, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnCreateAttendanceSubscription }) => {
          const attendance = data?.onCreateAttendance;
          if (
            !shouldRefetchForAttendanceEvent(
              currentStaffId,
              queryRange,
              attendance?.staffId,
              attendance?.workDate,
            )
          ) {
            return;
          }
          scheduleRefetch();
        },
      });
    const updateSubscription = graphqlClient
      .graphql({ query: onUpdateAttendance, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnUpdateAttendanceSubscription }) => {
          const attendance = data?.onUpdateAttendance;
          if (
            !shouldRefetchForAttendanceEvent(
              currentStaffId,
              queryRange,
              attendance?.staffId,
              attendance?.workDate,
            )
          ) {
            return;
          }
          scheduleRefetch();
        },
      });
    const deleteSubscription = graphqlClient
      .graphql({ query: onDeleteAttendance, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnDeleteAttendanceSubscription }) => {
          const attendance = data?.onDeleteAttendance;
          if (
            !shouldRefetchForAttendanceEvent(
              currentStaffId,
              queryRange,
              attendance?.staffId,
              attendance?.workDate,
            )
          ) {
            return;
          }
          scheduleRefetch();
        },
      });
    return () => {
      createSubscription.unsubscribe();
      updateSubscription.unsubscribe();
      deleteSubscription.unsubscribe();
      if (refetchTimer) {
        clearTimeout(refetchTimer);
      }
    };
  }, [
    cognitoUser?.id,
    shouldFetchAttendances,
    startDate,
    endDate,
    refetchAttendances,
  ]);
  const logger = useMemo(
    () => new Logger("AttendanceList", import.meta.env.DEV ? "DEBUG" : "ERROR"),
    [],
  );
  const [staff, setStaff] = useState<Staff | null | undefined>(undefined);
  useEffect(() => {
    if (!cognitoUser) return;
    fetchStaff(cognitoUser.id)
      .then((res: Staff | undefined) => {
        setStaff(res);
      })
      .catch((error: unknown) => {
        logger.debug(error);
        dispatch(
          pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E00001,
          }),
        );
      });
  }, [cognitoUser, dispatch, logger]);
  useEffect(() => {
    if (calendarsError) {
      logger.debug(calendarsError);
      dispatch(
        pushNotification({
          tone: "error",
          message: MESSAGE_CODE.E00001,
        }),
      );
    }
  }, [calendarsError, dispatch, logger]);
  useEffect(() => {
    if (closeDatesError) {
      logger.debug(closeDatesError);
      dispatch(
        pushNotification({
          tone: "error",
          message: MESSAGE_CODE.E00001,
        }),
      );
    }
  }, [closeDatesError, dispatch, logger]);
  useEffect(() => {
    if (attendancesError) {
      logger.debug(attendancesError);
      dispatch(
        pushNotification({
          tone: "error",
          message: MESSAGE_CODE.E02001,
        }),
      );
    }
  }, [attendancesError, dispatch, logger]);
  const rangeLabelForDisplay = useMemo(
    () => formatDateRangeLabel(effectiveDateRange),
    [effectiveDateRange],
  );
  if (attendanceLoading || calendarLoading || closeDatesLoading) {
    return (
      <div className="w-full flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  const contextValue = {
    attendances,
    staff,
    holidayCalendars,
    companyHolidayCalendars,
    navigate,
    closeDates,
    closeDatesLoading,
    closeDatesError,
    currentMonth,
    effectiveDateRange,
    onMonthChange: handleMonthChange,
  };
  return (
    <AttendanceListProvider value={contextValue}>
      <div className="attendance-list p-4 md:p-8">
        <AttendanceListHeader rangeLabelForDisplay={rangeLabelForDisplay} />

        <AttendanceListCard>
          {isDesktop ? <DesktopList /> : <MobileList />}
        </AttendanceListCard>
      </div>
    </AttendanceListProvider>
  );
}
