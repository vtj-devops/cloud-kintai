import { AuthContext } from "@app/providers/auth/AuthContext";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  DailyReportReactionType,
  DailyReportStatus,
} from "@shared/api/graphql/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import AdminDailyReportDetail from "./AdminDailyReportDetail";

const fetchStaffMock = jest.fn();
const staffsHookMock = jest.fn();
const cognitoUserHookMock = jest.fn();
const logDailyReportCommentAddMock = jest.fn();
const logDailyReportReactionUpdateMock = jest.fn();

jest.mock("@entities/staff/model/useStaff/fetchStaff", () => ({
  __esModule: true,
  default: (...args: unknown[]) => fetchStaffMock(...args),
}));

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  __esModule: true,
  StaffRole: {
    ADMIN: "Admin",
    STAFF: "Staff",
  },
  useStaffs: (...args: unknown[]) => staffsHookMock(...args),
}));

jest.mock("@entities/staff/model/useCognitoUser", () => ({
  __esModule: true,
  default: (...args: unknown[]) => cognitoUserHookMock(...args),
}));

jest.mock("@/features/attendance/daily-report/lib/sendDailyReportCommentNotification", () => ({
  sendDailyReportCommentNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/entities/operation-log/model/dailyReportOperationLog", () => ({
  __esModule: true,
  logDailyReportCommentAdd: (...args: unknown[]) =>
    logDailyReportCommentAddMock(...args),
  logDailyReportReactionUpdate: (...args: unknown[]) =>
    logDailyReportReactionUpdateMock(...args),
}));

describe("AdminDailyReportDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    staffsHookMock.mockReturnValue({
      staffs: [
        {
          id: "staff-1",
          cognitoUserId: "staff-cognito",
          familyName: "対象",
          givenName: "者",
          mailAddress: "staff@example.com",
          role: StaffRole.STAFF,
        },
        {
          id: "admin-staff",
          cognitoUserId: "admin-cognito",
          familyName: "管理",
          givenName: "者",
          mailAddress: "admin@example.com",
          role: StaffRole.ADMIN,
        },
      ],
      loading: false,
    });
    cognitoUserHookMock.mockReturnValue({
      cognitoUser: {
        id: "admin-cognito",
      },
    });
    fetchStaffMock.mockResolvedValue({
      id: "admin-staff",
      familyName: "管理",
      givenName: "者",
    });
    logDailyReportCommentAddMock.mockResolvedValue(undefined);
    logDailyReportReactionUpdateMock.mockResolvedValue(undefined);

    jest.spyOn(graphqlClient, "graphql").mockImplementation(
      (({ query, variables }: { query: string; variables?: Record<string, unknown> }) => {
        if (query.includes("query GetDailyReport")) {
          return Promise.resolve({
            data: {
              getDailyReport: {
                __typename: "DailyReport",
                id: (variables?.id as string | undefined) ?? "report-1",
                staffId: "staff-1",
                reportDate: "2026-04-01",
                title: "日報タイトル",
                content: "日報本文",
                status: DailyReportStatus.SUBMITTED,
                updatedAt: "2026-04-01T09:00:00.000Z",
                createdAt: "2026-04-01T09:00:00.000Z",
                reactions: [],
                comments: [],
                version: 1,
              },
            },
          });
        }

        if (query.includes("mutation UpdateDailyReport")) {
          const input = variables?.input as { comments?: unknown[] } | undefined;
          const hasComments = Boolean(input?.comments?.length);
          return Promise.resolve({
            data: {
              updateDailyReport: {
                __typename: "DailyReport",
                id: "report-1",
                staffId: "staff-1",
                reportDate: "2026-04-01",
                title: "日報タイトル",
                content: "日報本文",
                status: DailyReportStatus.SUBMITTED,
                updatedAt: "2026-04-01T09:05:00.000Z",
                createdAt: "2026-04-01T09:00:00.000Z",
                reactions: hasComments
                  ? [
                      {
                        __typename: "DailyReportReaction",
                        staffId: "admin-staff",
                        type: DailyReportReactionType.CHEER,
                        createdAt: "2026-04-01T09:01:00.000Z",
                      },
                    ]
                  : [
                      {
                        __typename: "DailyReportReaction",
                        staffId: "admin-staff",
                        type: DailyReportReactionType.CHEER,
                        createdAt: "2026-04-01T09:01:00.000Z",
                      },
                    ],
                comments: hasComments
                  ? [
                      {
                        __typename: "DailyReportComment",
                        id: "comment-1",
                        staffId: "admin-staff",
                        authorName: "管理 者",
                        body: "コメント本文",
                        createdAt: "2026-04-01T09:02:00.000Z",
                      },
                    ]
                  : [],
                version: hasComments ? 3 : 2,
              },
            },
          });
        }

        throw new Error(`Unexpected query: ${query}`);
      }) as typeof graphqlClient.graphql,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs reaction updates and added comments", async () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            signOut: jest.fn(),
            signIn: jest.fn(),
            isCognitoUserRole: () => false,
            authStatus: "authenticated",
            roles: [],
          }}
        >
          <AdminDailyReportDetail overrideId="report-1" />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    await screen.findByText("日報タイトル");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /GOOD/ })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /GOOD/ }));

    await waitFor(() => {
      expect(logDailyReportReactionUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          actorStaffId: "admin-staff",
          operation: "add",
          reactionType: DailyReportReactionType.CHEER,
        }),
      );
    });

    fireEvent.change(screen.getByPlaceholderText("コメントを入力"), {
      target: { value: "コメント本文" },
    });
    fireEvent.click(screen.getByRole("button", { name: "コメントを追加" }));

    await waitFor(() => {
      expect(logDailyReportCommentAddMock).toHaveBeenCalledWith(
        expect.objectContaining({
          actorStaffId: "admin-staff",
          comment: expect.objectContaining({
            body: "コメント本文",
          }),
        }),
      );
    });
  });
});
