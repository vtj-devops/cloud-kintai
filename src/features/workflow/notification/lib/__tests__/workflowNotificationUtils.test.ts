import {
  StaffRole,
} from "@entities/staff/model/useStaffs/useStaffs";
import {
  getCategoryLabel,
  getStaffName,
  isAssignedAsApprover,
} from "@features/workflow/notification/lib/workflowNotificationUtils";
import {
  OnCreateWorkflowSubscription,
  WorkflowCategory,
} from "@shared/api/graphql/types";

// --- テスト用ヘルパー ---

type WorkflowSnapshot = OnCreateWorkflowSubscription["onCreateWorkflow"];

/** 最小限のワークフロースナップショットを生成 */
const buildWorkflow = (
  overrides: Partial<NonNullable<WorkflowSnapshot>> = {},
): WorkflowSnapshot =>
  ({
    id: "wf-1",
    staffId: "staff-1",
    category: WorkflowCategory.PAID_LEAVE,
    assignedApproverStaffIds: ["approver-1"],
    customWorkflowTitle: null,
    ...overrides,
  }) as WorkflowSnapshot;

/** 最小限のスタッフオブジェクトを生成 */
const buildStaff = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "staff-1",
    familyName: "山田",
    givenName: "太郎",
    role: StaffRole.STAFF,
    cognitoUserId: "cognito-1",
    mailAddress: null,
    owner: null,
    enabled: true,
    status: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  });

// ---------------------------------------------------------------------------
// getStaffName
// ---------------------------------------------------------------------------

describe("getStaffName", () => {
  it("familyName と givenName を連結して返す", () => {
    const staffs = [
      buildStaff({ id: "staff-1", familyName: "山田", givenName: "太郎" }),
    ];
    expect(getStaffName(staffs as never, "staff-1")).toBe("山田太郎");
  });

  it("givenName が null の場合 familyName のみ返す", () => {
    const staffs = [
      buildStaff({ id: "staff-1", familyName: "山田", givenName: null }),
    ];
    expect(getStaffName(staffs as never, "staff-1")).toBe("山田");
  });

  it("familyName と givenName が両方 null の場合「スタッフ」を返す", () => {
    const staffs = [
      buildStaff({ id: "staff-1", familyName: null, givenName: null }),
    ];
    expect(getStaffName(staffs as never, "staff-1")).toBe("スタッフ");
  });

  it("スタッフが存在しない場合「スタッフ」を返す", () => {
    expect(getStaffName([], "unknown-id")).toBe("スタッフ");
  });

  it("空のスタッフ配列でも「スタッフ」を返す", () => {
    expect(getStaffName([], "staff-1")).toBe("スタッフ");
  });
});

// ---------------------------------------------------------------------------
// getCategoryLabel
// ---------------------------------------------------------------------------

describe("getCategoryLabel", () => {
  it("null を渡すと「申請」を返す", () => {
    expect(getCategoryLabel(null)).toBe("申請");
  });

  it("PAID_LEAVE カテゴリーのラベルを返す", () => {
    expect(
      getCategoryLabel(buildWorkflow({ category: WorkflowCategory.PAID_LEAVE })),
    ).toBe("有給休暇申請");
  });

  it("ABSENCE カテゴリーのラベルを返す", () => {
    expect(
      getCategoryLabel(buildWorkflow({ category: WorkflowCategory.ABSENCE })),
    ).toBe("欠勤申請");
  });

  it("OVERTIME カテゴリーのラベルを返す", () => {
    expect(
      getCategoryLabel(buildWorkflow({ category: WorkflowCategory.OVERTIME })),
    ).toBe("時間外勤務申請");
  });

  it("CLOCK_CORRECTION カテゴリーのラベルを返す", () => {
    expect(
      getCategoryLabel(
        buildWorkflow({ category: WorkflowCategory.CLOCK_CORRECTION }),
      ),
    ).toBe("勤怠修正申請");
  });

  it("COMPENSATORY_LEAVE カテゴリーのラベルを返す", () => {
    expect(
      getCategoryLabel(
        buildWorkflow({ category: WorkflowCategory.COMPENSATORY_LEAVE }),
      ),
    ).toBe("振替休暇申請");
  });

  it("CUSTOM カテゴリーで customWorkflowTitle がある場合はそのタイトルを返す", () => {
    expect(
      getCategoryLabel(
        buildWorkflow({
          category: WorkflowCategory.CUSTOM,
          customWorkflowTitle: "特別申請",
        }),
      ),
    ).toBe("特別申請");
  });

  it("CUSTOM カテゴリーで customWorkflowTitle が null の場合「その他申請」を返す", () => {
    expect(
      getCategoryLabel(
        buildWorkflow({
          category: WorkflowCategory.CUSTOM,
          customWorkflowTitle: null,
        }),
      ),
    ).toBe("その他申請");
  });

  it("category が null の場合「申請」を返す", () => {
    expect(getCategoryLabel(buildWorkflow({ category: null }))).toBe("申請");
  });
});

// ---------------------------------------------------------------------------
// isAssignedAsApprover
// ---------------------------------------------------------------------------

describe("isAssignedAsApprover", () => {
  it("assignedApproverStaffIds にスタッフ ID が含まれる場合 true を返す", () => {
    const workflow = buildWorkflow({ assignedApproverStaffIds: ["approver-1"] });
    expect(isAssignedAsApprover(workflow, "approver-1", [])).toBe(true);
  });

  it("assignedApproverStaffIds にスタッフ ID が含まれない場合 false を返す", () => {
    const workflow = buildWorkflow({ assignedApproverStaffIds: ["approver-1"] });
    expect(isAssignedAsApprover(workflow, "staff-2", [])).toBe(false);
  });

  it("assignedApproverStaffIds が null の場合 false を返す", () => {
    const workflow = buildWorkflow({ assignedApproverStaffIds: null });
    expect(isAssignedAsApprover(workflow, "approver-1", [])).toBe(false);
  });

  it("ADMINS が含まれていて現在のスタッフが Admin ロールなら true を返す", () => {
    const workflow = buildWorkflow({ assignedApproverStaffIds: ["ADMINS"] });
    const staffs = [
      buildStaff({ id: "admin-1", role: StaffRole.ADMIN }),
    ];
    expect(isAssignedAsApprover(workflow, "admin-1", staffs as never)).toBe(true);
  });

  it("ADMINS が含まれていてもスタッフが Staff ロールなら false を返す", () => {
    const workflow = buildWorkflow({ assignedApproverStaffIds: ["ADMINS"] });
    const staffs = [
      buildStaff({ id: "staff-1", role: StaffRole.STAFF }),
    ];
    expect(isAssignedAsApprover(workflow, "staff-1", staffs as never)).toBe(false);
  });

  it("workflow が null の場合 false を返す", () => {
    expect(isAssignedAsApprover(null, "approver-1", [])).toBe(false);
  });

  it("currentStaffId が空文字の場合 false を返す", () => {
    const workflow = buildWorkflow({ assignedApproverStaffIds: ["approver-1"] });
    expect(isAssignedAsApprover(workflow, "", [])).toBe(false);
  });
});
