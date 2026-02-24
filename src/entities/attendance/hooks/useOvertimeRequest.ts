import { useGetWorkflowsQuery } from "@entities/workflow/api/workflowApi";
import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";
import { useMemo } from "react";

import { extractTimeFromISO } from "@/entities/attendance/validation/overtimeCheckValidator";

interface UseOvertimeRequestData {
  overtimeRequestEndTime: string | null;
  hasOvertimeRequest: boolean;
}

interface UseOvertimeRequestParams {
  staffId: string | null;
  workDate: string | null;
  isAuthenticated: boolean;
}

/**
 * 指定日の残業申請情報を取得するカスタムフック
 */
export function useOvertimeRequest({
  staffId,
  workDate,
  isAuthenticated,
}: UseOvertimeRequestParams): UseOvertimeRequestData {
  const { data: workflows } = useGetWorkflowsQuery(undefined, {
    skip: !isAuthenticated || !staffId,
  });

  const overtimeData = useMemo(() => {
    if (!workflows || !staffId || !workDate) {
      return {
        overtimeRequestEndTime: null,
        hasOvertimeRequest: false,
      };
    }

    // 指定日の承認済み残業申請を検索
    const overtimeWorkflow = workflows.find((workflow) => {
      // 本人の申請か確認
      if (workflow.staffId !== staffId) {
        return false;
      }

      // カテゴリが残業申請か確認
      if (workflow.category !== WorkflowCategory.OVERTIME) {
        return false;
      }

      // ステータスが承認済みか確認
      if (workflow.status !== WorkflowStatus.APPROVED) {
        return false;
      }

      // 日付が一致するか確認
      if (workflow.overTimeDetails?.date !== workDate) {
        return false;
      }

      return true;
    });

    if (!overtimeWorkflow) {
      return {
        overtimeRequestEndTime: null,
        hasOvertimeRequest: false,
      };
    }

    // 残業申請の終了時刻を抽出
    const endTime = extractTimeFromISO(
      overtimeWorkflow.overTimeDetails?.endTime || null,
    );

    return {
      overtimeRequestEndTime: endTime,
      hasOvertimeRequest: true,
    };
  }, [workflows, staffId, workDate]);

  return overtimeData;
}
