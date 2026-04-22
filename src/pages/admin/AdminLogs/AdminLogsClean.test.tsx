import type { OperationLog } from "@shared/api/graphql/types";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import AdminLogsClean from "./AdminLogsClean";

const adminOperationLogsHookMock = jest.fn();

jest.mock("@entities/staff/model/useStaff/fetchStaff", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@entities/staff/model/useStaffs/fetchStaffs", () => ({
  __esModule: true,
  default: jest.fn(() => new Promise(() => {})),
}));

jest.mock("@entities/operation-log/model/useAdminOperationLogs", () => ({
  __esModule: true,
  default: (...args: unknown[]) => adminOperationLogsHookMock(...args),
}));

jest.mock("@/shared/ui/layout", () => ({
  PageContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("AdminLogsClean", () => {
  type OperationLogTestOverrides = Partial<Record<keyof OperationLog, unknown>>;

  const createLog = (overrides: OperationLogTestOverrides = {}) =>
    ({
      id: "log-1",
      action: "attendance.update",
      resource: "attendance",
      resourceId: "attendance-1",
      resourceKey: "attendance#attendance-1",
      summary: "summary text",
      details: null,
      timestamp: "2026-03-31T10:00:00.000Z",
      createdAt: "2026-03-31T10:00:00.000Z",
      updatedAt: "2026-03-31T10:00:00.000Z",
      ...overrides,
    }) as OperationLog;

  beforeAll(() => {
    class IntersectionObserverMock {
      observe() {}
      disconnect() {}
    }

    Object.defineProperty(globalThis, "IntersectionObserver", {
      writable: true,
      configurable: true,
      value: IntersectionObserverMock,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    adminOperationLogsHookMock.mockReturnValue({
      logs: [
        createLog({
          summary: {
            message: "object summary",
          } as unknown as OperationLog["summary"],
        }),
      ],
      loading: false,
      error: null,
      nextToken: null,
      loadInitial: jest.fn().mockResolvedValue(undefined),
      loadMore: jest.fn().mockResolvedValue(undefined),
    });
  });

  it("does not render [object Object] for object summaries", () => {
    render(<AdminLogsClean />);

    expect(
      screen.getByRole("columnheader", { name: "日時" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "概要" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('{"message":"object summary"}').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("[object Object]")).not.toBeInTheDocument();
  });

  it("renders anomalous resource values safely", () => {
    adminOperationLogsHookMock.mockReturnValue({
      logs: [
        createLog({
          resourceKey: {
            key: "attendance#attendance-1",
          } as unknown as OperationLog["resourceKey"],
          summary: "resource key object",
        }),
        createLog({
          id: "log-2",
          resourceKey: null,
          resource: {
            name: "attendance",
          } as unknown as OperationLog["resource"],
          resourceId: ["attendance-2"] as unknown as OperationLog["resourceId"],
          summary: "resource fallback object",
        }),
      ],
      loading: false,
      error: null,
      nextToken: null,
      loadInitial: jest.fn().mockResolvedValue(undefined),
      loadMore: jest.fn().mockResolvedValue(undefined),
    });

    render(<AdminLogsClean />);

    expect(
      screen.getByText('{"key":"attendance#attendance-1"}'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('{"name":"attendance"} ["attendance-2"]'),
    ).toBeInTheDocument();
    expect(screen.queryByText("[object Object]")).not.toBeInTheDocument();
  });

  it("does not crash on non-string actor ids or userAgent values", () => {
    adminOperationLogsHookMock.mockReturnValue({
      logs: [
        createLog({
          staffId: {
            raw: "actor-1",
          } as unknown as OperationLog["staffId"],
          targetStaffId: {
            raw: "target-1",
          } as unknown as OperationLog["targetStaffId"],
          userAgent: {
            browser: "Chrome",
          } as unknown as OperationLog["userAgent"],
          summary: "invalid actor and userAgent",
        }),
      ],
      loading: false,
      error: null,
      nextToken: null,
      loadInitial: jest.fn().mockResolvedValue(undefined),
      loadMore: jest.fn().mockResolvedValue(undefined),
    });

    render(<AdminLogsClean />);

    expect(screen.getByText('{"raw":"actor-1"}')).toBeInTheDocument();
    expect(screen.getByText('{"raw":"target-1"}')).toBeInTheDocument();
    expect(screen.queryByText("Chrome")).not.toBeInTheDocument();
    expect(screen.queryByText("[object Object]")).not.toBeInTheDocument();
  });
});
