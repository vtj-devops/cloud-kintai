import { renderHook } from "@testing-library/react";

import { useWorkflowDetailMeta } from "../useWorkflowDetailMeta";

// Mock external dependencies
jest.mock("@entities/workflow/lib/workflowLabels", () => ({
  getWorkflowCategoryLabel: jest.fn(() => "有給休暇申請"),
}));

jest.mock("@shared/lib/time", () => ({
  formatDateSlash: jest.fn((v: string | null | undefined) => v ?? ""),
  isoDateFromTimestamp: jest.fn((v: string | null | undefined) => v ?? ""),
}));

jest.mock(
  "@features/workflow/approval-flow/model/workflowApprovalTimeline",
  () => ({
    buildWorkflowApprovalTimeline: jest.fn(() => []),
  })
);

jest.mock(
  "@features/workflow/detail-panel/model/workflowDetailPermissions",
  () => ({
    deriveWorkflowDetailPermissions: jest.fn(() => ({
      isSubmittedOrLater: false,
      isFinalized: false,
      editDisabled: false,
      editTooltip: undefined,
      withdrawDisabled: false,
      withdrawTooltip: undefined,
    })),
  })
);

const makeWorkflow = (
  overrides: Record<string, unknown> = {}
) => ({
  id: "wf-1",
  staffId: "staff-1",
  status: "DRAFT",
  createdAt: "2024-06-01T09:00:00Z",
  ...overrides,
});

const makeStaff = (overrides: Record<string, unknown> = {}) => ({
  id: "staff-1",
  familyName: "山田",
  givenName: "太郎",
  cognitoUserId: "cognito-1",
  ...overrides,
});

describe("useWorkflowDetailMeta", () => {
  it("workflow が null のときデフォルト値を返す", () => {
    const { result } = renderHook(() =>
      useWorkflowDetailMeta({ workflow: null, staffs: [] })
    );
    expect(result.current.staffName).toBe("—");
    expect(result.current.approvalSteps).toEqual([]);
  });

  it("staffId に対応するスタッフ名を返す", () => {
    const workflow = makeWorkflow();
    const staffs = [makeStaff()];
    const { result } = renderHook(() =>
      useWorkflowDetailMeta({
        workflow: workflow as never,
        staffs: staffs as never,
      })
    );
    expect(result.current.staffName).toBe("山田 太郎");
  });

  it("staffId に一致するスタッフがいない場合 staffId を返す", () => {
    const workflow = makeWorkflow({ staffId: "unknown-staff" });
    const { result } = renderHook(() =>
      useWorkflowDetailMeta({
        workflow: workflow as never,
        staffs: [],
      })
    );
    expect(result.current.staffName).toBe("unknown-staff");
  });

  it("categoryLabel は getWorkflowCategoryLabel の結果を返す", () => {
    const { result } = renderHook(() =>
      useWorkflowDetailMeta({
        workflow: makeWorkflow() as never,
        staffs: [],
      })
    );
    expect(result.current.categoryLabel).toBe("有給休暇申請");
  });

  it("permissions は deriveWorkflowDetailPermissions の結果を返す", () => {
    const { result } = renderHook(() =>
      useWorkflowDetailMeta({
        workflow: makeWorkflow() as never,
        staffs: [],
      })
    );
    expect(result.current.permissions.editDisabled).toBe(false);
    expect(result.current.permissions.withdrawDisabled).toBe(false);
  });
});
