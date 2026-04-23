import { useWorkflowDetailViewModel } from "@pages/admin/AdminWorkflow/hooks/useWorkflowDetailViewModel";
import { ApprovalStatus, WorkflowStatus } from "@shared/api/graphql/types";
import { renderHook } from "@testing-library/react";

type StaffLike = {
  id: string;
  cognitoUserId?: string | null;
  familyName?: string | null;
  givenName?: string | null;
  approverSetting?: "ADMINS" | "SINGLE" | "MULTIPLE" | null;
  approverSingle?: string | null;
  approverMultiple?: Array<string | null> | null;
  approverMultipleMode?: "ORDER" | "ANY" | null;
};

const makeStaff = (overrides: Partial<StaffLike> = {}): StaffLike => ({
  id: "staff-1",
  cognitoUserId: "cognito-1",
  familyName: "山田",
  givenName: "太郎",
  approverSetting: "ADMINS",
  ...overrides,
});

const makeWorkflow = (overrides: Record<string, unknown> = {}) => ({
  id: "wf-1",
  staffId: "staff-1",
  status: WorkflowStatus.PENDING,
  createdAt: "1700000000000",
  approvalSteps: null,
  ...overrides,
});

describe("useWorkflowDetailViewModel", () => {
  describe("staffName", () => {
    it("returns em-dash when workflow is null", () => {
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({ workflow: null, staffs: [] }),
      );
      expect(result.current.staffName).toBe("—");
    });

    it("returns em-dash when workflow has no staffId", () => {
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({
          workflow: makeWorkflow({ staffId: null }) as never,
          staffs: [],
        }),
      );
      expect(result.current.staffName).toBe("—");
    });

    it("returns staff name when staff is found", () => {
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({
          workflow: makeWorkflow() as never,
          staffs: [makeStaff()],
        }),
      );
      expect(result.current.staffName).toBe("山田 太郎");
    });

    it("returns staffId when staff is not found", () => {
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({
          workflow: makeWorkflow() as never,
          staffs: [],
        }),
      );
      expect(result.current.staffName).toBe("staff-1");
    });
  });

  describe("approverInfo — ADMINS mode", () => {
    it("returns 管理者全員 for ADMINS setting", () => {
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({
          workflow: makeWorkflow() as never,
          staffs: [makeStaff({ approverSetting: "ADMINS" })],
        }),
      );
      expect(result.current.approvalSteps[1].name).toBe("管理者全員");
    });

    it("returns 管理者全員 when approverSetting is null", () => {
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({
          workflow: makeWorkflow() as never,
          staffs: [makeStaff({ approverSetting: null })],
        }),
      );
      expect(result.current.approvalSteps[1].name).toBe("管理者全員");
    });
  });

  describe("approverInfo — SINGLE mode", () => {
    it("returns approver name for SINGLE mode", () => {
      const approver = makeStaff({
        id: "approver-1",
        cognitoUserId: "cognito-approver",
        familyName: "佐藤",
        givenName: "花子",
      });
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({
          workflow: makeWorkflow() as never,
          staffs: [
            makeStaff({
              approverSetting: "SINGLE",
              approverSingle: "cognito-approver",
            }),
            approver,
          ],
        }),
      );
      expect(result.current.approvalSteps[1].name).toBe("佐藤 花子");
    });

    it("returns 未設定 when approverSingle is not set", () => {
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({
          workflow: makeWorkflow() as never,
          staffs: [makeStaff({ approverSetting: "SINGLE", approverSingle: null })],
        }),
      );
      expect(result.current.approvalSteps[1].name).toBe("未設定");
    });
  });

  describe("approverInfo — MULTIPLE mode", () => {
    it("returns approver names for MULTIPLE mode in ORDER", () => {
      const approver1 = makeStaff({
        id: "a1",
        cognitoUserId: "c1",
        familyName: "鈴木",
        givenName: "一郎",
      });
      const approver2 = makeStaff({
        id: "a2",
        cognitoUserId: "c2",
        familyName: "田中",
        givenName: "二郎",
      });
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({
          workflow: makeWorkflow() as never,
          staffs: [
            makeStaff({
              approverSetting: "MULTIPLE",
              approverMultiple: ["c1", "c2"],
              approverMultipleMode: "ORDER",
            }),
            approver1,
            approver2,
          ],
        }),
      );
      const steps = result.current.approvalSteps;
      expect(steps[1].name).toBe("鈴木 一郎");
      expect(steps[2].name).toBe("田中 二郎");
    });

    it("returns 未設定 when approverMultiple is empty", () => {
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({
          workflow: makeWorkflow() as never,
          staffs: [
            makeStaff({
              approverSetting: "MULTIPLE",
              approverMultiple: [],
            }),
          ],
        }),
      );
      expect(result.current.approvalSteps[1].name).toBe("未設定");
    });
  });

  describe("approvalSteps — with explicit approvalSteps in workflow", () => {
    it("builds steps from approvalSteps array", () => {
      const workflow = makeWorkflow({
        status: WorkflowStatus.APPROVED,
        approvalSteps: [
          {
            id: "step-1",
            stepOrder: 1,
            approverStaffId: "staff-1",
            decisionStatus: ApprovalStatus.APPROVED,
            decisionTimestamp: "2024-01-01T00:00:00.000Z",
            approverComment: "OK",
          },
        ],
      });
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({
          workflow: workflow as never,
          staffs: [makeStaff()],
        }),
      );
      const steps = result.current.approvalSteps;
      expect(steps).toHaveLength(2);
      expect(steps[1].state).toBe("承認済み");
      expect(steps[1].comment).toBe("OK");
    });

    it("shows 却下 state for rejected step", () => {
      const workflow = makeWorkflow({
        approvalSteps: [
          {
            id: "step-1",
            stepOrder: 1,
            approverStaffId: "ADMINS",
            decisionStatus: ApprovalStatus.REJECTED,
            decisionTimestamp: null,
            approverComment: "",
          },
        ],
      });
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({
          workflow: workflow as never,
          staffs: [],
        }),
      );
      expect(result.current.approvalSteps[1].state).toBe("却下");
      expect(result.current.approvalSteps[1].name).toBe("管理者全員");
    });

    it("shows スキップ state for skipped step", () => {
      const workflow = makeWorkflow({
        approvalSteps: [
          {
            id: "step-1",
            stepOrder: 1,
            approverStaffId: "staff-1",
            decisionStatus: ApprovalStatus.SKIPPED,
            decisionTimestamp: null,
            approverComment: null,
          },
        ],
      });
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({
          workflow: workflow as never,
          staffs: [makeStaff()],
        }),
      );
      expect(result.current.approvalSteps[1].state).toBe("スキップ");
    });
  });

  describe("approvalSteps — APPROVED workflow without explicit steps", () => {
    it("shows 承認済み when approved", () => {
      const { result } = renderHook(() =>
        useWorkflowDetailViewModel({
          workflow: makeWorkflow({ status: WorkflowStatus.APPROVED }) as never,
          staffs: [makeStaff({ approverSetting: "ADMINS" })],
        }),
      );
      expect(result.current.approvalSteps[1].state).toBe("承認済み");
    });
  });
});
