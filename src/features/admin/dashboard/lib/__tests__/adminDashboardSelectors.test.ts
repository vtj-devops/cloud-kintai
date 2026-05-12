import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";

import {
  buildAggregationPeriodInfoLabel,
  buildStaffIdentityMaps,
  buildStaffWorkStatusChartData,
  buildStaffWorkStatusChartOptions,
  buildStaffWorkStatusSummary,
  countDuplicateAttendanceDays,
  isAttendanceCurrentWorking,
} from "../adminDashboardSelectors";

// ---------------------------------------------------------------------------
// テスト用ヘルパー
// ---------------------------------------------------------------------------
const makeAttendance = (overrides: Record<string, unknown> = {}) => ({
  __typename: "Attendance" as const,
  id: "att-1",
  staffId: "staff-1",
  staffWorkDateKey: "staff-1#2024-06-10",
  workDate: "2024-06-10",
  startTime: "2024-06-10T09:00:00+09:00",
  endTime: "2024-06-10T18:00:00+09:00",
  goDirectlyFlag: false,
  returnDirectlyFlag: false,
  absentFlag: false,
  rests: [],
  hourlyPaidHolidayTimes: [],
  remarks: null,
  paidHolidayFlag: false,
  specialHolidayFlag: false,
  isDeemedHoliday: false,
  hourlyPaidHolidayHours: null,
  substituteHolidayDate: null,
  histories: [],
  changeRequests: [],
  systemComments: [],
  revision: 1,
  createdAt: "2024-06-10T09:00:00.000Z",
  updatedAt: "2024-06-10T18:00:00.000Z",
  ...overrides,
});

const makeStaff = (overrides: Record<string, unknown> = {}) => ({
  id: "staff-1",
  cognitoUserId: "cognito-1",
  familyName: "山田",
  givenName: "太郎",
  mailAddress: "yamada@example.com",
  owner: false,
  role: StaffRole.STAFF,
  enabled: true,
  status: "active",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  version: 1,
  usageStartDate: null,
  notifications: null,
  externalLinks: null,
  sortKey: null,
  workType: null,
  developer: false,
  approverSetting: null,
  approverSingle: null,
  approverMultiple: null,
  approverMultipleMode: null,
  shiftGroup: null,
  attendanceManagementEnabled: true,
  ...overrides,
});

