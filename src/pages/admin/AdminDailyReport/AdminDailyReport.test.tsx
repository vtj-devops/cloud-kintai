import { AuthContext } from "@app/providers/auth/AuthContext";
import {
  StaffRole,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import { useSplitView } from "@features/splitView";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  DailyReportStatus,
  type ListDailyReportsQuery,
} from "@shared/api/graphql/types";
import { render, screen, waitFor } from "@testing-library/react";
import type { GraphQLResult } from "aws-amplify/api";

import AdminDailyReport from "./AdminDailyReport";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  StaffRole: {
    OWNER: "Owner",
    ADMIN: "Admin",
    STAFF_ADMIN: "StaffAdmin",
    STAFF: "Staff",
    GUEST: "Guest",
    OPERATOR: "Operator",
    NONE: "None",
  },
  useStaffs: jest.fn(),
}));

jest.mock("@features/splitView", () => ({
  useSplitView: jest.fn(),
}));

jest.mock("./DailyReportDetailPanel", () => () => null);
jest.mock("./DailyReportCarouselDialog", () => () => null);

const mockedUseStaffs = jest.mocked(useStaffs);
const mockedUseSplitView = jest.mocked(useSplitView);

const mockListDailyReports = (
  items: NonNullable<ListDailyReportsQuery["listDailyReports"]>["items"],
) => {
  jest.spyOn(graphqlClient, "graphql").mockImplementation(() =>
    Promise.resolve({
      data: {
        listDailyReports: {
          items,
          nextToken: null,
        },
      },
    } as GraphQLResult<ListDailyReportsQuery>),
  );
};

const createReport = ({
  id,
  status = DailyReportStatus.SUBMITTED,
}: {
  id: string;
  status?: DailyReportStatus;
}) => ({
  __typename: "DailyReport" as const,
  id,
  staffId: "staff-1",
  reportDate: "2026-04-01",
  title: "日報タイトル",
  content: "日報本文",
  status,
  updatedAt: "2026-04-01T09:00:00.000Z",
  createdAt: "2026-04-01T08:00:00.000Z",
  reactions: [],
  comments: [],
  version: 1,
});

const renderPage = () =>
  render(
    <AuthContext.Provider
      value={{
        signOut: jest.fn(),
        signIn: jest.fn(),
        isCognitoUserRole: jest.fn(),
        authStatus: "authenticated",
      }}
    >
      <AdminDailyReport />
    </AuthContext.Provider>,
  );

describe("AdminDailyReport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseStaffs.mockReturnValue({
      staffs: [
        {
          id: "staff-1",
          familyName: "山田",
          givenName: "太郎",
          cognitoUserId: "cognito-1",
          mailAddress: "taro@example.com",
          owner: false,
          role: StaffRole.STAFF,
          enabled: true,
          status: "ACTIVE",
          createdAt: "2026-04-01T00:00:00.000Z",
          updatedAt: "2026-04-01T00:00:00.000Z",
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
    mockedUseSplitView.mockReturnValue({
      state: {
        mode: "single",
        leftPanel: null,
        rightPanel: null,
        dividerPosition: 50,
      },
      setMode: jest.fn(),
      enableSplitMode: jest.fn(),
      enableTripleMode: jest.fn(),
      disableSplitMode: jest.fn(),
      setLeftPanel: jest.fn(),
      setRightPanel: jest.fn(),
      setDividerPosition: jest.fn(),
      reset: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("CSV出力ボタンを共通AppButtonとして描画する", async () => {
    mockListDailyReports([createReport({ id: "report-1" })]);

    renderPage();

    const button = await screen.findByRole("button", { name: "CSV出力" });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });

    expect(button).toHaveAttribute("data-app-button-variant", "solid");
    expect(button).toHaveAttribute("data-app-button-tone", "primary");
    expect(button).toHaveAttribute("data-app-button-size", "sm");
  });

  it("表示対象の日報がないときCSV出力ボタンを無効化する", async () => {
    mockListDailyReports([
      createReport({
        id: "draft-report",
        status: DailyReportStatus.DRAFT,
      }),
    ]);

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("条件に一致する日報がありません。"),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "CSV出力" })).toBeDisabled();
  });
});
