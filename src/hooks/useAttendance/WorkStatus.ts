import { Attendance } from "../../API";

export enum WorkStatusCodes {
  PROCESSING = "PROCESSING",
  BEFORE_WORK = "BEFORE_WORK",
  WORKING = "WORKING",
  RESTING = "RESTING",
  LEFT_WORK = "LEFT_WORK",
  ERROR = "ERROR",
}

export enum WorkStatusTexts {
  PROCESSING = "処理中",
  BEFORE_WORK = "出勤前",
  WORKING = "勤務中",
  RESTING = "休憩中",
  LEFT_WORK = "勤務終了",
  ERROR = "エラー",
}

function isWorking(attendance: Attendance) {
  return !(!attendance.startTime || attendance.endTime);
}

function isResting(attendance: Attendance) {
  if (!attendance.rests || attendance.rests.length === 0) return false;

  const rests = attendance.rests.filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  const { startTime, endTime } = rests[rests.length - 1];
  return !(!startTime || endTime);
}

function isLeaveWork(attendance: Attendance) {
  return !(!attendance.startTime || !attendance.endTime);
}

export function getWorkStatus(attendance: Attendance | undefined | null) {
  if (attendance) {
    // 退勤済み
    if (isLeaveWork(attendance)) {
      return {
        code: WorkStatusCodes.LEFT_WORK,
        text: WorkStatusTexts.LEFT_WORK,
      };
    }

    // 休憩中
    if (isResting(attendance)) {
      return {
        code: WorkStatusCodes.RESTING,
        text: WorkStatusTexts.RESTING,
      };
    }

    // 勤務中
    if (isWorking(attendance)) {
      return {
        code: WorkStatusCodes.WORKING,
        text: WorkStatusTexts.WORKING,
      };
    }
  }

  return {
    code: WorkStatusCodes.BEFORE_WORK,
    text: WorkStatusTexts.BEFORE_WORK,
  };
}
