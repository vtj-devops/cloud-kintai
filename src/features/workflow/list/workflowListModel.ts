import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";

import {
  CATEGORY_LABELS,
  CLOCK_CORRECTION_CHECK_OUT_LABEL,
  CLOCK_CORRECTION_LABEL,
  getWorkflowCategoryLabel,
  STATUS_LABELS,
} from "@/entities/workflow/lib/workflowLabels";

const CATEGORY_LABELS_REVERSE = Object.entries(CATEGORY_LABELS).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {
    [CLOCK_CORRECTION_LABEL]: WorkflowCategory.CLOCK_CORRECTION,
    [CLOCK_CORRECTION_CHECK_OUT_LABEL]: WorkflowCategory.CLOCK_CORRECTION,
  } as Record<string, string>,
);

const STATUS_LABELS_REVERSE = Object.entries(STATUS_LABELS).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<string, string>,
);

export type WorkflowLike = {
  id?: string | null;
  staffId?: string | null;
  status?: WorkflowStatus | null;
  category?: WorkflowCategory | null;
  createdAt?: string | null;
  overTimeDetails?: { date?: string | null; reason?: string | null } | null;
};

export type WorkflowListItem = {
  name: string;
  category: string;
  status: string;
  rawCategory?: string;
  rawStatus?: string;
  rawId?: string;
  rawStaffId?: string;
  createdAt: string;
  applicationDate?: string;
};

export type WorkflowListFilters = {
  name?: string;
  category?: string;
  status?: string[];
  applicationFrom?: string;
  applicationTo?: string;
  createdFrom?: string;
  createdTo?: string;
};

export const DEFAULT_STATUS_FILTERS: WorkflowStatus[] = [
  WorkflowStatus.DRAFT,
  WorkflowStatus.SUBMITTED,
  WorkflowStatus.PENDING,
  WorkflowStatus.REJECTED,
];

const formatIsoDate = (value?: string | null): string => {
  if (!value) return "";
  const [date] = value.split("T");
  return date ?? "";
};

export function mapWorkflowsToListItems<T extends WorkflowLike>(
  workflows: T[] | null | undefined,
  currentStaffId?: string,
): WorkflowListItem[] {
  if (!workflows || !currentStaffId) {
    return [];
  }

  const mapped = workflows
    .filter((workflow) => workflow.staffId === currentStaffId)
    .map((workflow) => {
      const status = workflow.status ?? undefined;
      const category = workflow.category ?? undefined;
      const categoryLabel = category ? getWorkflowCategoryLabel(workflow) : "";
      const createdDate = formatIsoDate(workflow.createdAt);
      return {
        name: workflow.id ?? "",
        rawStaffId: workflow.staffId ?? undefined,
        rawId: workflow.id ?? undefined,
        rawStatus: status,
        status: status ? (STATUS_LABELS[status] ?? status) : "",
        rawCategory: category,
        category: categoryLabel,
        createdAt: createdDate,
        applicationDate: workflow.overTimeDetails?.date ?? createdDate,
      } satisfies WorkflowListItem;
    });

  return mapped.toSorted((a, b) => {
    const aApp = a.applicationDate ?? "";
    const bApp = b.applicationDate ?? "";
    if (aApp && bApp) return bApp.localeCompare(aApp);
    if (aApp && !bApp) return -1;
    if (!aApp && bApp) return 1;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
}

export function applyWorkflowFilters(
  items: WorkflowListItem[],
  filters: WorkflowListFilters,
): WorkflowListItem[] {
  return items.filter((item) => {
    if (filters.name && !item.name.includes(filters.name)) return false;

    if (filters.category) {
      const categoryCandidates = new Set<string>();
      categoryCandidates.add(filters.category);
      const labelFromEnum =
        CATEGORY_LABELS[filters.category as WorkflowCategory];
      if (labelFromEnum) categoryCandidates.add(labelFromEnum);
      const enumFromLabel = CATEGORY_LABELS_REVERSE[filters.category];
      if (enumFromLabel) categoryCandidates.add(enumFromLabel);

      const matches =
        (item.rawCategory && categoryCandidates.has(item.rawCategory)) ||
        categoryCandidates.has(item.category);

      if (!matches) return false;
    }

    const statusFilters = filters.status?.filter(Boolean) ?? [];
    if (statusFilters.length > 0) {
      const statusCandidates = new Set<string>();
      statusFilters.forEach((status) => {
        statusCandidates.add(status);
        const labelFromEnum = STATUS_LABELS[status as WorkflowStatus];
        if (labelFromEnum) statusCandidates.add(labelFromEnum);
        const enumFromLabel = STATUS_LABELS_REVERSE[status];
        if (enumFromLabel) statusCandidates.add(enumFromLabel);
      });

      const matches =
        (item.rawStatus && statusCandidates.has(item.rawStatus)) ||
        statusCandidates.has(item.status);

      if (!matches) return false;
    }

    if (
      filters.applicationFrom &&
      (!item.applicationDate || item.applicationDate < filters.applicationFrom)
    ) {
      return false;
    }
    if (
      filters.applicationTo &&
      (!item.applicationDate || item.applicationDate > filters.applicationTo)
    ) {
      return false;
    }
    if (filters.createdFrom && item.createdAt < filters.createdFrom) {
      return false;
    }
    if (filters.createdTo && item.createdAt > filters.createdTo) {
      return false;
    }

    return true;
  });
}

export const isWorkflowFilterActive = (
  filters: WorkflowListFilters,
): boolean => {
  const statusFilters = filters.status?.filter(Boolean) ?? [];
  const statusDiffersFromDefault =
    statusFilters.length !== DEFAULT_STATUS_FILTERS.length ||
    DEFAULT_STATUS_FILTERS.some((status) => !statusFilters.includes(status));

  return Boolean(
    filters.name ||
    filters.category ||
    (statusFilters.length > 0 && statusDiffersFromDefault) ||
    filters.applicationFrom ||
    filters.applicationTo ||
    filters.createdFrom ||
    filters.createdTo,
  );
};
