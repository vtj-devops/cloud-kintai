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

export interface WorkStatus {
  code: WorkStatusCodes;
  text: WorkStatusTexts;
}
