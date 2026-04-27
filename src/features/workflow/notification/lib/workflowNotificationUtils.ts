import {
  StaffRole,
  StaffType,
} from "@entities/staff/model/useStaffs/useStaffs";
import {
  OnCreateWorkflowSubscription,
  WorkflowCategory,
} from "@shared/api/graphql/types";

const WORKFLOW_CATEGORY_LABELS: Record<WorkflowCategory, string> = {
  [WorkflowCategory.PAID_LEAVE]: "有給休暇申請",
  [WorkflowCategory.ABSENCE]: "欠勤申請",
  [WorkflowCategory.OVERTIME]: "時間外勤務申請",
  [WorkflowCategory.CLOCK_CORRECTION]: "勤怠修正申請",
  [WorkflowCategory.CUSTOM]: "その他申請",
  [WorkflowCategory.COMPENSATORY_LEAVE]: "振替休暇申請",
};

export const getStaffName = (staffs: StaffType[], staffId: string): string => {
  const staff = staffs.find((s) => s.id === staffId);
  if (!staff) return "スタッフ";
  return (
    `${staff.familyName || ""}${staff.givenName || ""}`.trim() || "スタッフ"
  );
};

export const getCategoryLabel = (
  workflow: OnCreateWorkflowSubscription["onCreateWorkflow"],
): string => {
  if (!workflow) return "申請";

  if (
    workflow.category === WorkflowCategory.CUSTOM &&
    workflow.customWorkflowTitle
  ) {
    return workflow.customWorkflowTitle;
  }

  return workflow.category
    ? WORKFLOW_CATEGORY_LABELS[workflow.category] || "申請"
    : "申請";
};

export const isAssignedAsApprover = (
  workflow: OnCreateWorkflowSubscription["onCreateWorkflow"],
  currentStaffId: string,
  staffs: StaffType[],
): boolean => {
  if (!workflow || !currentStaffId) return false;

  if (!workflow.assignedApproverStaffIds) return false;

  if (workflow.assignedApproverStaffIds.includes(currentStaffId)) return true;

  if (workflow.assignedApproverStaffIds.includes("ADMINS")) {
    const currentStaff = staffs.find((s) => s.id === currentStaffId);
    if (currentStaff?.role === StaffRole.ADMIN) return true;
  }

  return false;
};
