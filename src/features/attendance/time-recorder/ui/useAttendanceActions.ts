import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import {
  type AttendanceUpsertAction,
  useUpdateAttendanceMutation,
  useUpsertAttendanceByStaffAndDateMutation,
} from "@entities/attendance/api/attendanceApi";
import {
  clockInAction,
  clockOutAction,
  GoDirectlyFlag,
  restEndAction,
  restStartAction,
  ReturnDirectlyFlag,
} from "@entities/attendance/lib/actions/attendanceActions";
import { buildAttendanceIdempotencyKey } from "@entities/attendance/lib/operationContext";
import { getNowISOStringWithZeroSeconds } from "@entities/attendance/lib/time";
import { CognitoUser } from "@entities/staff/model/useCognitoUser";
import { Attendance, CreateAttendanceInput, Staff } from "@shared/api/graphql/types";
import { Logger } from "@shared/lib/logger";
import { useCallback, useContext, useRef } from "react";
import { useDispatch } from "react-redux";

import { clockInCallback } from "./clockInCallback";
import { clockOutCallback } from "./clockOutCallback";
import { goDirectlyCallback } from "./goDirectlyCallback";
import { restEndCallback } from "./restEndCallback";
import { restStartCallback } from "./restStartCallback";
import { returnDirectlyCallback } from "./returnDirectlyCallback";
import { toConfiguredTimeISO } from "./timeRecorderUtils";

type UseAttendanceActionsParams = {
  attendance: Attendance | undefined;
  staff: Staff | null | undefined;
  logger: Logger;
  shouldFetchAttendance: boolean;
  shouldFetchAttendanceErrors: boolean;
  refetchAttendance: () => Promise<unknown>;
  refetchAttendances: () => Promise<unknown>;
};

const LOCAL_ATTENDANCE_UPDATE_IGNORE_MS = 3000;

