import {
  CreateAttendanceMutationArg,
  UpdateAttendanceMutationArg,
} from "@entities/attendance/api/attendanceApi.types";
import { AttendanceDateTime } from "@entities/attendance/lib/AttendanceDateTime";
import { resolveConfigTimeOnDate } from "@entities/attendance/lib/resolveConfigTimeOnDate";
import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import {
  AttendanceEditInputs,
  HourlyPaidHolidayTimeInputs,
} from "@features/attendance/edit/model/common";
import {
  Attendance,
  HourlyPaidHolidayTimeInput,
} from "@shared/api/graphql/types";
import { Logger } from "@shared/lib/logger";
import { AttendanceEditMailSender } from "@shared/lib/mail/AttendanceEditMailSender";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { Dayjs } from "dayjs";
import { useCallback } from "react";
import { useDispatch } from "react-redux";

import * as MESSAGE_CODE from "@/errors";

function buildHourlyPaidHolidayTimes(
  data: HourlyPaidHolidayTimeInputs[] | undefined,
): HourlyPaidHolidayTimeInput[] {
  if (!data) {
    return [];
  }

  return data.reduce<HourlyPaidHolidayTimeInput[]>((acc, item) => {
    if (item.startTime && item.endTime) {
      acc.push({
        startTime: item.startTime,
        endTime: item.endTime,
      });
    }
    return acc;
  }, []);
}

function buildPaidHolidayRests(baseDate: string) {
  return [
    {
      startTime: new AttendanceDateTime()
        .setDateString(baseDate)
        .setRestStart()
        .toISOString(),
      endTime: new AttendanceDateTime()
        .setDateString(baseDate)
        .setRestEnd()
        .toISOString(),
    },
  ];
}

type UseAttendanceSubmitProps = {
  attendance: Attendance | null;
  staff: StaffType | null | undefined;
  currentUserId?: string | null;
  enabledSendMail: boolean;
  handleUpdateAttendance: (
    input: UpdateAttendanceMutationArg,
  ) => Promise<Attendance | null | undefined>;
  handleCreateAttendance: (
    input: CreateAttendanceMutationArg,
  ) => Promise<Attendance | null | undefined>;
  targetStaffId?: string;
  targetWorkDate?: string;
  getStartTime: () => Dayjs;
  getEndTime: () => Dayjs;
  attendanceListPath: string;
  overtimeError: string | null;
  logger: Logger;
  navigateToAttendanceList: () => void;
  setSubmitError: (message: string) => void;
  clearSubmitError: () => void;
};

