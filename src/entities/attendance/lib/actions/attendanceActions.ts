import { AttendanceDateTime } from "@entities/attendance/lib/AttendanceDateTime";
import {
  Attendance,
  CreateAttendanceInput,
  RestInput,
  UpdateAttendanceInput,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";

export enum GoDirectlyFlag {
  YES,
  NO,
}

export enum ReturnDirectlyFlag {
  YES,
  NO,
}

type MutationExecutor = {
  attendance: Attendance | null | undefined;
  createAttendance: (input: CreateAttendanceInput) => Promise<Attendance>;
  updateAttendance: (input: UpdateAttendanceInput) => Promise<Attendance>;
};

export type ClockInParams = MutationExecutor & {
  staffId: string;
  workDate: string;
  startTime: string;
  goDirectlyFlag?: GoDirectlyFlag;
};

export type ClockOutParams = MutationExecutor & {
  staffId: string;
  workDate: string;
  endTime: string;
  returnDirectlyFlag?: ReturnDirectlyFlag;
};

export type RestParams = MutationExecutor & {
  staffId: string;
  workDate: string;
  time: string;
};

export type UpdateRemarksParams = MutationExecutor & {
  staffId: string;
  workDate: string;
  remarks: string;
};

export async function clockInAction({
  attendance,
  staffId,
  workDate,
  startTime,
  goDirectlyFlag = GoDirectlyFlag.NO,
  createAttendance,
  updateAttendance,
}: ClockInParams) {
  if (attendance && attendance.workDate === workDate) {
    return updateAttendance({
      id: attendance.id,
      startTime,
      goDirectlyFlag: goDirectlyFlag === GoDirectlyFlag.YES,
      isDeemedHoliday: attendance.isDeemedHoliday,
      revision: attendance.revision,
    });
  }

  return createAttendance({
    staffId,
    workDate,
    startTime,
    goDirectlyFlag: goDirectlyFlag === GoDirectlyFlag.YES,
  });
}

export async function clockOutAction({
  attendance,
  staffId,
  workDate,
  endTime,
  returnDirectlyFlag = ReturnDirectlyFlag.NO,
  createAttendance,
  updateAttendance,
}: ClockOutParams) {
  if (attendance && attendance.workDate === workDate) {
    const startTime = dayjs(attendance.startTime);
    const noon = new AttendanceDateTime().setNoon().toDayjs();
    const isWorkStartBeforeNoon = startTime.isBefore(noon);
    const isWorkEndBeforeNoon = dayjs(endTime).isBefore(noon);

    const rests = (() => {
      const prevRests = attendance.rests
        ? attendance.rests
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .map(
              (item): RestInput => ({
                startTime: item.startTime,
                endTime: item.endTime,
              })
            )
        : [];

      if (!isWorkStartBeforeNoon || isWorkEndBeforeNoon) {
        return prevRests;
      }

      const lunchBreakStart = new AttendanceDateTime().setRestStart().toDayjs();
      const lunchBreakEnd = new AttendanceDateTime().setRestEnd().toDayjs();

      if (prevRests.length > 0) {
        return prevRests;
      }

      prevRests.push({
        startTime: lunchBreakStart.toISOString(),
        endTime: lunchBreakEnd.toISOString(),
      });

      return prevRests;
    })();

    return updateAttendance({
      id: attendance.id,
      endTime,
      returnDirectlyFlag: returnDirectlyFlag === ReturnDirectlyFlag.YES,
      rests,
      isDeemedHoliday: attendance.isDeemedHoliday,
      revision: attendance.revision,
    });
  }

  return createAttendance({
    staffId,
    workDate,
    endTime,
    returnDirectlyFlag: returnDirectlyFlag === ReturnDirectlyFlag.YES,
  });
}

export async function restStartAction({
  attendance,
  staffId,
  workDate,
  time,
  createAttendance,
  updateAttendance,
}: RestParams) {
  if (attendance && attendance.workDate === workDate) {
    if (!attendance.startTime) {
      throw new Error("Not clocked in");
    }

    const rests = attendance.rests
      ? attendance.rests
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .map(
            (item): RestInput => ({
              startTime: item.startTime,
              endTime: item.endTime,
            })
          )
      : [];

    const isMismatch =
      rests.filter((rest) => !rest.startTime || !rest.endTime).length > 0;
    if (isMismatch) {
      throw new Error("There is a problem with the rest time");
    }

    rests.push({ startTime: time });

    return updateAttendance({
      id: attendance.id,
      rests,
      isDeemedHoliday: attendance.isDeemedHoliday,
      revision: attendance.revision,
    });
  }

  return createAttendance({
    staffId,
    workDate,
    rests: [
      {
        startTime: time,
      },
    ],
  });
}

export async function restEndAction({
  attendance,
  staffId,
  workDate,
  time,
  createAttendance,
  updateAttendance,
}: RestParams) {
  if (attendance && attendance.workDate === workDate) {
    if (!attendance.startTime) {
      throw new Error("Not clocked in");
    }

    const rests = attendance.rests
      ? attendance.rests
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .map(
            (item): RestInput => ({
              startTime: item.startTime,
              endTime: item.endTime,
            })
          )
      : [];

    if (rests.length === 0) {
      throw new Error("There is no rest start");
    }

    const isMismatch =
      rests.filter((rest) => !rest.startTime || !rest.endTime).length >= 2;

    if (isMismatch) {
      throw new Error("There is a problem with the rest time");
    }

    const isLatestMismatch = !rests[rests.length - 1].startTime;

    if (isLatestMismatch) {
      throw new Error("There is a problem with the rest time");
    }

    rests[rests.length - 1].endTime = time;

    return updateAttendance({
      id: attendance.id,
      rests,
      revision: attendance.revision,
    });
  }

  return createAttendance({
    staffId,
    workDate,
    rests: [
      {
        endTime: time,
      },
    ],
  });
}

export async function updateRemarksAction({
  attendance,
  staffId,
  workDate,
  remarks,
  createAttendance,
  updateAttendance,
}: UpdateRemarksParams) {
  if (attendance && attendance.workDate === workDate) {
    return updateAttendance({
      id: attendance.id,
      remarks,
      isDeemedHoliday: attendance.isDeemedHoliday,
      revision: attendance.revision,
    });
  }

  return createAttendance({
    staffId,
    workDate,
    remarks,
  });
}
