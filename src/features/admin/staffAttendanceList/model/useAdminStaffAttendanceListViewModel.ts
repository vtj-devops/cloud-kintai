import { type DuplicateAttendanceInfo, useListAttendancesByDateRangeQuery, useUpdateAttendanceMutation, } from "@entities/attendance/api/attendanceApi";
import { getAttendancePreviousMonthToCurrentMonthRangeInput } from "@entities/attendance/lib/attendanceQueryRange";
import { ChangeRequest, hasUnapprovedChangeRequest, } from "@entities/attendance/lib/ChangeRequest";
import useCloseDates from "@entities/attendance/model/useCloseDates";
import { AttendanceRowVariant, getAttendanceRowVariant, } from "@entities/attendance/ui/rowVariant";
import { useCalendars } from "@entities/calendar/model/useCalendars";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import { mappingStaffRole, StaffType, } from "@entities/staff/model/useStaffs/useStaffs";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { onCreateAttendance, onDeleteAttendance, onUpdateAttendance, } from "@shared/api/graphql/documents/subscriptions";
import { Attendance, CloseDate, CompanyHolidayCalendar, HolidayCalendar, OnCreateAttendanceSubscription, OnDeleteAttendanceSubscription, OnUpdateAttendanceSubscription, Staff, } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";

import * as MESSAGE_CODE from "@/errors";

import type { PendingAttendanceControls } from "../ui/components";
import { useAdminAttendanceChangeRequests } from "./useAdminAttendanceChangeRequests";

