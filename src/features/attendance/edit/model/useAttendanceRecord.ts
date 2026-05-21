import { useLazyGetAttendanceByStaffAndDateQuery } from "@entities/attendance/api/attendanceApi";
import { AttendanceDateTime } from "@entities/attendance/lib/AttendanceDateTime";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import { mappingStaffRole, StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { AttendanceEditInputs, defaultValues, HourlyPaidHolidayTimeInputs, RestInputs, } from "@features/attendance/edit/model/common";
import { AttendanceHistory, } from "@shared/api/graphql/types";
import { Logger } from "@shared/lib/logger";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UseFormReset, UseFormSetValue, } from "react-hook-form";
import { useDispatch } from "react-redux";

import * as MESSAGE_CODE from "@/errors";

type ReplaceFn<T> = (value: T[]) => void;
type UseAttendanceRecordParams = {
    targetStaffId?: string;
    targetWorkDate?: string;
    readOnly?: boolean;
    setValue: UseFormSetValue<AttendanceEditInputs>;
    reset: UseFormReset<AttendanceEditInputs>;
    restReplace: ReplaceFn<RestInputs>;
    hourlyPaidHolidayTimeReplace: ReplaceFn<HourlyPaidHolidayTimeInputs>;
    logger: Logger;
};
type FetchStaffResult = Awaited<ReturnType<typeof fetchStaff>>;
const mapFetchedStaffToStaffType = (staff: FetchStaffResult): StaffType => ({
    id: staff.id,
    cognitoUserId: staff.cognitoUserId,
    familyName: staff.familyName,
    givenName: staff.givenName,
    mailAddress: staff.mailAddress,
    owner: staff.owner ?? false,
    role: mappingStaffRole(staff.role),
    enabled: staff.enabled,
    status: staff.status,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
    usageStartDate: staff.usageStartDate,
    notifications: staff.notifications,
    workType: staff.workType,
});
const hasSameStaffSnapshot = (next: StaffType | null | undefined, prev: StaffType | null | undefined) => {
    if (!next || !prev) {
        return false;
    }
    return (next.id === prev.id &&
        next.updatedAt === prev.updatedAt &&
        next.status === prev.status &&
        next.role === prev.role &&
        next.mailAddress === prev.mailAddress);
};
export const useAttendanceRecord = ({ targetStaffId, targetWorkDate, readOnly, setValue, reset, restReplace, hourlyPaidHolidayTimeReplace, logger, }: UseAttendanceRecordParams) => {
    const dispatch = useDispatch();
    const [triggerGetAttendance, { data: attendanceData }] = useLazyGetAttendanceByStaffAndDateQuery();
    const attendance = attendanceData ?? null;
    const hasAttendanceFetched = attendanceData !== undefined;
    const [staff, setStaff] = useState<StaffType | undefined | null>(undefined);
    const [workDate, setWorkDate] = useState<dayjs.Dayjs | null>(null);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [historiesLoading, setHistoriesLoading] = useState(false);
    const staffCacheRef = useRef<Map<string, StaffType | null>>(new Map());
    const staffRequestIdRef = useRef(0);
    const attendanceRequestIdRef = useRef(0);
    const sortedHistories = useMemo<AttendanceHistory[]>(() => {
        if (!attendance?.histories)
            return [];
        return attendance.histories
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .toSorted((a, b) => dayjs(b.createdAt).isBefore(dayjs(a.createdAt)) ? -1 : 1) as AttendanceHistory[];
    }, [attendance?.histories]);
    const applyHistory = useCallback((index: number) => {
        if (!sortedHistories || !sortedHistories[index])
            return;
        const h = sortedHistories[index];
        try {
            setValue("startTime", h.startTime ?? "");
            setValue("endTime", h.endTime ?? "");
            setValue("goDirectlyFlag", h.goDirectlyFlag ?? false);
            setValue("returnDirectlyFlag", h.returnDirectlyFlag ?? false);
            setValue("paidHolidayFlag", h.paidHolidayFlag ?? false);
            setValue("specialHolidayFlag", h.specialHolidayFlag ?? false);
            setValue("remarks", h.remarks ?? "");
            setValue("substituteHolidayDate", h.substituteHolidayDate ?? undefined);
            const rests: RestInputs[] = h.rests
                ? h.rests
                    .filter((r): r is NonNullable<typeof r> => r !== null)
                    .map((r) => ({
                    startTime: r.startTime ?? null,
                    endTime: r.endTime ?? null,
                }))
                : [];
            restReplace(rests);
            const hourly: HourlyPaidHolidayTimeInputs[] = h.hourlyPaidHolidayTimes
                ? h.hourlyPaidHolidayTimes
                    .filter((r): r is NonNullable<typeof r> => r !== null)
                    .map((r) => ({
                    startTime: r.startTime ?? null,
                    endTime: r.endTime ?? null,
                }))
                : [];
            hourlyPaidHolidayTimeReplace(hourly);
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to apply history to form:", e);
        }
    }, [sortedHistories, setValue, restReplace, hourlyPaidHolidayTimeReplace]);
    useEffect(() => {
        if (!sortedHistories || sortedHistories.length === 0)
            return;
        setHistoryIndex(0);
    }, [sortedHistories.length]);
    useEffect(() => {
        if (!sortedHistories || sortedHistories.length === 0)
            return;
        applyHistory(historyIndex);
    }, [historyIndex, sortedHistories, applyHistory]);
    useEffect(() => {
        if (!readOnly)
            return;
        if (!sortedHistories || sortedHistories.length === 0)
            return;
        try {
            applyHistory(0);
            setHistoryIndex(0);
        }
        catch {
            // noop
        }
    }, [readOnly, sortedHistories.length, applyHistory]);
    useEffect(() => {
        if (!readOnly)
            return;
        if (!attendance)
            return;
        if (!sortedHistories || sortedHistories.length === 0)
            return;
        const id = window.setTimeout(() => {
            try {
                applyHistory(0);
                setHistoryIndex(0);
            }
            catch {
                // noop
            }
        }, 0);
        return () => window.clearTimeout(id);
    }, [attendance, readOnly, sortedHistories.length, applyHistory]);
    useEffect(() => {
        if (!targetStaffId) {
            setStaff(null);
            return;
        }
        const requestId = staffRequestIdRef.current + 1;
        staffRequestIdRef.current = requestId;
        if (staffCacheRef.current.has(targetStaffId)) {
            setStaff(staffCacheRef.current.get(targetStaffId) ?? null);
        }
        else {
            setStaff(undefined);
        }
        fetchStaff(targetStaffId)
            .then((res) => {
            if (staffRequestIdRef.current !== requestId) {
                return;
            }
            const nextStaff = mapFetchedStaffToStaffType(res);
            const prevStaff = staffCacheRef.current.get(targetStaffId) ?? null;
            staffCacheRef.current.set(targetStaffId, nextStaff);
            if (hasSameStaffSnapshot(nextStaff, prevStaff)) {
                return;
            }
            setStaff(nextStaff);
        })
            .catch((e) => {
            logger.error(`Failed to fetch staff with ID ${targetStaffId}: ${e.message}`);
            if (staffRequestIdRef.current !== requestId) {
                return;
            }
            staffCacheRef.current.delete(targetStaffId);
            setStaff(null);
            dispatch(pushNotification({
                tone: "error",
                message: MESSAGE_CODE.E02001
            }));
        });
    }, [dispatch, logger, targetStaffId]);
    useEffect(() => {
        if (!staff || !targetStaffId || !targetWorkDate)
            return;
        setWorkDate(AttendanceDateTime.convertToDayjs(targetWorkDate));
        const requestId = attendanceRequestIdRef.current + 1;
        attendanceRequestIdRef.current = requestId;
        setHistoriesLoading(true);
        triggerGetAttendance({
            staffId: staff.cognitoUserId,
            workDate: new AttendanceDateTime()
                .setDateString(targetWorkDate)
                .toDataFormat(),
        })
            .unwrap()
            .then((result) => {
            if (attendanceRequestIdRef.current !== requestId) {
                return;
            }
            if (!result) {
                reset({
                    ...defaultValues,
                    workDate: new AttendanceDateTime()
                        .setDateString(targetWorkDate)
                        .toDataFormat(),
                    histories: [],
                    changeRequests: [],
                    revision: undefined,
                });
            }
        })
            .catch(() => {
            if (attendanceRequestIdRef.current !== requestId) {
                return;
            }
            dispatch(pushNotification({
                tone: "error",
                message: MESSAGE_CODE.E02001
            }));
        })
            .finally(() => {
            if (attendanceRequestIdRef.current === requestId) {
                setHistoriesLoading(false);
            }
        });
    }, [
        staff,
        targetStaffId,
        targetWorkDate,
        triggerGetAttendance,
        dispatch,
        reset,
    ]);
    useEffect(() => {
        if (!attendance)
            return;
        setWorkDate(AttendanceDateTime.convertToDayjs(attendance.workDate));
        const initTags: string[] = [];
        if (attendance.paidHolidayFlag)
            initTags.push("有給休暇");
        if (attendance.specialHolidayFlag)
            initTags.push("特別休暇");
        if (attendance.absentFlag)
            initTags.push("欠勤");
        const rests = attendance.rests
            ? attendance.rests
                .filter((item): item is NonNullable<typeof item> => item !== null)
                .map((item) => ({ startTime: item.startTime, endTime: item.endTime }))
            : [];
        const hourlyPaidHolidayTimes = attendance.hourlyPaidHolidayTimes
            ? attendance.hourlyPaidHolidayTimes
                .filter((item): item is NonNullable<typeof item> => item !== null)
                .map((item) => ({ startTime: item.startTime, endTime: item.endTime }))
            : [];
        const histories = attendance.histories
            ? attendance.histories.filter((item): item is NonNullable<typeof item> => item !== null)
            : [];
        const changeRequests = attendance.changeRequests
            ? attendance.changeRequests.filter((item): item is NonNullable<typeof item> => item !== null)
            : [];
        reset({
            workDate: attendance.workDate,
            startTime: attendance.startTime,
            isDeemedHoliday: attendance.isDeemedHoliday ?? false,
            specialHolidayFlag: attendance.specialHolidayFlag ?? false,
            endTime: attendance.endTime,
            remarks: attendance.remarks || "",
            remarkTags: initTags,
            goDirectlyFlag: attendance.goDirectlyFlag || false,
            returnDirectlyFlag: attendance.returnDirectlyFlag || false,
            paidHolidayFlag: attendance.paidHolidayFlag || false,
            absentFlag: attendance.absentFlag || false,
            substituteHolidayDate: attendance.substituteHolidayDate,
            revision: attendance.revision,
            rests,
            hourlyPaidHolidayTimes,
            histories,
            changeRequests,
        });
    }, [attendance, reset]);
    const refetchAttendance = useCallback(async () => {
        if (!staff || !targetWorkDate)
            return;
        setHistoriesLoading(true);
        try {
            await triggerGetAttendance({
                staffId: staff.cognitoUserId,
                workDate: new AttendanceDateTime()
                    .setDateString(targetWorkDate)
                    .toDataFormat(),
            }).unwrap();
        }
        catch (error) {
            logger.debug(`Failed to refetch attendance after update: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setHistoriesLoading(false);
        }
    }, [staff, targetWorkDate, triggerGetAttendance, logger]);
    return {
        attendance,
        staff,
        workDate,
        historiesLoading,
        sortedHistories,
        historyIndex,
        setHistoryIndex,
        applyHistory,
        refetchAttendance,
        hasAttendanceFetched,
    };
};
