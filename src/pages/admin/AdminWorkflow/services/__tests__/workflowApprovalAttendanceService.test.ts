import { CLOCK_CORRECTION_CHECK_OUT_LABEL } from "@entities/workflow/lib/workflowLabels";
import type { GetWorkflowQuery } from "@shared/api/graphql/types";
import dayjs from "dayjs";

import {
  type AttendanceQueryTrigger,
  type CreateAttendanceTrigger,
  processClockCorrectionApprovalAttendance,
  processCompensatoryLeaveApprovalAttendance,
  processPaidLeaveApprovalAttendance,
  type StaffLike,
  type UpdateAttendanceTrigger,
  WorkflowApprovalUserError,
} from "../workflowApprovalAttendanceService";

type WorkflowData = NonNullable<GetWorkflowQuery["getWorkflow"]>;

// ----------------------------------------------------------------
// Fixtures
// ----------------------------------------------------------------
const makeWorkflow = (overrides: Partial<WorkflowData> = {}): WorkflowData =>
  ({
    __typename: "Workflow",
    id: "wf001",
    staffId: "staff001",
    status: "PENDING" as never,
    category: "PAID_LEAVE" as never,
    overTimeDetails: {
      __typename: "OverTimeDetails",
      startTime: "2024-12-25",
      endTime: "2024-12-27",
      date: null,
      reason: null,
    },
    createdAt: "2024-12-25T00:00:00Z",
    updatedAt: "2024-12-25T00:00:00Z",
    ...overrides,
  }) as WorkflowData;

const makeStaff = (overrides: Partial<StaffLike> = {}): StaffLike => ({
  id: "staff001",
  cognitoUserId: "cognito001",
  familyName: "山田",
  givenName: "太郎",
  ...overrides,
});

const mockGetStartTime = () => dayjs("2024-12-25T09:00:00");
const mockGetEndTime = () => dayjs("2024-12-25T18:00:00");
const mockGetLunchRestStartTime = () => dayjs("2024-12-25T12:00:00");
const mockGetLunchRestEndTime = () => dayjs("2024-12-25T13:00:00");

const makeGetAttendance =
  (result: object | null): AttendanceQueryTrigger =>
  () => ({
    unwrap: () => Promise.resolve(result as never),
  });

const makeCreateAttendance = (): { trigger: CreateAttendanceTrigger; calls: object[] } => {
  const calls: object[] = [];
  const trigger: CreateAttendanceTrigger = (input) => ({
    unwrap: () => {
      calls.push(input);
      return Promise.resolve({ id: "att001", ...input } as never);
    },
  });
  return { trigger, calls };
};

const makeUpdateAttendance = (): { trigger: UpdateAttendanceTrigger; calls: object[] } => {
  const calls: object[] = [];
  const trigger: UpdateAttendanceTrigger = (input) => ({
    unwrap: () => {
      calls.push(input);
      return Promise.resolve({ id: "att001", ...input } as never);
    },
  });
  return { trigger, calls };
};

