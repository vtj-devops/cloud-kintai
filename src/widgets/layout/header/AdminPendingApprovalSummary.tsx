import { hasUnapprovedChangeRequest } from "@entities/attendance/lib/ChangeRequest";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import useWorkflows from "@entities/workflow/model/useWorkflows";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { listAttendances } from "@shared/api/graphql/documents/queries";
import {
  onCreateAttendance,
  onDeleteAttendance,
  onUpdateAttendance,
} from "@shared/api/graphql/documents/subscriptions";
import {
  ListAttendancesQuery,
  WorkflowStatus,
} from "@shared/api/graphql/types";
import { createLogger } from "@shared/lib/logger";
import { useAuthSessionSummary } from "@shared/lib/useAuthSessionSummary";
import { GraphQLResult } from "aws-amplify/api";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

import AdminSummaryCard from "./AdminSummaryCard";

const logger = createLogger("AdminPendingApprovalSummary");
const ATTENDANCE_LOOKBACK_DAYS = 30;
const PENDING_WORKFLOW_STATUSES = new Set<WorkflowStatus>([
  WorkflowStatus.SUBMITTED,
  WorkflowStatus.PENDING,
]);

type AdminPendingApprovalSummaryProps = {
  layoutMode?: "default" | "inline-cards" | "two-columns";
  showAdminOnlyTag?: boolean;
  visualVariant?: "default" | "dashboard";
};

export default function AdminPendingApprovalSummary({
  layoutMode = "default",
  showAdminOnlyTag = true,
  visualVariant = "default",
}: AdminPendingApprovalSummaryProps) {
  const { isAuthenticated, isCognitoUserRole } = useAuthSessionSummary();

  const isAdminUser = useMemo(
    () =>
      isCognitoUserRole(StaffRole.ADMIN) ||
      isCognitoUserRole(StaffRole.STAFF_ADMIN) ||
      isCognitoUserRole(StaffRole.OWNER),
    [isCognitoUserRole],
  );
  const { workflows, loading: workflowLoading = false } = useWorkflows({
    isAuthenticated: isAuthenticated && isAdminUser,
  });

  const [pendingAttendanceCount, setPendingAttendanceCount] = useState(0);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const pendingWorkflowCount = useMemo(
    () =>
      (workflows ?? []).filter((workflow) =>
        workflow.status ? PENDING_WORKFLOW_STATUSES.has(workflow.status) : false,
      ).length,
    [workflows],
  );

  const fetchPendingAttendanceCount = useCallback(async () => {
    if (!isAuthenticated || !isAdminUser) {
      return 0;
    }

    const sinceWorkDate = dayjs()
      .subtract(ATTENDANCE_LOOKBACK_DAYS, "day")
      .format("YYYY-MM-DD");

    let nextToken: string | null = null;
    const pendingEntryKeys = new Set<string>();

    do {
      const response = (await graphqlClient.graphql({
        query: listAttendances,
        variables: {
          limit: 100,
          filter: {
            workDate: {
              ge: sinceWorkDate,
            },
          },
          nextToken,
        },
        authMode: "userPool",
      })) as GraphQLResult<ListAttendancesQuery>;

      if (response.errors?.length) {
        throw new Error(response.errors[0].message);
      }

      const connection = response.data?.listAttendances;
      const items = connection?.items ?? [];

      items.forEach((attendance) => {
        if (!attendance?.staffId) {
          return;
        }

        if (!hasUnapprovedChangeRequest(attendance.changeRequests)) {
          return;
        }

        const workDate = attendance.workDate ?? "";
        const entryKey = `${attendance.staffId}:${workDate}`;
        pendingEntryKeys.add(entryKey);
      });

      nextToken = connection?.nextToken ?? null;
    } while (nextToken);

    return pendingEntryKeys.size;
  }, [isAdminUser, isAuthenticated]);

  const recalculatePendingAttendanceCount = useCallback(async () => {
    setAttendanceLoading(true);

    try {
      const count = await fetchPendingAttendanceCount();
      setPendingAttendanceCount(count);
    } catch (error) {
      logger.error("Failed to fetch pending attendance count", error);
    } finally {
      setAttendanceLoading(false);
    }
  }, [fetchPendingAttendanceCount]);

  useEffect(() => {
    if (!isAuthenticated || !isAdminUser) {
      setPendingAttendanceCount(0);
      setAttendanceLoading(false);
      return;
    }

    void recalculatePendingAttendanceCount();
  }, [isAdminUser, isAuthenticated, recalculatePendingAttendanceCount]);

  useEffect(() => {
    if (!isAuthenticated || !isAdminUser) {
      return;
    }

    let isMounted = true;
    let recalculateTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRecalculate = () => {
      if (recalculateTimer) {
        clearTimeout(recalculateTimer);
      }

      recalculateTimer = setTimeout(() => {
        if (!isMounted) {
          return;
        }

        void recalculatePendingAttendanceCount();
      }, 300);
    };

    const createSubscription = graphqlClient
      .graphql({
        query: onCreateAttendance,
        authMode: "userPool",
      })
      .subscribe({
        next: () => {
          scheduleRecalculate();
        },
        error: (error: unknown) => {
          logger.error("Attendance create subscription error", error);
        },
      });

    const updateSubscription = graphqlClient
      .graphql({
        query: onUpdateAttendance,
        authMode: "userPool",
      })
      .subscribe({
        next: () => {
          scheduleRecalculate();
        },
        error: (error: unknown) => {
          logger.error("Attendance update subscription error", error);
        },
      });

    const deleteSubscription = graphqlClient
      .graphql({
        query: onDeleteAttendance,
        authMode: "userPool",
      })
      .subscribe({
        next: () => {
          scheduleRecalculate();
        },
        error: (error: unknown) => {
          logger.error("Attendance delete subscription error", error);
        },
      });

    const subscriptions = [
      createSubscription,
      updateSubscription,
      deleteSubscription,
    ];

    return () => {
      isMounted = false;

      if (recalculateTimer) {
        clearTimeout(recalculateTimer);
      }

      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [isAdminUser, isAuthenticated, recalculatePendingAttendanceCount]);

  if (!isAuthenticated || !isAdminUser) {
    return null;
  }

  const attendanceCountLabel = attendanceLoading
    ? "集計中"
    : `${pendingAttendanceCount}件`;
  const workflowCountLabel = workflowLoading ? "集計中" : `${pendingWorkflowCount}件`;
  const compact = layoutMode === "inline-cards";
  const containerClassName =
    layoutMode === "inline-cards"
      ? "contents"
      : layoutMode === "two-columns"
        ? "grid grid-cols-2 gap-3"
        : "grid grid-cols-1 gap-3";
  const cardClassName = layoutMode === "inline-cards" ? "" : "";

  return (
    <div
      data-testid="admin-pending-approval-summary"
      className={containerClassName}
    >
      <AdminSummaryCard
        testId="admin-pending-attendance-card"
        title="勤怠修正申請"
        description="未承認の勤怠修正申請"
        countLabel={attendanceCountLabel}
        to="/admin/attendances"
        className={cardClassName}
        showAdminOnlyTag={showAdminOnlyTag}
        compact={compact}
        visualVariant={visualVariant}
      />
      <AdminSummaryCard
        testId="admin-pending-workflow-card"
        title="ワークフロー申請"
        description="未承認のワークフロー申請"
        countLabel={workflowCountLabel}
        to="/admin/workflow"
        className={cardClassName}
        showAdminOnlyTag={showAdminOnlyTag}
        compact={compact}
        visualVariant={visualVariant}
      />
    </div>
  );
}
