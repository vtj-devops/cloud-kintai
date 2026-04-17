import { type AttendanceUpsertAction, useLazyGetAttendanceByStaffAndDateQuery, useUpdateAttendanceMutation, useUpsertAttendanceByStaffAndDateMutation, } from "@entities/attendance/api/attendanceApi";
import { clockInAction, clockOutAction, } from "@entities/attendance/lib/actions/attendanceActions";
import { resolveBusinessWorkDate, resolveCurrentBusinessWorkDate, } from "@entities/attendance/lib/businessDate";
import { buildAttendanceIdempotencyKey } from "@entities/attendance/lib/operationContext";
import { getNowISOStringWithZeroSeconds } from "@entities/attendance/lib/time";
import type { Attendance, CreateAttendanceInput, } from "@shared/api/graphql/types";
import { Logger } from "@shared/lib/logger";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";

import { AppConfigContext } from "@/context/AppConfigContext";
import { AuthContext } from "@/context/AuthContext";

import { validateOfficeQrToken } from "../lib/validateToken";

type ClockMode = "clock_in" | "clock_out" | null;
export function useOfficeQrRegister() {
    const dispatch = useDispatch();
    const logger = useMemo(() => new Logger("OfficeQrRegister", import.meta.env.DEV ? "DEBUG" : "ERROR"), []);
    const { getOfficeMode } = useContext(AppConfigContext);
    const { cognitoUser } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const [isOfficeModeEnabled, setIsOfficeModeEnabled] = useState(false);
    const [isValidToken, setIsValidToken] = useState(false);
    const [attendance, setAttendance] = useState<Attendance | null>(null);
    const [triggerGetAttendance, { error: fetchAttendanceError }] = useLazyGetAttendanceByStaffAndDateQuery();
    const [upsertAttendanceMutation] = useUpsertAttendanceByStaffAndDateMutation();
    const [updateAttendanceMutation] = useUpdateAttendanceMutation();
    const resolveUpsertAction = useCallback((input: CreateAttendanceInput): AttendanceUpsertAction => {
        if (input.goDirectlyFlag)
            return "go_directly";
        if (input.returnDirectlyFlag)
            return "return_directly";
        if (input.startTime)
            return "clock_in";
        if (input.endTime)
            return "clock_out";
        const rests = input.rests ?? [];
        if (rests.some((rest) => Boolean(rest?.startTime) && !rest?.endTime)) {
            return "rest_start";
        }
        if (rests.some((rest) => Boolean(rest?.endTime))) {
            return "rest_end";
        }
        return "manual";
    }, []);
    const resolveOccurredAtFromCreateInput = useCallback((input: CreateAttendanceInput) => input.startTime ??
        input.endTime ??
        input.rests?.find((rest) => rest?.startTime)?.startTime ??
        input.rests?.find((rest) => rest?.endTime)?.endTime ??
        getNowISOStringWithZeroSeconds(), []);
    const createAttendance = useCallback((input: CreateAttendanceInput) => {
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
    }, [
        resolveOccurredAtFromCreateInput,
        resolveUpsertAction,
        upsertAttendanceMutation,
    ]);
    const updateAttendance = useCallback((input: Parameters<typeof updateAttendanceMutation>[0]) => updateAttendanceMutation(input).unwrap(), [updateAttendanceMutation]);
    const modeParam = searchParams.get("mode");
    const qrMode: ClockMode = modeParam === "clock_in" || modeParam === "clock_out" ? modeParam : null;
    const timestamp = searchParams.get("timestamp");
    const token = searchParams.get("token");
    const [currentWorkDate, setCurrentWorkDate] = useState(() => resolveCurrentBusinessWorkDate());
    useEffect(() => {
        const intervalId = window.setInterval(() => {
            const nextWorkDate = resolveCurrentBusinessWorkDate();
            setCurrentWorkDate((prev) => prev === nextWorkDate ? prev : nextWorkDate);
        }, 30 * 1000);
        return () => {
            window.clearInterval(intervalId);
        };
    }, []);
    useEffect(() => {
        setIsOfficeModeEnabled(getOfficeMode());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        let isMounted = true;
        const validate = async () => {
            const isValid = await validateOfficeQrToken(timestamp, token);
            if (isMounted) {
                setIsValidToken(isValid);
            }
        };
        void validate();
        return () => {
            isMounted = false;
        };
    }, [timestamp, token]);
    useEffect(() => {
        if (!isOfficeModeEnabled || !cognitoUser?.id) {
            setAttendance(null);
            return;
        }
        let isMounted = true;
        triggerGetAttendance({ staffId: cognitoUser.id, workDate: currentWorkDate })
            .unwrap()
            .then((data) => {
            if (isMounted) {
                setAttendance(data ?? null);
            }
        })
            .catch((error) => {
            logger.debug("Failed to fetch attendance for office QR", error);
            dispatch(pushNotification({ tone: "error", message: "勤怠データの取得に失敗しました。" }));
        });
        return () => {
            isMounted = false;
        };
    }, [
        cognitoUser?.id,
        currentWorkDate,
        isOfficeModeEnabled,
        triggerGetAttendance,
        logger,
    ]);
    const handleClockIn = useCallback(async () => {
        if (!cognitoUser) {
            return;
        }
        const occurredAt = getNowISOStringWithZeroSeconds();
        const workDate = resolveBusinessWorkDate(occurredAt);
        buildAttendanceIdempotencyKey({
            action: "clock_in",
            staffId: cognitoUser.id,
            occurredAt,
        });
        try {
            const result = await clockInAction({
                attendance,
                staffId: cognitoUser.id,
                workDate,
                startTime: occurredAt,
                createAttendance,
                updateAttendance,
            });
            setAttendance(result);
            dispatch(pushNotification({
                tone: "success",
                message: "出勤が記録されました。"
            }));
        }
        catch (error) {
            logger.debug(error);
            dispatch(pushNotification({
                tone: "error",
                message: "出勤処理に失敗しました。"
            }));
        }
    }, [
        attendance,
        cognitoUser,
        createAttendance,
        dispatch,
        logger,
        updateAttendance,
    ]);
    const handleClockOut = useCallback(async () => {
        if (!cognitoUser) {
            return;
        }
        const occurredAt = getNowISOStringWithZeroSeconds();
        const workDate = resolveBusinessWorkDate(occurredAt);
        buildAttendanceIdempotencyKey({
            action: "clock_out",
            staffId: cognitoUser.id,
            occurredAt,
        });
        try {
            const result = await clockOutAction({
                attendance,
                staffId: cognitoUser.id,
                workDate,
                endTime: occurredAt,
                createAttendance,
                updateAttendance,
            });
            setAttendance(result);
            dispatch(pushNotification({
                tone: "success",
                message: "退勤が記録されました。"
            }));
        }
        catch (error) {
            logger.debug(error);
            dispatch(pushNotification({
                tone: "error",
                message: "退勤処理に失敗しました。"
            }));
        }
    }, [
        attendance,
        cognitoUser,
        createAttendance,
        dispatch,
        logger,
        updateAttendance,
    ]);
    const errorMessage = useMemo(() => {
        if (!isValidToken) {
            return "無効なトークンです。トークンの有効期限が切れている可能性があります。";
        }
        if (!qrMode) {
            return "無効なアクセスです。";
        }
        return null;
    }, [isValidToken, qrMode]);
    return {
        isOfficeModeEnabled,
        errorMessage,
        mode: qrMode,
        handleClockIn,
        handleClockOut,
        fetchAttendanceError,
    } as const;
}