// ----------------------------------------------------------------
// processPaidLeaveApprovalAttendance
// ----------------------------------------------------------------
describe("processPaidLeaveApprovalAttendance", () => {
  it("overTimeDetails がない場合、missing_period でスキップする", async () => {
    const result = await processPaidLeaveApprovalAttendance({
      workflow: makeWorkflow({ overTimeDetails: null }),
      staffs: [makeStaff()],
      getStartTime: mockGetStartTime,
      getEndTime: mockGetEndTime,
      getLunchRestStartTime: mockGetLunchRestStartTime,
      getLunchRestEndTime: mockGetLunchRestEndTime,
      getAttendanceByStaffAndDate: makeGetAttendance(null),
      createAttendance: makeCreateAttendance().trigger,
      updateAttendance: makeUpdateAttendance().trigger,
    });
    expect(result).toEqual({ kind: "skipped", reason: "missing_period" });
  });

  it("startTime のみない場合、missing_period でスキップする", async () => {
    const result = await processPaidLeaveApprovalAttendance({
      workflow: makeWorkflow({
        overTimeDetails: {
          __typename: "OverTimeDetails",
          startTime: null,
          endTime: "2024-12-27",
          date: null,
          reason: null,
        },
      }),
      staffs: [makeStaff()],
      getStartTime: mockGetStartTime,
      getEndTime: mockGetEndTime,
      getLunchRestStartTime: mockGetLunchRestStartTime,
      getLunchRestEndTime: mockGetLunchRestEndTime,
      getAttendanceByStaffAndDate: makeGetAttendance(null),
      createAttendance: makeCreateAttendance().trigger,
      updateAttendance: makeUpdateAttendance().trigger,
    });
    expect(result).toEqual({ kind: "skipped", reason: "missing_period" });
  });

  it("日付が不正な場合、invalid_period でスキップする", async () => {
    const result = await processPaidLeaveApprovalAttendance({
      workflow: makeWorkflow({
        overTimeDetails: {
          __typename: "OverTimeDetails",
          startTime: "not-a-date",
          endTime: "also-not-a-date",
          date: null,
          reason: null,
        },
      }),
      staffs: [makeStaff()],
      getStartTime: mockGetStartTime,
      getEndTime: mockGetEndTime,
      getLunchRestStartTime: mockGetLunchRestStartTime,
      getLunchRestEndTime: mockGetLunchRestEndTime,
      getAttendanceByStaffAndDate: makeGetAttendance(null),
      createAttendance: makeCreateAttendance().trigger,
      updateAttendance: makeUpdateAttendance().trigger,
    });
    expect(result).toEqual({ kind: "skipped", reason: "invalid_period" });
  });

  it("勤怠が存在しない場合、createAttendance を呼び出す", async () => {
    const { trigger: create, calls } = makeCreateAttendance();
    const result = await processPaidLeaveApprovalAttendance({
      workflow: makeWorkflow(),
      staffs: [makeStaff()],
      getStartTime: mockGetStartTime,
      getEndTime: mockGetEndTime,
      getLunchRestStartTime: mockGetLunchRestStartTime,
      getLunchRestEndTime: mockGetLunchRestEndTime,
      getAttendanceByStaffAndDate: makeGetAttendance(null),
      createAttendance: create,
      updateAttendance: makeUpdateAttendance().trigger,
    });
    expect(result).toEqual({ kind: "updated" });
    // 3日分作成される (2024-12-25 〜 2024-12-27)
    expect(calls).toHaveLength(3);
    expect((calls[0] as { paidHolidayFlag: boolean }).paidHolidayFlag).toBe(true);
  });

  it("既存の勤怠がある場合、updateAttendance を呼び出す", async () => {
    const { trigger: update, calls } = makeUpdateAttendance();
    const existingAttendance = { id: "att001", revision: 1 };
    const result = await processPaidLeaveApprovalAttendance({
      workflow: makeWorkflow(),
      staffs: [makeStaff()],
      getStartTime: mockGetStartTime,
      getEndTime: mockGetEndTime,
      getLunchRestStartTime: mockGetLunchRestStartTime,
      getLunchRestEndTime: mockGetLunchRestEndTime,
      getAttendanceByStaffAndDate: makeGetAttendance(existingAttendance),
      createAttendance: makeCreateAttendance().trigger,
      updateAttendance: update,
    });
    expect(result).toEqual({ kind: "updated" });
    expect(calls).toHaveLength(3);
  });

  it("staffs に一致するスタッフがない場合、workflow.staffId をそのまま使う", async () => {
    const { trigger: create, calls } = makeCreateAttendance();
    await processPaidLeaveApprovalAttendance({
      workflow: makeWorkflow({ staffId: "unknown-staff", overTimeDetails: { __typename: "OverTimeDetails", startTime: "2024-12-25", endTime: "2024-12-25", date: null, reason: null } }),
      staffs: [],
      getStartTime: mockGetStartTime,
      getEndTime: mockGetEndTime,
      getLunchRestStartTime: mockGetLunchRestStartTime,
      getLunchRestEndTime: mockGetLunchRestEndTime,
      getAttendanceByStaffAndDate: makeGetAttendance(null),
      createAttendance: create,
      updateAttendance: makeUpdateAttendance().trigger,
    });
    expect((calls[0] as { staffId: string }).staffId).toBe("unknown-staff");
  });
});