export type AdminStaffAttendanceListViewModel = ReturnType<typeof useAdminStaffAttendanceListViewModel>;
export const useAdminStaffAttendanceListViewModel = (staffId?: string, currentMonth?: Dayjs) => {
    const dispatch = useDispatch();
    const isBulkApprovingRef = useRef(false);
    const [staff, setStaff] = useState<Staff | undefined | null>(undefined);
    const { holidayCalendars, companyHolidayCalendars, isLoading: calendarLoading, error: calendarsError, } = useCalendars();
    const { closeDates, loading: closeDatesLoading, error: closeDatesError, } = useCloseDates();
    // データ取得範囲の計算
    // 表示月に対して、その前月の1日から当月の末日までのデータを取得する
    // 例：今日が1月1日で1月を表示している場合 → 12月1日～1月31日のデータを取得
    // 例：2月を表示している場合 → 1月1日～2月28日のデータを取得
    const dateRange = useMemo(() => {
        return getAttendancePreviousMonthToCurrentMonthRangeInput(currentMonth);
    }, [currentMonth]);
    const shouldFetchAttendances = Boolean(staffId);
    const queryResult = useListAttendancesByDateRangeQuery({
        staffId: staffId ?? "",
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
    }, {
        skip: !shouldFetchAttendances,
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        refetchOnReconnect: true,
    });
    const { data: attendancesData, isLoading: isAttendancesInitialLoading, isUninitialized: isAttendancesUninitialized, error: attendancesError, refetch: refetchAttendances, } = queryResult;
    useEffect(() => {
        if (!staffId || !shouldFetchAttendances)
            return;
        let refetchTimer: ReturnType<typeof setTimeout> | null = null;
        const shouldRefetch = (eventStaffId?: string | null, workDate?: string | null) => {
            if (!eventStaffId || !workDate)
                return false;
            if (eventStaffId !== staffId)
                return false;
            const eventDate = dayjs(workDate);
            const start = dayjs(dateRange.startDate);
            const end = dayjs(dateRange.endDate);
            return eventDate.isBetween(start, end, "day", "[]");
        };
        const scheduleRefetch = () => {
            if (isBulkApprovingRef.current)
                return;
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
            next: ({ data }: {
                data?: OnCreateAttendanceSubscription;
            }) => {
                const attendance = data?.onCreateAttendance;
                if (!shouldRefetch(attendance?.staffId, attendance?.workDate)) {
                    return;
                }
                scheduleRefetch();
            },
        });
        const updateSubscription = graphqlClient
            .graphql({ query: onUpdateAttendance, authMode: "userPool" })
            .subscribe({
            next: ({ data }: {
                data?: OnUpdateAttendanceSubscription;
            }) => {
                const attendance = data?.onUpdateAttendance;
                if (!shouldRefetch(attendance?.staffId, attendance?.workDate)) {
                    return;
                }
                scheduleRefetch();
            },
        });
        const deleteSubscription = graphqlClient
            .graphql({ query: onDeleteAttendance, authMode: "userPool" })
            .subscribe({
            next: ({ data }: {
                data?: OnDeleteAttendanceSubscription;
            }) => {
                const attendance = data?.onDeleteAttendance;
                if (!shouldRefetch(attendance?.staffId, attendance?.workDate)) {
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
        staffId,
        shouldFetchAttendances,
        dateRange.startDate,
        dateRange.endDate,
        refetchAttendances,
    ]);
    // 日付範囲内のすべての日付に対してAttendanceを生成（空の日も含む）
    const attendances: Attendance[] = useMemo(() => {
        // 実際にデータがあるAttendanceのみを返す（登録なしは含めない）
        return attendancesData ?? [];
    }, [attendancesData]);
    // 重複チェック
    const duplicateAttendances: DuplicateAttendanceInfo[] = useMemo(() => {
        const duplicateMap = new Map<string, Attendance[]>();
        (attendancesData ?? []).forEach((attendance) => {
            const existing = duplicateMap.get(attendance.workDate) ?? [];
            existing.push(attendance);
            duplicateMap.set(attendance.workDate, existing);
        });
        const duplicates: DuplicateAttendanceInfo[] = [];
        duplicateMap.forEach((matches, workDate) => {
            if (matches.length > 1) {
                duplicates.push({
                    workDate,
                    ids: matches.map((a) => a.id).filter(Boolean),
                    staffId: staffId ?? "",
                });
            }
        });
        return duplicates;
    }, [attendancesData, staffId]);
    const attendanceLoading = (!shouldFetchAttendances ||
        isAttendancesUninitialized ||
        (isAttendancesInitialLoading && !attendancesData)) &&
        !attendancesError;
    const [updateAttendanceMutation] = useUpdateAttendanceMutation();
    useEffect(() => {
        if (!staffId)
            return;
        fetchStaff(staffId)
            .then(setStaff)
            .catch(() => {
            // staffの取得に失敗しても、勤怠データがあれば表示できるように警告として扱う
            setStaff(null);
            dispatch(pushNotification({
                tone: "error",
                message: "スタッフ情報の取得に失敗しましたが、勤怠データは表示されます。(エラーコード: E00001)"
            }));
        });
    }, [staffId, dispatch]);
    useEffect(() => {
        if (attendancesError) {
            // エラーメッセージから重複データエラー（E02004）かどうかを判定
            const errorMessage = typeof attendancesError === "object" &&
                attendancesError !== null &&
                "message" in attendancesError
                ? (attendancesError as {
                    message?: string;
                }).message
                : undefined;
            // 重複データエラーの場合は詳細なエラーメッセージを表示
            if (errorMessage && errorMessage.includes("E02004")) {
                dispatch(pushNotification({
                    tone: "error",
                    message: errorMessage
                }));
            }
            else {
                // その他のエラーの場合は汎用的なエラーメッセージを表示
                dispatch(pushNotification({
                    tone: "error",
                    message: MESSAGE_CODE.E02001
                }));
            }
        }
    }, [attendancesError, dispatch]);
    useEffect(() => {
        if (calendarsError) {
            console.error(calendarsError);
            dispatch(pushNotification({
                tone: "error",
                message: MESSAGE_CODE.E00001
            }));
        }
    }, [calendarsError, dispatch]);
    const staffForMail = useMemo<StaffType | null>(() => {
        if (!staff)
            return null;
        return {
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
            sortKey: staff.sortKey,
            developer: (staff as unknown as Record<string, unknown>).developer as boolean | undefined,
            approverSetting: staff.approverSetting ?? null,
            approverSingle: staff.approverSingle ?? null,
            approverMultiple: staff.approverMultiple ?? null,
            approverMultipleMode: staff.approverMultipleMode ?? null,
            shiftGroup: staff.shiftGroup ?? null,
        } satisfies StaffType;
    }, [staff]);
    const pendingAttendances = useMemo(() => {
        return attendances.filter((attendance: Attendance) => hasUnapprovedChangeRequest(attendance.changeRequests));
    }, [attendances]);
    const changeRequestControls = useAdminAttendanceChangeRequests({
        staffId,
        staff,
        staffForMail,
        pendingAttendances,
        updateAttendance: (input: Parameters<typeof updateAttendanceMutation>[0]) => updateAttendanceMutation(input).unwrap(),
        isBulkApprovingRef,
    });
    const pendingAttendanceControls = useMemo<PendingAttendanceControls>(() => ({
        selectedAttendanceIds: changeRequestControls.selectedAttendanceIds,
        isAttendanceSelected: changeRequestControls.isAttendanceSelected,
        toggleAttendanceSelection: changeRequestControls.toggleAttendanceSelection,
        toggleSelectAll: changeRequestControls.toggleSelectAllPending,
        bulkApproving: changeRequestControls.bulkApproving,
        canBulkApprove: changeRequestControls.canBulkApprove,
        onBulkApprove: changeRequestControls.handleBulkApprove,
        onOpenQuickView: changeRequestControls.handleOpenQuickView,
    }), [
        changeRequestControls.selectedAttendanceIds,
        changeRequestControls.isAttendanceSelected,
        changeRequestControls.toggleAttendanceSelection,
        changeRequestControls.toggleSelectAllPending,
        changeRequestControls.bulkApproving,
        changeRequestControls.canBulkApprove,
        changeRequestControls.handleBulkApprove,
        changeRequestControls.handleOpenQuickView,
    ]);
    const getTableRowVariant = useCallback((attendance: Attendance, holidayList: HolidayCalendar[] = holidayCalendars, companyHolidayList: CompanyHolidayCalendar[] = companyHolidayCalendars): AttendanceRowVariant => {
        if (staff?.workType === "shift" && attendance.isDeemedHoliday) {
            return "sunday";
        }
        if (staff?.workType === "shift") {
            return "default";
        }
        return getAttendanceRowVariant(attendance, holidayList, companyHolidayList);
    }, [staff, holidayCalendars, companyHolidayCalendars]);
    const getBadgeContent = useCallback((attendance: Attendance) => {
        return new ChangeRequest(attendance.changeRequests).getUnapprovedCount();
    }, []);
    return {
        staff,
        holidayCalendars,
        companyHolidayCalendars,
        calendarLoading,
        closeDates,
        closeDatesLoading,
        closeDatesError,
        attendances,
        duplicateAttendances,
        attendanceLoading,
        attendancesError,
        pendingAttendances,
        changeRequestControls,
        pendingAttendanceControls,
        getTableRowVariant,
        getBadgeContent,
    } satisfies {
        staff: Staff | undefined | null;
        holidayCalendars: HolidayCalendar[];
        companyHolidayCalendars: CompanyHolidayCalendar[];
        calendarLoading: boolean;
        closeDates: CloseDate[];
        closeDatesLoading: boolean;
        closeDatesError: Error | null;
        attendances: Attendance[];
        duplicateAttendances: typeof duplicateAttendances;
        attendanceLoading: boolean;
        attendancesError: unknown;
        pendingAttendances: Attendance[];
        changeRequestControls: ReturnType<typeof useAdminAttendanceChangeRequests>;
        pendingAttendanceControls: PendingAttendanceControls;
        getTableRowVariant: (attendance: Attendance, holidayList?: HolidayCalendar[], companyHolidayList?: CompanyHolidayCalendar[]) => AttendanceRowVariant;
        getBadgeContent: (attendance: Attendance) => number;
    };
};
