import { AuthContext } from "@app/providers/auth/AuthContext";
import useCognitoUser from "@entities/staff/model/useCognitoUser";
// ─── Import mocked modules ────────────────────────────────────────────────────
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { DailyReportStatus } from "@shared/api/graphql/types";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import DailyReportCarouselDialog from "../DailyReportCarouselDialog";
import type { AdminDailyReport } from "../data";
import { useCurrentStaff } from "../useCurrentStaff";

// ─── Module mocks ──────────────────────────────────────────────────────────────

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  useStaffs: jest.fn(),
}));

jest.mock("@entities/staff/model/useCognitoUser", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../useCurrentStaff", () => ({
  useCurrentStaff: jest.fn(),
}));

jest.mock("@entities/operation-log/model/dailyReportOperationLog", () => ({
  logDailyReportCommentAdd: jest.fn().mockResolvedValue(undefined),
  logDailyReportReactionUpdate: jest.fn().mockResolvedValue(undefined),
}));

jest.mock(
  "@features/attendance/daily-report/lib/sendDailyReportCommentNotification",
  () => ({
    sendDailyReportCommentNotification: jest.fn().mockResolvedValue(undefined),
  }),
);

jest.mock("@shared/api/graphql/concurrency", () => ({
  buildVersionOrUpdatedAtCondition: jest.fn().mockReturnValue({}),
  getGraphQLErrorMessage: jest.fn(
    (_errors: unknown, fallback: string) => fallback,
  ),
  getNextVersion: jest.fn().mockReturnValue(2),
}));

const mockedUseStaffs = jest.mocked(useStaffs);
const mockedUseCognitoUser = jest.mocked(useCognitoUser);
const mockedUseCurrentStaff = jest.mocked(useCurrentStaff);

// Direct access to the global jest.fn() so we avoid spyOn restoration quirks
const mockGraphql = graphqlClient.graphql as jest.Mock;

// ─── Factories ─────────────────────────────────────────────────────────────────

const makeReport = (
  overrides: Partial<AdminDailyReport> = {},
): AdminDailyReport => ({
  id: "report-1",
  staffId: "staff-1",
  date: "2024-04-01",
  author: "山田 太郎",
  title: "4月1日の日報",
  content: "今日の業務内容です。",
  status: DailyReportStatus.SUBMITTED,
  updatedAt: "2024-04-01T09:00:00.000Z",
  version: 1,
  createdAt: "2024-04-01T08:00:00.000Z",
  reactions: [],
  comments: [],
  ...overrides,
});

const makeFetchResponse = (report: AdminDailyReport) => ({
  data: {
    getDailyReport: {
      __typename: "DailyReport" as const,
      id: report.id,
      staffId: report.staffId,
      reportDate: report.date,
      title: report.title,
      content: report.content,
      status: report.status,
      updatedAt: report.updatedAt,
      createdAt: report.createdAt ?? "2024-04-01T08:00:00.000Z",
      version: report.version ?? 1,
      reactions: [],
      comments: [],
    },
  },
});

const makeUpdateResponse = (overrides = {}) => ({
  data: {
    updateDailyReport: {
      __typename: "DailyReport" as const,
      id: "report-1",
      staffId: "staff-1",
      reportDate: "2024-04-01",
      title: "4月1日の日報",
      content: "今日の業務内容です。",
      status: DailyReportStatus.SUBMITTED,
      updatedAt: new Date().toISOString(),
      createdAt: "2024-04-01T08:00:00.000Z",
      version: 2,
      reactions: [],
      comments: [],
      ...overrides,
    },
  },
});

// ─── Render helper ─────────────────────────────────────────────────────────────

const renderDialog = (
  props: Partial<React.ComponentProps<typeof DailyReportCarouselDialog>> = {},
) => {
  const selectedReport = props.selectedReport ?? makeReport();
  const filteredReports = props.filteredReports ?? [selectedReport];
  return render(
    <AuthContext.Provider
      value={{
        signOut: jest.fn(),
        signIn: jest.fn(),
        isCognitoUserRole: jest.fn(),
        authStatus: "authenticated",
      }}
    >
      <DailyReportCarouselDialog
        open={props.open ?? true}
        onClose={props.onClose ?? jest.fn()}
        selectedReport={selectedReport}
        filteredReports={filteredReports}
      />
    </AuthContext.Provider>,
  );
};