// ----------------------------------------------------------------
// processCompensatoryLeaveApprovalAttendance
// ----------------------------------------------------------------
describe("processCompensatoryLeaveApprovalAttendance", () => {
  const makeCompWorkflow = () =>
    makeWorkflow({
      overTimeDetails: {
        __typename: "OverTimeDetails",
        startTime: "2024-12-26",
        endTime: null,
        date: "2024-12-24",
        reason: null,
      },
    });

  it("startTime がない場合、missing_date でスキップする", async () => {
    const result = await processCompensatoryLeaveApprovalAttendance({
      workflow: makeWorkflow({ overTimeDetails: { __typename: "OverTimeDetails", startTime: null, endTime: null, date: null, reason: null } }),
      staffs: [],
      getStartTime: mockGetStartTime,
      getEndTime: mockGetEndTime,
      getLunchRestStartTime: mockGetLunchRestStartTime,
      getLunchRestEndTime: mockGetLunchRestEndTime,
      getAttendanceByStaffAndDate: makeGetAttendance(null),
      createAttendance: makeCreateAttendance().trigger,
      updateAttendance: makeUpdateAttendance().trigger,
    });
    expect(result).toEqual({ kind: "skipped", reason: "missing_date" });
  });

  it("startTime が不正な場合、invalid_date でスキップする", async () => {
    const result = await processCompensatoryLeaveApprovalAttendance({
      workflow: makeWorkflow({ overTimeDetails: { __typename: "OverTimeDetails", startTime: "not-a-date", endTime: null, date: null, reason: null } }),
      staffs: [],
      getStartTime: mockGetStartTime,
      getEndTime: mockGetEndTime,
      getLunchRestStartTime: mockGetLunchRestStartTime,
      getLunchRestEndTime: mockGetLunchRestEndTime,
      getAttendanceByStaffAndDate: makeGetAttendance(null),
      createAttendance: makeCreateAttendance().trigger,
      updateAttendance: makeUpdateAttendance().trigger,
    });
    expect(result).toEqual({ kind: "skipped", reason: "invalid_date" });
  });

  it("既存勤怠がない場合、createAttendance を呼び出し created を返す", async () => {
    const { trigger: create, calls } = makeCreateAttendance();
    const result = await processCompensatoryLeaveApprovalAttendance({
      workflow: makeCompWorkflow(),
      staffs: [makeStaff()],
      getStartTime: mockGetStartTime,
      getEndTime: mockGetEndTime,
      getLunchRestStartTime: mockGetLunchRestStartTime,
      getLunchRestEndTime: mockGetLunchRestEndTime,
      getAttendanceByStaffAndDate: makeGetAttendance(null),
      createAttendance: create,
      updateAttendance: makeUpdateAttendance().trigger,
    });
    expect(result).toEqual({ kind: "created" });
    expect(calls).toHaveLength(1);
    expect((calls[0] as { specialHolidayFlag: boolean }).specialHolidayFlag).toBe(true);
  });

  it("既存勤怠がある場合、updateAttendance を呼び出し updated を返す", async () => {
    const { trigger: update, calls } = makeUpdateAttendance();
    const result = await processCompensatoryLeaveApprovalAttendance({
      workflow: makeCompWorkflow(),
      staffs: [makeStaff()],
      getStartTime: mockGetStartTime,
      getEndTime: mockGetEndTime,
      getLunchRestStartTime: mockGetLunchRestStartTime,
      getLunchRestEndTime: mockGetLunchRestEndTime,
      getAttendanceByStaffAndDate: makeGetAttendance({ id: "att001", revision: 1 }),
      createAttendance: makeCreateAttendance().trigger,
      updateAttendance: update,
    });
    expect(result).toEqual({ kind: "updated" });
    expect(calls).toHaveLength(1);
  });
});