export function useAttendanceSubmit({
  attendance,
  staff,
  currentUserId,
  enabledSendMail,
  handleUpdateAttendance,
  handleCreateAttendance,
  targetStaffId,
  targetWorkDate,
  getStartTime,
  getEndTime,
  attendanceListPath,
  overtimeError,
  logger,
  navigateToAttendanceList,
  setSubmitError,
  clearSubmitError,
}: UseAttendanceSubmitProps) {
  const dispatch = useDispatch();

  const onSubmit = useCallback(
    async (data: AttendanceEditInputs) => {
      clearSubmitError();

      if (overtimeError) {
        dispatch(
          pushNotification({
            tone: "error",
            message: overtimeError,
          }),
        );
        return;
      }

      if (attendance) {
        const payload: UpdateAttendanceMutationArg = {
          id: attendance.id,
          staffId: attendance.staffId,
          workDate: data.workDate,
          startTime: data.paidHolidayFlag
            ? resolveConfigTimeOnDate(
                getStartTime(),
                data.workDate as string | null | undefined,
                attendance.workDate,
                targetWorkDate,
              )
            : data.startTime,
          endTime: data.paidHolidayFlag
            ? resolveConfigTimeOnDate(
                getEndTime(),
                data.workDate as string | null | undefined,
                attendance.workDate,
                targetWorkDate,
              )
            : data.endTime || null,
          absentFlag: data.absentFlag ?? false,
          isDeemedHoliday: data.isDeemedHoliday,
          goDirectlyFlag: data.goDirectlyFlag,
          returnDirectlyFlag: data.returnDirectlyFlag,
          remarks: data.remarks,
          revision: data.revision,
          paidHolidayFlag: data.paidHolidayFlag,
          specialHolidayFlag: data.specialHolidayFlag,
          substituteHolidayDate: data.substituteHolidayDate,
          rests: data.paidHolidayFlag
            ? buildPaidHolidayRests(
                (data.workDate as string) || attendance.workDate || "",
              )
            : (data.rests || []).map((rest) => ({
                startTime: rest.startTime,
                endTime: rest.endTime,
              })),
          systemComments: (data.systemComments || []).map(
            ({ comment, confirmed, createdAt }) => ({
              comment,
              confirmed,
              createdAt,
            }),
          ),
          hourlyPaidHolidayTimes: data.paidHolidayFlag
            ? []
            : buildHourlyPaidHolidayTimes(data.hourlyPaidHolidayTimes),
          logContext: {
            action: "attendance.update",
          },
        };

        try {
          const res = await handleUpdateAttendance(payload);

          try {
            const isEditingOtherStaff =
              !!staff && !!currentUserId && staff.cognitoUserId !== currentUserId;
            if (isEditingOtherStaff && res && enabledSendMail) {
              await new AttendanceEditMailSender(staff, res).changeRequest();
            }
          } catch (mailError) {
            logger.error(`Failed to send edit mail: ${mailError}`);
          }

          dispatch(
            pushNotification({
              tone: "success",
              message: MESSAGE_CODE.S04001,
            }),
          );
          navigateToAttendanceList();
        } catch (error) {
          setSubmitError(MESSAGE_CODE.E04001);
          logger.error("Update attendance error:", error);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error(`Error details: ${errorMessage}`);
          dispatch(
            pushNotification({
              tone: "error",
              message: MESSAGE_CODE.E04001,
            }),
          );
        }
        return;
      }

      if (!targetStaffId || !targetWorkDate) {
        setSubmitError(MESSAGE_CODE.E04001);
        dispatch(
          pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E04001,
          }),
        );
        return;
      }

      try {
        const res = await handleCreateAttendance({
          staffId: targetStaffId,
          workDate: new AttendanceDateTime()
            .setDateString(targetWorkDate)
            .toDataFormat(),
          startTime: data.paidHolidayFlag
            ? resolveConfigTimeOnDate(
                getStartTime(),
                data.workDate as string | null | undefined,
                targetWorkDate,
              )
            : data.startTime,
          absentFlag: data.absentFlag ?? false,
          isDeemedHoliday: data.isDeemedHoliday,
          endTime: data.paidHolidayFlag
            ? resolveConfigTimeOnDate(
                getEndTime(),
                data.workDate as string | null | undefined,
                targetWorkDate,
              )
            : data.endTime,
          goDirectlyFlag: data.goDirectlyFlag,
          returnDirectlyFlag: data.returnDirectlyFlag,
          remarks: data.remarks,
          specialHolidayFlag: data.specialHolidayFlag,
          paidHolidayFlag: data.paidHolidayFlag,
          substituteHolidayDate: data.substituteHolidayDate,
          rests: data.paidHolidayFlag
            ? buildPaidHolidayRests(targetWorkDate)
            : (data.rests || []).map((rest) => ({
                startTime: rest.startTime,
                endTime: rest.endTime,
              })),
          systemComments: (data.systemComments || []).map(
            ({ comment, confirmed, createdAt }) => ({
              comment,
              confirmed,
              createdAt,
            }),
          ),
          hourlyPaidHolidayTimes: data.paidHolidayFlag
            ? []
            : buildHourlyPaidHolidayTimes(data.hourlyPaidHolidayTimes),
          logContext: {
            action: "attendance.create",
          },
        });

        if (!staff) {
          return;
        }

        if (enabledSendMail) {
          try {
            const isEditingOtherStaff =
              !!currentUserId && staff.cognitoUserId !== currentUserId;
            if (isEditingOtherStaff && res) {
              await new AttendanceEditMailSender(staff, res).changeRequest();
            }
          } catch (mailError) {
            logger.error(`Failed to send create mail: ${mailError}`);
          }
        }

        dispatch(
          pushNotification({
            tone: "success",
            message: MESSAGE_CODE.S04001,
          }),
        );
        navigateToAttendanceList();
      } catch (error) {
        setSubmitError(MESSAGE_CODE.E04001);
        logger.error("Create attendance error:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(`Error details: ${errorMessage}`);
        dispatch(
          pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E04001,
          }),
        );
      }
    },
    [
      attendance,
      attendanceListPath,
      currentUserId,
      dispatch,
      enabledSendMail,
      getEndTime,
      getStartTime,
      handleCreateAttendance,
      handleUpdateAttendance,
      logger,
      navigateToAttendanceList,
      overtimeError,
      setSubmitError,
      clearSubmitError,
      staff,
      targetStaffId,
      targetWorkDate,
    ],
  );

  return {
    onSubmit,
  };
}