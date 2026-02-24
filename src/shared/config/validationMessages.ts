export const validationMessages = {
  common: {
    required: "必須項目です。",
    invalidDate: "日付の形式が正しくありません。",
    invalidDateTime: "日時の形式が正しくありません。",
  },
  attendance: {
    workTime: {
      startRequired: "出勤時刻を入力してください。",
      endRequired: "退勤時刻を入力してください。",
      range: "退勤時刻は出勤時刻より後にしてください。",
    },
    rest: {
      incomplete: "休憩時間は開始と終了を両方入力してください。",
      range: "休憩終了は開始より後にしてください。",
    },
    hourlyPaidHoliday: {
      incomplete: "時間単位休暇は開始と終了を両方入力してください。",
      range: "時間単位休暇の終了時刻は開始より後にしてください。",
    },
    substituteHoliday: {
      invalidDate: "振替休日の日付形式が正しくありません。",
      workTimeNotAllowed:
        "振替休日を設定している場合は勤務時間や休憩を入力できません。クリアしてください。",
    },
    overtime: {
      notRequested: "業務終了時間を超過しています。残業申請が必要です。",
      exceededApprovedTime: "残業申請の終了時刻を超過しています。",
    },
  },
  workflow: {
    paidLeave: {
      dateRequired: "開始日と終了日を入力してください",
      dateRange: "開始日は終了日以前にしてください",
    },
    absence: {
      dateRequired: "欠勤日を入力してください",
    },
    overtime: {
      dateRequired: "残業予定日を入力してください",
      timeRequired: "開始時刻と終了時刻を入力してください",
      timeRange: "開始時刻は終了時刻より前にしてください",
    },
    clockCorrection: {
      dateRequired: "対象日を入力してください",
      clockInRequired: "出勤時間を入力してください",
      clockOutRequired: "退勤時間を入力してください",
    },
  },
} as const;

export type ValidationMessages = typeof validationMessages;
