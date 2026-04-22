import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import type { WorkflowCategoryOrderItem } from "@entities/workflow/lib/workflowLabels";
import { WorkflowCategory } from "@shared/api/graphql/types";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ContextType, ReactNode } from "react";

import { useAdminWorkflowSettings } from "./useAdminWorkflowSettings";

jest.mock("@app/hooks", () => ({
  useAppDispatchV2: () => jest.fn(),
}));

jest.mock("@entities/workflow-template/model/useWorkflowTemplates", () => ({
  __esModule: true,
  default: () => ({
    templates: [],
    loading: false,
    error: null,
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    removeTemplate: jest.fn(),
  }),
}));

const initialOrder: WorkflowCategoryOrderItem[] = [
  {
    category: WorkflowCategory.PAID_LEAVE,
    label: "有給休暇申請",
    displayOrder: 0,
    enabled: true,
  },
  {
    category: WorkflowCategory.OVERTIME,
    label: "残業申請",
    displayOrder: 1,
    enabled: true,
  },
];

describe("useAdminWorkflowSettings", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("カテゴリ変更後に自動保存する", async () => {
    const saveConfig = jest.fn().mockResolvedValue(undefined);
    const fetchConfig = jest.fn().mockResolvedValue(undefined);
    const currentOrder = initialOrder;

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider
        value={{
          signOut: jest.fn(),
          signIn: jest.fn(),
          isCognitoUserRole: jest.fn(),
          authStatus: "authenticated",
        }}
      >
        <AppConfigContext.Provider
          value={{
            fetchConfig,
            saveConfig,
            getConfigId: () => "config-1",
            getWorkflowCategoryOrder: () => currentOrder,
          } as unknown as ContextType<typeof AppConfigContext>}
        >
          {children}
        </AppConfigContext.Provider>
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAdminWorkflowSettings(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.items).toHaveLength(2));

    act(() => {
      result.current.handleToggleEnabled(0);
    });

    expect(saveConfig).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(599);
    });

    expect(saveConfig).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    await waitFor(() => expect(saveConfig).toHaveBeenCalledTimes(1));

    expect(saveConfig).toHaveBeenCalledWith({
      id: "config-1",
      workflowCategoryOrder: {
        categories: [
          {
            category: WorkflowCategory.PAID_LEAVE,
            label: "有給休暇申請",
            displayOrder: 0,
            enabled: false,
          },
          {
            category: WorkflowCategory.OVERTIME,
            label: "残業申請",
            displayOrder: 1,
            enabled: true,
          },
        ],
      },
    });
  });
});
