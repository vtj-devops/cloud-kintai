import { renderHook } from "@testing-library/react";

import { useOvertimeRequest } from "../useOvertimeRequest";

// Mock RTK query hook
jest.mock("@entities/workflow/api/workflowApi", () => ({
  useGetWorkflowsQuery: jest.fn(() => ({ data: undefined })),
}));

describe("useOvertimeRequest", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("スタッフID がない場合は何も返さない", () => {
    const { result } = renderHook(() =>
      useOvertimeRequest({
        staffId: null,
        workDate: "2024-01-15",
        isAuthenticated: true,
      }),
    );

    expect(result.current.hasOvertimeRequest).toBe(false);
    expect(result.current.overtimeRequestEndTime).toBeNull();
  });

  it("認証されていない場合は何も返さない", () => {
    const { result } = renderHook(() =>
      useOvertimeRequest({
        staffId: "staff-123",
        workDate: "2024-01-15",
        isAuthenticated: false,
      }),
    );

    expect(result.current.hasOvertimeRequest).toBe(false);
    expect(result.current.overtimeRequestEndTime).toBeNull();
  });

  it("workDate がない場合は何も返さない", () => {
    const { result } = renderHook(() =>
      useOvertimeRequest({
        staffId: "staff-123",
        workDate: null,
        isAuthenticated: true,
      }),
    );

    expect(result.current.hasOvertimeRequest).toBe(false);
    expect(result.current.overtimeRequestEndTime).toBeNull();
  });
});