// ---------------------------------------------------------------------------
// isAttendanceCurrentWorking
// ---------------------------------------------------------------------------
describe("isAttendanceCurrentWorking", () => {
  it("startTime があり endTime がない場合（勤務中）、true を返すこと", () => {
    const att = makeAttendance({
      startTime: "2024-06-10T09:00:00+09:00",
      endTime: null,
    });
    expect(isAttendanceCurrentWorking(att)).toBe(true);
  });

  it("startTime があり endTime もある場合（勤務終了）、false を返すこと", () => {
    const att = makeAttendance({
      startTime: "2024-06-10T09:00:00+09:00",
      endTime: "2024-06-10T18:00:00+09:00",
    });
    expect(isAttendanceCurrentWorking(att)).toBe(false);
  });

  it("startTime も endTime もない場合（出勤前）、false を返すこと", () => {
    const att = makeAttendance({ startTime: null, endTime: null });
    expect(isAttendanceCurrentWorking(att)).toBe(false);
  });

  it("休憩中（rests の最後の要素に startTime があり endTime がない）の場合、true を返すこと", () => {
    const att = makeAttendance({
      startTime: "2024-06-10T09:00:00+09:00",
      endTime: null,
      rests: [{ startTime: "2024-06-10T12:00:00+09:00", endTime: null }],
    });
    expect(isAttendanceCurrentWorking(att)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildStaffIdentityMaps
// ---------------------------------------------------------------------------
describe("buildStaffIdentityMaps", () => {
  it("スタッフIDから表示名へのマップを構築すること", () => {
    const staffs = [makeStaff()];
    const { staffLabelsById } = buildStaffIdentityMaps(staffs);
    expect(staffLabelsById["staff-1"]).toBe("山田 太郎");
  });

  it("cognitoUserId も canonicalStaffId にマップすること", () => {
    const staffs = [makeStaff()];
    const { canonicalStaffIdByAttendanceStaffId } =
      buildStaffIdentityMaps(staffs);
    expect(canonicalStaffIdByAttendanceStaffId["staff-1"]).toBe("staff-1");
    expect(canonicalStaffIdByAttendanceStaffId["cognito-1"]).toBe("staff-1");
  });

  it("id がない場合はスキップすること", () => {
    const staffs = [makeStaff({ id: null })];
    const { staffLabelsById } = buildStaffIdentityMaps(staffs);
    expect(Object.keys(staffLabelsById)).toHaveLength(0);
  });

  it("familyName・givenName がどちらも空の場合はスキップすること", () => {
    const staffs = [makeStaff({ familyName: "", givenName: "" })];
    const { staffLabelsById } = buildStaffIdentityMaps(staffs);
    expect(Object.keys(staffLabelsById)).toHaveLength(0);
  });

  it("familyName のみある場合、familyName のみをラベルとすること", () => {
    const staffs = [makeStaff({ familyName: "山田", givenName: null })];
    const { staffLabelsById } = buildStaffIdentityMaps(staffs);
    expect(staffLabelsById["staff-1"]).toBe("山田");
  });

  it("複数スタッフを正しくマップすること", () => {
    const staffs = [
      makeStaff({ id: "staff-1", familyName: "山田", givenName: "太郎" }),
      makeStaff({
        id: "staff-2",
        cognitoUserId: "cognito-2",
        familyName: "佐藤",
        givenName: "花子",
      }),
    ];
    const { staffLabelsById, canonicalStaffIdByAttendanceStaffId } =
      buildStaffIdentityMaps(staffs);
    expect(staffLabelsById["staff-1"]).toBe("山田 太郎");
    expect(staffLabelsById["staff-2"]).toBe("佐藤 花子");
    expect(canonicalStaffIdByAttendanceStaffId["cognito-2"]).toBe("staff-2");
  });
});

// ---------------------------------------------------------------------------
// buildStaffWorkStatusSummary
// ---------------------------------------------------------------------------
describe("buildStaffWorkStatusSummary", () => {
  it("勤怠が空の場合、全スタッフの勤務時間が 0 であること", () => {
    const staffs = [makeStaff()];
    const result = buildStaffWorkStatusSummary({
      staffs,
      periodAttendances: [],
      standardWorkHours: 8,
    });
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("山田 太郎");
    expect(result[0].workHours).toBe(0);
    expect(result[0].paidHolidayHours).toBe(0);
    expect(result[0].overtimeHours).toBe(0);
  });

  it("勤務時間を正しく集計すること（9時間勤務）", () => {
    const staffs = [makeStaff()];
    const periodAttendances = [
      makeAttendance({
        staffId: "staff-1",
        startTime: "2024-06-10T09:00:00+09:00",
        endTime: "2024-06-10T18:00:00+09:00",
        rests: [],
      }),
    ];
    const result = buildStaffWorkStatusSummary({
      staffs,
      periodAttendances,
      standardWorkHours: 8,
    });
    expect(result[0].workHours).toBe(9);
    expect(result[0].paidHolidayHours).toBe(0);
    expect(result[0].overtimeHours).toBe(1); // 9 - 8 = 1h残業
  });

  it("有給休暇フラグ付き勤怠は有給休暇時間に計上され、通常勤務と残業に含まれないこと", () => {
    const staffs = [makeStaff()];
    const periodAttendances = [
      makeAttendance({
        staffId: "staff-1",
        startTime: "2024-06-10T09:00:00+09:00",
        endTime: "2024-06-10T18:00:00+09:00",
        rests: [],
        paidHolidayFlag: true,
      }),
    ];
    const result = buildStaffWorkStatusSummary({
      staffs,
      periodAttendances,
      standardWorkHours: 8,
    });

    expect(result[0].workHours).toBe(0);
    expect(result[0].paidHolidayHours).toBe(9);
    expect(result[0].overtimeHours).toBe(0);
  });

  it("有給休暇フラグ付き勤怠は休憩時間を差し引かず有給休暇時間に計上すること", () => {
    const staffs = [makeStaff()];
    const periodAttendances = [
      makeAttendance({
        staffId: "staff-1",
        startTime: "2024-06-10T09:00:00+09:00",
        endTime: "2024-06-10T18:00:00+09:00",
        paidHolidayFlag: true,
        rests: [
          {
            startTime: "2024-06-10T12:00:00+09:00",
            endTime: "2024-06-10T13:00:00+09:00",
          },
        ],
      }),
    ];
    const result = buildStaffWorkStatusSummary({
      staffs,
      periodAttendances,
      standardWorkHours: 8,
    });

    expect(result[0].paidHolidayHours).toBe(9);
    expect(result[0].workHours).toBe(0);
  });

  it("休憩時間を差し引いた実働時間を返すこと", () => {
    const staffs = [makeStaff()];
    const periodAttendances = [
      makeAttendance({
        staffId: "staff-1",
        startTime: "2024-06-10T09:00:00+09:00",
        endTime: "2024-06-10T18:00:00+09:00",
        rests: [
          {
            startTime: "2024-06-10T12:00:00+09:00",
            endTime: "2024-06-10T13:00:00+09:00",
          },
        ],
      }),
    ];
    const result = buildStaffWorkStatusSummary({
      staffs,
      periodAttendances,
      standardWorkHours: 8,
    });
    expect(result[0].workHours).toBe(8); // 9 - 1h休憩 = 8h
    expect(result[0].overtimeHours).toBe(0);
  });

  it("複数日の勤務時間を累積すること", () => {
    const staffs = [makeStaff()];
    const periodAttendances = [
      makeAttendance({
        staffId: "staff-1",
        workDate: "2024-06-10",
        startTime: "2024-06-10T09:00:00+09:00",
        endTime: "2024-06-10T18:00:00+09:00",
        rests: [],
      }),
      makeAttendance({
        id: "att-2",
        staffId: "staff-1",
        workDate: "2024-06-11",
        startTime: "2024-06-11T09:00:00+09:00",
        endTime: "2024-06-11T18:00:00+09:00",
        rests: [],
      }),
    ];
    const result = buildStaffWorkStatusSummary({
      staffs,
      periodAttendances,
      standardWorkHours: 8,
    });
    expect(result[0].workHours).toBe(18); // 9 + 9 = 18h
  });

  it("cognitoUserId で登録された勤怠も同一スタッフとして集計すること", () => {
    const staffs = [makeStaff()];
    const periodAttendances = [
      makeAttendance({
        staffId: "staff-1",
        startTime: "2024-06-10T09:00:00+09:00",
        endTime: "2024-06-10T18:00:00+09:00",
        rests: [],
      }),
      makeAttendance({
        id: "att-2",
        staffId: "cognito-1", // cognitoUserId で登録
        workDate: "2024-06-11",
        startTime: "2024-06-11T09:00:00+09:00",
        endTime: "2024-06-11T18:00:00+09:00",
        rests: [],
      }),
    ];
    const result = buildStaffWorkStatusSummary({
      staffs,
      periodAttendances,
      standardWorkHours: 8,
    });
    expect(result[0].label).toBe("山田 太郎");
    expect(result[0].workHours).toBe(18);
  });

  it("staffId が不明な勤怠はスキップすること", () => {
    const staffs = [makeStaff()];
    const periodAttendances = [
      makeAttendance({
        staffId: "unknown-staff",
        startTime: "2024-06-10T09:00:00+09:00",
        endTime: "2024-06-10T18:00:00+09:00",
      }),
    ];
    const result = buildStaffWorkStatusSummary({
      staffs,
      periodAttendances,
      standardWorkHours: 8,
    });
    expect(result[0].workHours).toBe(0); // 不明スタッフは無視
  });

  it("勤務時間の降順でソートされること", () => {
    const staffs = [
      makeStaff({ id: "staff-1", familyName: "山田", givenName: "太郎" }),
      makeStaff({
        id: "staff-2",
        cognitoUserId: "cognito-2",
        familyName: "佐藤",
        givenName: "花子",
      }),
    ];
    const periodAttendances = [
      makeAttendance({
        staffId: "staff-1",
        startTime: "2024-06-10T09:00:00+09:00",
        endTime: "2024-06-10T12:00:00+09:00",
        rests: [],
      }),
      makeAttendance({
        id: "att-2",
        staffId: "staff-2",
        startTime: "2024-06-10T09:00:00+09:00",
        endTime: "2024-06-10T18:00:00+09:00",
        rests: [],
      }),
    ];
    const result = buildStaffWorkStatusSummary({
      staffs,
      periodAttendances,
      standardWorkHours: 8,
    });
    expect(result[0].label).toBe("佐藤 花子"); // 9h > 3h
    expect(result[1].label).toBe("山田 太郎");
  });
});

// ---------------------------------------------------------------------------
// countDuplicateAttendanceDays
// ---------------------------------------------------------------------------
describe("countDuplicateAttendanceDays", () => {
  it("重複なしの場合、0 を返すこと", () => {
    const staffs = [makeStaff()];
    const periodAttendances = [
      makeAttendance({ staffId: "staff-1", workDate: "2024-06-10" }),
    ];
    expect(countDuplicateAttendanceDays({ staffs, periodAttendances })).toBe(0);
  });

  it("同一スタッフ同日に 2 件ある場合、1 を返すこと", () => {
    const staffs = [makeStaff()];
    const periodAttendances = [
      makeAttendance({
        id: "att-1",
        staffId: "staff-1",
        workDate: "2024-06-10",
      }),
      makeAttendance({
        id: "att-2",
        staffId: "staff-1",
        workDate: "2024-06-10",
      }),
    ];
    expect(countDuplicateAttendanceDays({ staffs, periodAttendances })).toBe(1);
  });

  it("同一スタッフ異なる日は重複としないこと", () => {
    const staffs = [makeStaff()];
    const periodAttendances = [
      makeAttendance({
        id: "att-1",
        staffId: "staff-1",
        workDate: "2024-06-10",
      }),
      makeAttendance({
        id: "att-2",
        staffId: "staff-1",
        workDate: "2024-06-11",
      }),
    ];
    expect(countDuplicateAttendanceDays({ staffs, periodAttendances })).toBe(0);
  });

  it("異なるスタッフ同日は重複としないこと", () => {
    const staffs = [
      makeStaff({ id: "staff-1", familyName: "山田", givenName: "太郎" }),
      makeStaff({
        id: "staff-2",
        cognitoUserId: "cognito-2",
        familyName: "佐藤",
        givenName: "花子",
      }),
    ];
    const periodAttendances = [
      makeAttendance({
        id: "att-1",
        staffId: "staff-1",
        workDate: "2024-06-10",
      }),
      makeAttendance({
        id: "att-2",
        staffId: "staff-2",
        workDate: "2024-06-10",
      }),
    ];
    expect(countDuplicateAttendanceDays({ staffs, periodAttendances })).toBe(0);
  });

  it("cognitoUserId と staffId が同一スタッフを指す場合、重複としてカウントすること", () => {
    const staffs = [makeStaff()]; // cognitoUserId: "cognito-1"
    const periodAttendances = [
      makeAttendance({
        id: "att-1",
        staffId: "staff-1",
        workDate: "2024-06-10",
      }),
      makeAttendance({
        id: "att-2",
        staffId: "cognito-1",
        workDate: "2024-06-10",
      }),
    ];
    expect(countDuplicateAttendanceDays({ staffs, periodAttendances })).toBe(1);
  });

  it("staffId がないか不明の場合はスキップすること", () => {
    const staffs = [makeStaff()];
    const periodAttendances = [
      makeAttendance({ staffId: null, workDate: "2024-06-10" }),
    ];
    expect(countDuplicateAttendanceDays({ staffs, periodAttendances })).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildStaffWorkStatusChartData
// ---------------------------------------------------------------------------
describe("buildStaffWorkStatusChartData", () => {
  it("labels が各スタッフ名であること", () => {
    const summary = [
      {
        label: "山田 太郎",
        workHours: 9,
        paidHolidayHours: 0,
        overtimeHours: 1,
      },
      {
        label: "佐藤 花子",
        workHours: 8,
        paidHolidayHours: 0,
        overtimeHours: 0,
      },
    ];
    const result = buildStaffWorkStatusChartData(summary);
    expect(result.labels).toEqual(["山田 太郎", "佐藤 花子"]);
  });

  it("勤務時間データセットの data が workHours と一致すること", () => {
    const summary = [
      {
        label: "山田 太郎",
        workHours: 9,
        paidHolidayHours: 0,
        overtimeHours: 1,
      },
    ];
    const result = buildStaffWorkStatusChartData(summary);
    const workDataset = result.datasets.find((d) => d.label === "勤務時間");
    expect(workDataset?.data).toEqual([9]);
  });

  it("有給休暇データセットの data が paidHolidayHours と一致すること", () => {
    const summary = [
      {
        label: "山田 太郎",
        workHours: 0,
        paidHolidayHours: 8,
        overtimeHours: 0,
      },
    ];
    const result = buildStaffWorkStatusChartData(summary);
    const paidHolidayDataset = result.datasets.find(
      (d) => d.label === "有給休暇",
    );
    expect(paidHolidayDataset?.data).toEqual([8]);
  });

  it("残業時間データセットの data が -overtimeHours であること（グラフ反転用）", () => {
    const summary = [
      {
        label: "山田 太郎",
        workHours: 9,
        paidHolidayHours: 0,
        overtimeHours: 1,
      },
    ];
    const result = buildStaffWorkStatusChartData(summary);
    const overtimeDataset = result.datasets.find((d) => d.label === "残業時間");
    expect(overtimeDataset?.data).toEqual([-1]);
  });

  it("空の summary の場合、labels が空配列であること", () => {
    const result = buildStaffWorkStatusChartData([]);
    expect(result.labels).toEqual([]);
    expect(result.datasets[0].data).toEqual([]);
  });

  it("datasets の stack がすべて 'work-status' であること", () => {
    const summary = [
      {
        label: "スタッフ",
        workHours: 8,
        paidHolidayHours: 0,
        overtimeHours: 0,
      },
    ];
    const result = buildStaffWorkStatusChartData(summary);
    expect(result.datasets.every((d) => d.stack === "work-status")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildStaffWorkStatusChartOptions
// ---------------------------------------------------------------------------
describe("buildStaffWorkStatusChartOptions", () => {
  it("suggestedMax が maxWorkHours より大きくなること", () => {
    const summary = [
      {
        label: "山田 太郎",
        workHours: 10,
        paidHolidayHours: 0,
        overtimeHours: 2,
      },
    ];
    const options = buildStaffWorkStatusChartOptions(summary);
    const suggestedMax = (options.scales?.y as { suggestedMax?: number })
      ?.suggestedMax;
    expect(suggestedMax).toBeGreaterThan(10);
  });

  it("残業がない場合 suggestedMin が 0 であること", () => {
    const summary = [
      {
        label: "山田 太郎",
        workHours: 8,
        paidHolidayHours: 0,
        overtimeHours: 0,
      },
    ];
    const options = buildStaffWorkStatusChartOptions(summary);
    const suggestedMin = (options.scales?.y as { suggestedMin?: number })
      ?.suggestedMin;
    expect(suggestedMin).toBe(0);
  });

  it("残業がある場合 suggestedMin が負の値になること", () => {
    const summary = [
      {
        label: "山田 太郎",
        workHours: 10,
        paidHolidayHours: 0,
        overtimeHours: 2,
      },
    ];
    const options = buildStaffWorkStatusChartOptions(summary);
    const suggestedMin = (options.scales?.y as { suggestedMin?: number })
      ?.suggestedMin;
    expect(suggestedMin).toBeLessThan(0);
  });

  it("summary が空の場合 suggestedMax が最小でも 1 であること", () => {
    const options = buildStaffWorkStatusChartOptions([]);
    const suggestedMax = (options.scales?.y as { suggestedMax?: number })
      ?.suggestedMax;
    expect(suggestedMax).toBeGreaterThanOrEqual(1);
  });

  it("responsive が true であること", () => {
    const options = buildStaffWorkStatusChartOptions([]);
    expect(options.responsive).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildAggregationPeriodInfoLabel
// ---------------------------------------------------------------------------
describe("buildAggregationPeriodInfoLabel", () => {
  it("M/D〜M/D 形式のラベルを返すこと", () => {
    const result = buildAggregationPeriodInfoLabel({
      aggregationStartDate: "2024-06-01",
      aggregationEndDate: "2024-06-30",
    });
    expect(result).toBe("集計期間: 6/1〜6/30");
  });

  it("月をまたぐ期間でも正しくフォーマットすること", () => {
    const result = buildAggregationPeriodInfoLabel({
      aggregationStartDate: "2024-05-25",
      aggregationEndDate: "2024-06-24",
    });
    expect(result).toBe("集計期間: 5/25〜6/24");
  });

  it("1 桁の月・日はゼロ埋めされないこと", () => {
    const result = buildAggregationPeriodInfoLabel({
      aggregationStartDate: "2024-01-05",
      aggregationEndDate: "2024-09-09",
    });
    expect(result).toBe("集計期間: 1/5〜9/9");
  });
});