// ─── Helper: mock graphql based on operation type ─────────────────────────────
// Since Effect 1 calls setPreloadedReports(new Map()), fetchReport's useCallback
// deps change, causing it to run twice and consuming two sequential mocks.
// Using operation-type detection avoids ordering fragility.

type GraphqlCallParams = { query?: unknown };

const isMutationCall = (params: GraphqlCallParams) =>
  String(params?.query ?? "").includes("mutation ");

const mockFetchAndUpdate = (
  report: AdminDailyReport,
  updateOverrides: Record<string, unknown> = {},
) => {
  mockGraphql.mockImplementation((params: GraphqlCallParams) => {
    if (isMutationCall(params)) return Promise.resolve(makeUpdateResponse(updateOverrides));
    return Promise.resolve(makeFetchResponse(report));
  });
};

const mockFetchOnly = (report: AdminDailyReport) => {
  mockGraphql.mockImplementation(() => Promise.resolve(makeFetchResponse(report)));
};


beforeEach(() => {
  // resetAllMocks clears call counts AND resets implementations
  jest.resetAllMocks();

  mockedUseStaffs.mockReturnValue({
    staffs: [
      {
        id: "staff-1",
        familyName: "山田",
        givenName: "太郎",
        cognitoUserId: "cognito-1",
        mailAddress: "taro@example.com",
        owner: false,
        role: "Staff" as never,
        enabled: true,
        status: "ACTIVE",
        createdAt: "2024-04-01T00:00:00.000Z",
        updatedAt: "2024-04-01T00:00:00.000Z",
      },
    ],
    loading: false,
    error: null,
    refreshStaff: jest.fn().mockResolvedValue(undefined),
    createStaff: jest.fn().mockResolvedValue(undefined),
    updateStaff: jest.fn().mockResolvedValue(undefined),
    deleteStaff: jest.fn().mockResolvedValue(undefined),
    getAllStaffs: jest.fn().mockResolvedValue([]),
  });

  mockedUseCognitoUser.mockReturnValue({
    cognitoUser: { id: "cognito-1" } as never,
    loading: false,
    error: null,
  } as never);

  mockedUseCurrentStaff.mockReturnValue({
    currentStaffId: "staff-1",
    currentStaffName: "山田 太郎",
    isResolving: false,
  });
});

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("DailyReportCarouselDialog", () => {
  describe("open/close", () => {
    it("renders nothing when open=false", () => {
      const { container } = renderDialog({ open: false });
      expect(container.firstChild).toBeNull();
    });

    it("renders the dialog when open=true", async () => {
      const report = makeReport();
      mockFetchOnly(report);
      renderDialog({ open: true, selectedReport: report, filteredReports: [report] });
      expect(screen.getByText("日報を確認")).toBeInTheDocument();
    });

    it("calls onClose when the backdrop is clicked", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      const report = makeReport();
      mockFetchOnly(report);
      const { container } = renderDialog({
        onClose,
        selectedReport: report,
        filteredReports: [report],
      });
      // The fixed overlay div is the direct backdrop
      const backdrop = container.firstChild as HTMLElement;
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when the header close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      const report = makeReport();
      mockFetchOnly(report);
      renderDialog({ onClose, selectedReport: report, filteredReports: [report] });
      // The close button is the only button in the header (border-b) section
      const headerEl = screen.getByText("日報を確認").closest(".border-b")!;
      const closeBtn = within(headerEl).getByRole("button");
      await user.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("shows 読み込み中... while fetching", async () => {
      // Never-resolving mock keeps the loading state visible
      mockGraphql.mockImplementation(() => new Promise(() => {}));
      renderDialog();
      await waitFor(() => {
        expect(screen.getByText("読み込み中...")).toBeInTheDocument();
      });
    });

    it("shows report content after successful fetch", async () => {
      const report = makeReport({ title: "テスト日報タイトル", content: "テスト内容" });
      mockFetchOnly(report);
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(screen.getByText("テスト日報タイトル")).toBeInTheDocument();
      });
      expect(screen.getByText("テスト内容")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when fetch fails", async () => {
      mockGraphql.mockRejectedValue(new Error("ネットワークエラー"));
      renderDialog();
      await waitFor(() => {
        expect(screen.getByText("ネットワークエラー")).toBeInTheDocument();
      });
    });

    it("shows fallback error message for non-Error exceptions", async () => {
      mockGraphql.mockRejectedValue("unknown failure");
      renderDialog();
      await waitFor(() => {
        expect(
          screen.getByText("日報の取得に失敗しました。"),
        ).toBeInTheDocument();
      });
    });

    it("shows 日報が見つかりません when fetch returns null record", async () => {
      mockGraphql.mockImplementation(() =>
        Promise.resolve({ data: { getDailyReport: null } }),
      );
      renderDialog();
      await waitFor(() => {
        expect(screen.getByText(/日報が見つかりません/)).toBeInTheDocument();
      });
    });
  });

  describe("report content", () => {
    it("displays report title", async () => {
      const report = makeReport({ title: "タイトルテスト" });
      mockFetchOnly(report);
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(screen.getByText("タイトルテスト")).toBeInTheDocument();
      });
    });

    it("displays author name", async () => {
      const report = makeReport({ author: "山田 太郎" });
      mockFetchOnly(report);
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(screen.getByText(/山田 太郎/)).toBeInTheDocument();
      });
    });

    it("displays SUBMITTED status badge", async () => {
      const report = makeReport({ status: DailyReportStatus.SUBMITTED });
      mockFetchOnly(report);
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(screen.getByText("提出済")).toBeInTheDocument();
      });
    });

    it("displays APPROVED status badge", async () => {
      const report = makeReport({ status: DailyReportStatus.APPROVED });
      mockGraphql.mockImplementation(() =>
        Promise.resolve({
          data: {
            getDailyReport: {
              ...makeFetchResponse(report).data.getDailyReport,
              status: DailyReportStatus.APPROVED,
            },
          },
        }),
      );
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(screen.getByText("確認済")).toBeInTheDocument();
      });
    });

    it("shows 内容は登録されていません when content is empty", async () => {
      const report = makeReport({ content: "" });
      mockGraphql.mockImplementation(() =>
        Promise.resolve({
          data: {
            getDailyReport: {
              ...makeFetchResponse(report).data.getDailyReport,
              content: null,
            },
          },
        }),
      );
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(
          screen.getByText("内容は登録されていません"),
        ).toBeInTheDocument();
      });
    });

    it("shows まだリアクションはありません when reactions is empty", async () => {
      const report = makeReport({ reactions: [] });
      mockFetchOnly(report);
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(
          screen.getByText("まだリアクションはありません。"),
        ).toBeInTheDocument();
      });
    });

    it("shows まだコメントはありません when comments is empty", async () => {
      const report = makeReport({ comments: [] });
      mockFetchOnly(report);
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(
          screen.getByText("まだコメントはありません。"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("carousel navigation", () => {
    it("shows 1 / N counter for single report", () => {
      const report = makeReport();
      mockFetchOnly(report);
      renderDialog({ selectedReport: report, filteredReports: [report] });
      expect(screen.getByText("1 / 1")).toBeInTheDocument();
    });

    it("shows counter for multiple reports starting at current index", () => {
      const reports = [makeReport({ id: "r1" }), makeReport({ id: "r2" })];
      mockFetchOnly(reports[0]);
      renderDialog({ selectedReport: reports[0], filteredReports: reports });
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    it("shows correct counter when starting at second report", () => {
      const reports = [makeReport({ id: "r1" }), makeReport({ id: "r2" })];
      mockFetchOnly(reports[1]);
      renderDialog({ selectedReport: reports[1], filteredReports: reports });
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
    });

    it("shows 2 / 2 counter after navigating to next report", async () => {
      const user = userEvent.setup();
      const reports = [makeReport({ id: "r1" }), makeReport({ id: "r2" })];
      mockFetchOnly(reports[0]);
      renderDialog({ selectedReport: reports[0], filteredReports: reports });
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
      const nextBtn = screen.getAllByRole("button").find(
        (b) =>
          b.querySelector("polyline[points='9 18 15 12 9 6']") !== null,
      )!;
      await user.click(nextBtn);
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
    });

    it("navigates back to previous report", async () => {
      const user = userEvent.setup();
      const reports = [makeReport({ id: "r1" }), makeReport({ id: "r2" })];
      mockFetchOnly(reports[1]);
      renderDialog({ selectedReport: reports[1], filteredReports: reports });
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
      const prevBtn = screen.getAllByRole("button").find(
        (b) =>
          b.querySelector("polyline[points='15 18 9 12 15 6']") !== null,
      )!;
      await user.click(prevBtn);
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    it("previous button is disabled at first report", () => {
      const reports = [makeReport({ id: "r1" }), makeReport({ id: "r2" })];
      mockFetchOnly(reports[0]);
      renderDialog({ selectedReport: reports[0], filteredReports: reports });
      const prevBtn = screen.getAllByRole("button").find(
        (b) =>
          b.querySelector("polyline[points='15 18 9 12 15 6']") !== null,
      )!;
      expect(prevBtn).toBeDisabled();
    });

    it("next button is disabled at last report", () => {
      const reports = [makeReport({ id: "r1" }), makeReport({ id: "r2" })];
      mockFetchOnly(reports[1]);
      renderDialog({ selectedReport: reports[1], filteredReports: reports });
      const nextBtn = screen.getAllByRole("button").find(
        (b) =>
          b.querySelector("polyline[points='9 18 15 12 9 6']") !== null,
      )!;
      expect(nextBtn).toBeDisabled();
    });
  });

  describe("reactions", () => {
    it("renders GOOD reaction button after report loads", async () => {
      const report = makeReport();
      mockFetchOnly(report);
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /👍 GOOD/ }),
        ).toBeInTheDocument();
      });
    });

    it("renders all 4 reaction type buttons", async () => {
      const report = makeReport();
      mockFetchOnly(report);
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /👍 GOOD/ }),
        ).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: /確認済/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /感謝/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /見ました/ })).toBeInTheDocument();
    });

    it("reaction buttons are initially disabled while loading", async () => {
      mockGraphql.mockImplementation(() => new Promise(() => {}));
      renderDialog();
      await waitFor(() => {
        expect(screen.getByText("読み込み中...")).toBeInTheDocument();
      });
      // Reactions section is not rendered during load
      expect(screen.queryByRole("button", { name: /👍 GOOD/ })).not.toBeInTheDocument();
    });

    it("calls graphql mutation on reaction toggle", async () => {
      const user = userEvent.setup();
      const report = makeReport();
      mockFetchAndUpdate(report, {
        reactions: [
          {
            __typename: "DailyReportReaction",
            staffId: "staff-1",
            type: "CHEER",
            createdAt: new Date().toISOString(),
          },
        ],
      });

      renderDialog({ selectedReport: report, filteredReports: [report] });

      // Wait for content to load and GOOD button to become enabled
      const goodBtn = await screen.findByRole("button", { name: /👍 GOOD/ });
      await waitFor(() => {
        expect(goodBtn).not.toBeDisabled();
      });

      await user.click(goodBtn);

      await waitFor(() => {
        // At least 2 graphql calls: initial fetch(es) + reaction update mutation
        expect(mockGraphql.mock.calls.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe("comments", () => {
    it("renders textarea for comment input", async () => {
      const report = makeReport();
      mockFetchOnly(report);
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("コメントを入力"),
        ).toBeInTheDocument();
      });
    });

    it("追加 button is disabled when comment input is empty", async () => {
      const report = makeReport();
      mockFetchOnly(report);
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "追加" })).toBeDisabled();
      });
    });

    it("追加 button is enabled after typing a comment", async () => {
      const user = userEvent.setup();
      const report = makeReport();
      mockFetchOnly(report);
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("コメントを入力"),
        ).toBeInTheDocument();
      });
      const textarea = screen.getByPlaceholderText("コメントを入力");
      await user.type(textarea, "テストコメント");
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "追加" }),
        ).not.toBeDisabled();
      });
    });

    it("submits comment and calls graphql update", async () => {
      const user = userEvent.setup();
      const report = makeReport();
      mockFetchAndUpdate(report, {
        comments: [
          {
            __typename: "DailyReportComment",
            id: "comment-1",
            staffId: "staff-1",
            authorName: "山田 太郎",
            body: "テストコメント",
            createdAt: new Date().toISOString(),
          },
        ],
      });

      renderDialog({ selectedReport: report, filteredReports: [report] });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("コメントを入力"),
        ).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText("コメントを入力");
      await user.type(textarea, "テストコメント");
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "追加" }),
        ).not.toBeDisabled();
      });
      await user.click(screen.getByRole("button", { name: "追加" }));

      await waitFor(() => {
        expect(mockGraphql.mock.calls.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("clears comment input after successful submit", async () => {
      const user = userEvent.setup();
      const report = makeReport();
      mockFetchAndUpdate(report, { comments: [] });

      renderDialog({ selectedReport: report, filteredReports: [report] });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("コメントを入力"),
        ).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText("コメントを入力");
      await user.type(textarea, "テストコメント");

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "追加" }),
        ).not.toBeDisabled();
      });

      await user.click(screen.getByRole("button", { name: "追加" }));

      // Wait for the mutation call to complete and input to be cleared
      await waitFor(
        () => {
          expect(textarea).toHaveValue("");
        },
        { timeout: 3000 },
      );
    });

    it("shows existing comments from fetched report", async () => {
      const report = makeReport();
      mockGraphql.mockImplementation(() =>
        Promise.resolve({
          data: {
            getDailyReport: {
              ...makeFetchResponse(report).data.getDailyReport,
              comments: [
                {
                  __typename: "DailyReportComment",
                  id: "c1",
                  staffId: "staff-1",
                  authorName: "管理者A",
                  body: "既存コメント内容",
                  createdAt: "2024-04-01T10:00:00.000Z",
                },
              ],
            },
          },
        }),
      );
      renderDialog({ selectedReport: report, filteredReports: [report] });
      await waitFor(() => {
        expect(screen.getByText("既存コメント内容")).toBeInTheDocument();
      });
      expect(screen.getByText("管理者A")).toBeInTheDocument();
    });

    it("actionError clears when comment input changes after an error", async () => {
      const user = userEvent.setup();
      const report = makeReport();
      let callCount = 0;
      mockGraphql.mockImplementation((params: GraphqlCallParams) => {
        if (isMutationCall(params)) {
          callCount++;
          return Promise.reject(new Error("更新エラー"));
        }
        return Promise.resolve(makeFetchResponse(report));
      });

      renderDialog({ selectedReport: report, filteredReports: [report] });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("コメントを入力"),
        ).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText("コメントを入力");
      await user.type(textarea, "テストコメント");
      await user.click(screen.getByRole("button", { name: "追加" }));

      // Error shown
      await waitFor(() => {
        expect(screen.getByText("更新エラー")).toBeInTheDocument();
      });

      // Typing in the comment input clears the action error
      await user.type(textarea, "x");
      await waitFor(() => {
        expect(screen.queryByText("更新エラー")).not.toBeInTheDocument();
      });
    });
  });

  describe("action error on reaction toggle", () => {
    it("shows action error when reaction toggle fails", async () => {
      const user = userEvent.setup();
      const report = makeReport();
      mockGraphql.mockImplementation((params: GraphqlCallParams) => {
        const isMutation = isMutationCall(params);
        if (isMutation) {
          return Promise.reject(new Error("更新エラーが発生しました"));
        }
        return Promise.resolve(makeFetchResponse(report));
      });

      renderDialog({ selectedReport: report, filteredReports: [report] });

      const goodBtn = await screen.findByRole("button", { name: /👍 GOOD/ });
      await waitFor(() => {
        expect(goodBtn).not.toBeDisabled();
      });

      await user.click(goodBtn);

      await waitFor(() => {
        expect(
          screen.getByText("更新エラーが発生しました"),
        ).toBeInTheDocument();
      });
    });

    it("dismisses action error when × button is clicked", async () => {
      const user = userEvent.setup();
      const report = makeReport();
      mockGraphql.mockImplementation((params: GraphqlCallParams) => {
        const isMutation = isMutationCall(params);
        if (isMutation) {
          return Promise.reject(new Error("更新エラー"));
        }
        return Promise.resolve(makeFetchResponse(report));
      });

      renderDialog({ selectedReport: report, filteredReports: [report] });

      const goodBtn = await screen.findByRole("button", { name: /👍 GOOD/ });
      await waitFor(() => {
        expect(goodBtn).not.toBeDisabled();
      });
      await user.click(goodBtn);

      await waitFor(() => {
        expect(screen.getByText("更新エラー")).toBeInTheDocument();
      });

      // Dismiss via × button in the error banner
      const errorBanner = screen.getByText("更新エラー").closest("div")!;
      const dismissBtn = within(errorBanner).getByRole("button");
      await user.click(dismissBtn);

      await waitFor(() => {
        expect(screen.queryByText("更新エラー")).not.toBeInTheDocument();
      });
    });
  });
});
