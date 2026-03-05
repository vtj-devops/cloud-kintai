import { WorkflowCategory } from "@shared/api/graphql/types";

import {
  CATEGORY_LABELS,
  CLOCK_CORRECTION_CHECK_IN_LABEL,
  CLOCK_CORRECTION_CHECK_OUT_LABEL,
  getEnabledWorkflowCategories,
  getWorkflowCategoryLabel,
  getWorkflowCategoryOrder,
  normalizeWorkflowCategoryOrder,
  resolveClockCorrectionLabel,
  REVERSE_CATEGORY,
  REVERSE_STATUS,
  STATUS_LABELS,
} from "../workflowLabels";

describe("workflowLabels", () => {
  it("resolves clock correction labels based on reason", () => {
    expect(resolveClockCorrectionLabel(CLOCK_CORRECTION_CHECK_IN_LABEL)).toBe(
      CLOCK_CORRECTION_CHECK_IN_LABEL,
    );
    expect(resolveClockCorrectionLabel(CLOCK_CORRECTION_CHECK_OUT_LABEL)).toBe(
      CLOCK_CORRECTION_CHECK_OUT_LABEL,
    );
    expect(resolveClockCorrectionLabel(undefined)).toBe(
      "打刻修正(出勤/退勤忘れ)",
    );
  });

  it("returns category label with clock correction handled via reason", () => {
    expect(
      getWorkflowCategoryLabel({
        category: WorkflowCategory.CLOCK_CORRECTION,
        overTimeDetails: { reason: CLOCK_CORRECTION_CHECK_OUT_LABEL },
      }),
    ).toBe(CLOCK_CORRECTION_CHECK_OUT_LABEL);

    expect(
      getWorkflowCategoryLabel({ category: WorkflowCategory.PAID_LEAVE }),
    ).toBe(CATEGORY_LABELS[WorkflowCategory.PAID_LEAVE]);
  });

  it("returns '-' when category is missing", () => {
    expect(getWorkflowCategoryLabel(null)).toBe("-");
    expect(getWorkflowCategoryLabel({})).toBe("-");
  });

  it("includes reverse mappings for category and status labels", () => {
    Object.entries(CATEGORY_LABELS).forEach(([key, label]) => {
      expect(REVERSE_CATEGORY[label]).toBe(key);
    });
    expect(REVERSE_CATEGORY[CLOCK_CORRECTION_CHECK_IN_LABEL]).toBe(
      WorkflowCategory.CLOCK_CORRECTION,
    );
    expect(REVERSE_CATEGORY[CLOCK_CORRECTION_CHECK_OUT_LABEL]).toBe(
      WorkflowCategory.CLOCK_CORRECTION,
    );

    Object.entries(STATUS_LABELS).forEach(([key, label]) => {
      expect(REVERSE_STATUS[label]).toBe(key);
    });
  });

  it("normalizes workflow category order and fills missing categories", () => {
    const normalized = normalizeWorkflowCategoryOrder([
      {
        category: WorkflowCategory.OVERTIME,
        label: "残業申請",
        displayOrder: 0,
        enabled: true,
      },
      {
        category: WorkflowCategory.PAID_LEAVE,
        label: "有給休暇申請",
        displayOrder: 1,
        enabled: false,
      },
    ]);

    expect(normalized[0]?.category).toBe(WorkflowCategory.OVERTIME);
    expect(normalized[1]?.category).toBe(WorkflowCategory.PAID_LEAVE);
    expect(
      normalized.some(
        (item) => item.category === WorkflowCategory.CLOCK_CORRECTION,
      ),
    ).toBe(true);
    expect(
      normalized.some((item) => item.category === WorkflowCategory.ABSENCE),
    ).toBe(true);
  });

  it("returns enabled categories from appConfig workflowCategoryOrder", () => {
    const enabled = getEnabledWorkflowCategories({
      workflowCategoryOrder: {
        categories: [
          {
            category: WorkflowCategory.PAID_LEAVE,
            label: "有給休暇申請",
            displayOrder: 0,
            enabled: true,
          },
          {
            category: WorkflowCategory.ABSENCE,
            label: "欠勤申請",
            displayOrder: 1,
            enabled: false,
          },
        ],
      },
    });

    expect(
      enabled.some((item) => item.category === WorkflowCategory.PAID_LEAVE),
    ).toBe(true);
    expect(
      enabled.some((item) => item.category === WorkflowCategory.ABSENCE),
    ).toBe(false);
  });

  it("falls back to default order when appConfig is missing", () => {
    const categories = getWorkflowCategoryOrder(undefined);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]?.category).toBe(WorkflowCategory.PAID_LEAVE);
  });
});