// ----------------------------------------------------------------
// processClockCorrectionApprovalAttendance
// ----------------------------------------------------------------
describe("processClockCorrectionApprovalAttendance", () => {
  const makeClockInWorkflow = () =>
    makeWorkflow({
      overTimeDetails: {
        __typename: "OverTimeDetails",
        startTime: "09:00",
        endTime: null,
        date: "2024-12-25",
        reason: "打刻修正(出勤忘れ)",
      },
    });

  const makeClockOutWorkflow = () =>
    makeWorkflow({
      overTimeDetails: {
        __typename: "OverTimeDetails",
        startTime: null,
        endTime: "18:00",
        date: "2024-12-25",
        reason: CLOCK_CORRECTION_CHECK_OUT_LABEL,
      },
    });

  it("date がない場合、WorkflowApprovalUserError をスローする", async () => {
    await expect(
      processClockCorrectionApprovalAttendance({
        workflow: makeWorkflow({
          overTimeDetails: {
            __typename: "OverTimeDetails",
            startTime: "09:00",
            endTime: null,
            date: null,
            reason: null,
          },
        }),
        staffs: [makeStaff()],
        getAttendanceByStaffAndDate: makeGetAttendance(null),
        createAttendance: makeCreateAttendance().trigger,
        updateAttendance: makeUpdateAttendance().trigger,
      })
    ).rejects.toThrow(WorkflowApprovalUserError);
  });

  it("時刻が null の場合、WorkflowApprovalUserError をスローする", async () => {
    await expect(
      processClockCorrectionApprovalAttendance({
        workflow: makeWorkflow({
          overTimeDetails: {
            __typename: "OverTimeDetails",
            startTime: null,
            endTime: null,
            date: "2024-12-25",
            reason: null,
          },
        }),
        staffs: [makeStaff()],
        getAttendanceByStaffAndDate: makeGetAttendance(null),
        createAttendance: makeCreateAttendance().trigger,
        updateAttendance: makeUpdateAttendance().trigger,
      })
    ).rejects.toThrow(WorkflowApprovalUserError);
  });

  it("date 形式が不正な場合、WorkflowApprovalUserError をスローする", async () => {
    await expect(
      processClockCorrectionApprovalAttendance({
        workflow: makeWorkflow({
          overTimeDetails: {
            __typename: "OverTimeDetails",
            startTime: "09:00",
            endTime: null,
            date: "2024/12/25",
            reason: null,
          },
        }),
        staffs: [makeStaff()],
        getAttendanceByStaffAndDate: makeGetAttendance(null),
        createAttendance: makeCreateAttendance().trigger,
        updateAttendance: makeUpdateAttendance().trigger,
      })
    ).rejects.toThrow(WorkflowApprovalUserError);
  });

  it("時刻形式が不正な場合、WorkflowApprovalUserError をスローする", async () => {
    await expect(
      processClockCorrectionApprovalAttendance({
        workflow: makeWorkflow({
          overTimeDetails: {
            __typename: "OverTimeDetails",
            startTime: "9:00",
            endTime: null,
            date: "2024-12-25",
            reason: null,
          },
        }),
        staffs: [makeStaff()],
        getAttendanceByStaffAndDate: makeGetAttendance(null),
        createAttendance: makeCreateAttendance().trigger,
        updateAttendance: makeUpdateAttendance().trigger,
      })
    ).rejects.toThrow(WorkflowApprovalUserError);
  });

  it("出勤修正で勤怠なしの場合、createAttendance を呼び出し created を返す", async () => {
    const { trigger: create, calls } = makeCreateAttendance();
    const result = await processClockCorrectionApprovalAttendance({
      workflow: makeClockInWorkflow(),
      staffs: [makeStaff()],
      getAttendanceByStaffAndDate: makeGetAttendance(null),
      createAttendance: create,
      updateAttendance: makeUpdateAttendance().trigger,
    });
    expect(result).toEqual({ kind: "created" });
    expect(calls).toHaveLength(1);
    expect((calls[0] as { endTime: unknown }).endTime).toBeNull();
  });

  it("退勤修正で勤怠なしの場合、WorkflowApprovalUserError をスローする", async () => {
    await expect(
      processClockCorrectionApprovalAttendance({
        workflow: makeClockOutWorkflow(),
        staffs: [makeStaff()],
        getAttendanceByStaffAndDate: makeGetAttendance(null),
        createAttendance: makeCreateAttendance().trigger,
        updateAttendance: makeUpdateAttendance().trigger,
      })
    ).rejects.toThrow(WorkflowApprovalUserError);
  });

  it("出勤修正で既存勤怠ありの場合、updateAttendance を呼び出し updated を返す", async () => {
    const { trigger: update, calls } = makeUpdateAttendance();
    const result = await processClockCorrectionApprovalAttendance({
      workflow: makeClockInWorkflow(),
      staffs: [makeStaff()],
      getAttendanceByStaffAndDate: makeGetAttendance({
        id: "att001",
        revision: 1,
        startTime: null,
        endTime: null,
        goDirectlyFlag: false,
        returnDirectlyFlag: false,
        absentFlag: false,
        paidHolidayFlag: false,
        specialHolidayFlag: false,
        rests: [],
        hourlyPaidHolidayTimes: [],
      }),
      createAttendance: makeCreateAttendance().trigger,
      updateAttendance: update,
    });
    expect(result).toEqual({ kind: "updated" });
    expect(calls).toHaveLength(1);
  });

  it("退勤修正で既存勤怠ありの場合、updateAttendance を呼び出し updated を返す", async () => {
    const { trigger: update, calls } = makeUpdateAttendance();
    const result = await processClockCorrectionApprovalAttendance({
      workflow: makeClockOutWorkflow(),
      staffs: [makeStaff()],
      getAttendanceByStaffAndDate: makeGetAttendance({
        id: "att001",
        revision: 1,
        startTime: "2024-12-25T09:00:00+09:00",
        endTime: null,
        goDirectlyFlag: false,
        returnDirectlyFlag: false,
        absentFlag: false,
        paidHolidayFlag: false,
        specialHolidayFlag: false,
        rests: [],
        hourlyPaidHolidayTimes: [],
      }),
      createAttendance: makeCreateAttendance().trigger,
      updateAttendance: update,
    });
    expect(result).toEqual({ kind: "updated" });
    expect(calls).toHaveLength(1);
    expect((calls[0] as { startTime: string }).startTime).toContain("09:00");
  });
});