export function useAttendanceActions({
  attendance,
  staff,
  logger,
  shouldFetchAttendance,
  shouldFetchAttendanceErrors,
  refetchAttendance,
  refetchAttendances,
}: UseAttendanceActionsParams) {
  const { cognitoUser } = useContext(AuthContext);
  const { getStartTime, getEndTime } = useContext(AppConfigContext);
  const dispatch = useDispatch();

  const [upsertAttendanceMutation] =
    useUpsertAttendanceByStaffAndDateMutation();
  const [updateAttendanceMutation] = useUpdateAttendanceMutation();
  const localAttendanceUpdateIgnoreUntilRef = useRef(0);

  const resolveUpsertAction = useCallback(
    (input: CreateAttendanceInput): AttendanceUpsertAction => {
      if (input.goDirectlyFlag) return "go_directly";
      if (input.returnDirectlyFlag) return "return_directly";
      if (input.startTime) return "clock_in";
      if (input.endTime) return "clock_out";
      const rests = input.rests ?? [];
      if (rests.some((rest) => Boolean(rest?.startTime) && !rest?.endTime)) {
        return "rest_start";
      }
      if (rests.some((rest) => Boolean(rest?.endTime))) {
        return "rest_end";
      }
      return "manual";
    },
    [],
  );

  const resolveOccurredAtFromCreateInput = useCallback(
    (input: CreateAttendanceInput) =>
      input.startTime ??
      input.endTime ??
      input.rests?.find((rest) => rest?.startTime)?.startTime ??
      input.rests?.find((rest) => rest?.endTime)?.endTime ??
      getNowISOStringWithZeroSeconds(),
    [],
  );

  const createAttendance = useCallback(
    (input: CreateAttendanceInput) => {
      const occurredAt = resolveOccurredAtFromCreateInput(input);
      const action = resolveUpsertAction(input);
      const idempotencyKey = buildAttendanceIdempotencyKey({
        action,
        staffId: input.staffId,
        occurredAt,
      });
      return upsertAttendanceMutation({
        input,
        action,
        occurredAt,
        idempotencyKey,
      }).unwrap();
    },
    [
      resolveOccurredAtFromCreateInput,
      resolveUpsertAction,
      upsertAttendanceMutation,
    ],
  );

  const updateAttendance = useCallback(
    (input: Parameters<typeof updateAttendanceMutation>[0]) => {
      localAttendanceUpdateIgnoreUntilRef.current =
        Date.now() + LOCAL_ATTENDANCE_UPDATE_IGNORE_MS;
      return updateAttendanceMutation(input).unwrap();
    },
    [updateAttendanceMutation],
  );

  const refreshAttendanceData = useCallback(async () => {
    if (!shouldFetchAttendance) {
      return;
    }
    await refetchAttendance();
    if (shouldFetchAttendanceErrors) {
      await refetchAttendances();
    }
  }, [
    refetchAttendance,
    refetchAttendances,
    shouldFetchAttendance,
    shouldFetchAttendanceErrors,
  ]);

  const runAttendanceActionWithRefresh = useCallback(
    async <T,>(action: () => Promise<T>) => {
      const result = await action();
      await refreshAttendanceData();
      return result;
    },
    [refreshAttendanceData],
  );

  const clockIn = useCallback(
    (
      staffId: string,
      workDate: string,
      startTime: string,
      goDirectlyFlag = GoDirectlyFlag.NO,
    ) =>
      runAttendanceActionWithRefresh(() =>
        clockInAction({
          attendance,
          staffId,
          workDate,
          startTime,
          goDirectlyFlag,
          createAttendance,
          updateAttendance,
        }),
      ),
    [
      attendance,
      createAttendance,
      runAttendanceActionWithRefresh,
      updateAttendance,
    ],
  );

  const clockOut = useCallback(
    (
      staffId: string,
      workDate: string,
      endTime: string,
      returnDirectlyFlag = ReturnDirectlyFlag.NO,
    ) =>
      runAttendanceActionWithRefresh(() =>
        clockOutAction({
          attendance,
          staffId,
          workDate,
          endTime,
          returnDirectlyFlag,
          createAttendance,
          updateAttendance,
        }),
      ),
    [
      attendance,
      createAttendance,
      runAttendanceActionWithRefresh,
      updateAttendance,
    ],
  );

  const restStart = useCallback(
    (staffId: string, workDate: string, startTime: string) =>
      runAttendanceActionWithRefresh(() =>
        restStartAction({
          attendance,
          staffId,
          workDate,
          time: startTime,
          createAttendance,
          updateAttendance,
        }),
      ),
    [
      attendance,
      createAttendance,
      runAttendanceActionWithRefresh,
      updateAttendance,
    ],
  );

  const restEnd = useCallback(
    (staffId: string, workDate: string, endTime: string) =>
      runAttendanceActionWithRefresh(() =>
        restEndAction({
          attendance,
          staffId,
          workDate,
          time: endTime,
          createAttendance,
          updateAttendance,
        }),
      ),
    [
      attendance,
      createAttendance,
      runAttendanceActionWithRefresh,
      updateAttendance,
    ],
  );

  const handleClockIn = useCallback(() => {
    const occurredAt = getNowISOStringWithZeroSeconds();
    return clockInCallback(
      cognitoUser as CognitoUser,
      clockIn,
      dispatch,
      staff,
      logger,
      occurredAt,
    );
  }, [clockIn, cognitoUser, dispatch, logger, staff]);

  const handleClockOut = useCallback(() => {
    const occurredAt = getNowISOStringWithZeroSeconds();
    return clockOutCallback(
      cognitoUser as CognitoUser,
      clockOut,
      dispatch,
      staff,
      logger,
      undefined,
      occurredAt,
    );
  }, [clockOut, cognitoUser, dispatch, logger, staff]);

  const handleGoDirectly = useCallback(() => {
    const occurredAt = getNowISOStringWithZeroSeconds();
    const startIso = toConfiguredTimeISO(occurredAt, getStartTime());
    return goDirectlyCallback(
      cognitoUser as CognitoUser,
      staff,
      dispatch,
      clockIn,
      logger,
      startIso,
      occurredAt,
    );
  }, [cognitoUser, clockIn, dispatch, staff, logger, getStartTime]);

  const handleReturnDirectly = useCallback(() => {
    const occurredAt = getNowISOStringWithZeroSeconds();
    const endIso = toConfiguredTimeISO(occurredAt, getEndTime());
    return returnDirectlyCallback(
      cognitoUser as CognitoUser,
      staff,
      dispatch,
      clockOut,
      logger,
      endIso,
      occurredAt,
    );
  }, [cognitoUser, staff, dispatch, clockOut, logger, getEndTime]);

  const handleRestStart = useCallback(() => {
    const occurredAt = getNowISOStringWithZeroSeconds();
    return restStartCallback(
      cognitoUser as CognitoUser,
      dispatch,
      restStart,
      logger,
      occurredAt,
    );
  }, [cognitoUser, dispatch, logger, restStart]);

  const handleRestEnd = useCallback(() => {
    const occurredAt = getNowISOStringWithZeroSeconds();
    return restEndCallback(
      cognitoUser as CognitoUser,
      restEnd,
      dispatch,
      logger,
      occurredAt,
    );
  }, [cognitoUser, dispatch, logger, restEnd]);

  return {
    localAttendanceUpdateIgnoreUntilRef,
    refreshAttendanceData,
    handleClockIn,
    handleClockOut,
    handleGoDirectly,
    handleReturnDirectly,
    handleRestStart,
    handleRestEnd,
  };
}
