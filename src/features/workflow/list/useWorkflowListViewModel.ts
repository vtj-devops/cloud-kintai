import { AuthContext } from "@app/providers/auth/AuthContext";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import useWorkflows from "@entities/workflow/model/useWorkflows";
import { useContext, useMemo } from "react";

import { useWorkflowListFilters } from "./useWorkflowListFilters";
import type { WorkflowListItem } from "./workflowListModel";

export type WorkflowListViewModel = ReturnType<typeof useWorkflowListViewModel>;

export type WorkflowListFilterActions = Pick<
  WorkflowListViewModel,
  "setFilter" | "clearFilters"
>;

export const useWorkflowListViewModel = () => {
  const { cognitoUser, authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { workflows, loading, error } = useWorkflows({ isAuthenticated });
  const { staffs } = useStaffs({ isAuthenticated });

  const currentStaffId = useMemo(() => {
    if (!cognitoUser?.id) return undefined;
    return staffs.find((staff) => staff.cognitoUserId === cognitoUser.id)?.id;
  }, [cognitoUser, staffs]);

  const filterState = useWorkflowListFilters({ workflows, currentStaffId });
  const normalizedError = error ?? undefined;

  return {
    isAuthenticated,
    currentStaffId,
    loading,
    error: normalizedError,
    ...filterState,
  } satisfies {
    isAuthenticated: boolean;
    currentStaffId?: WorkflowListItem["rawId"];
    loading: boolean;
    error?: string;
    filteredItems: WorkflowListItem[];
    filters: typeof filterState.filters;
    anyFilterActive: boolean;
    setFilter: typeof filterState.setFilter;
    clearFilters: typeof filterState.clearFilters;
  };
};
