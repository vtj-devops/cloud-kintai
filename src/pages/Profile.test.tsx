import { AuthContext, type AuthContextProps } from "@app/providers/auth/AuthContext";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import updateStaff from "@entities/staff/model/useStaff/updateStaff";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { updatePassword } from "aws-amplify/auth";
import {
  createMemoryRouter,
  Link,
  RouterProvider,
} from "react-router-dom";

import * as MESSAGE_CODE from "@/errors";

import Profile from "./Profile";

jest.mock("@entities/staff/model/useStaff/fetchStaff");
jest.mock("@entities/staff/model/useStaff/updateStaff");
jest.mock("aws-amplify/auth", () => ({
  updatePassword: jest.fn(),
}));

let notifyMock: jest.Mock;

jest.mock("@shared/lib/useAppNotification", () => ({
  useAppNotification: () => ({
    notify: notifyMock,
  }),
}));

const fetchStaffMock = fetchStaff as jest.MockedFunction<typeof fetchStaff>;
const updateStaffMock = updateStaff as jest.MockedFunction<typeof updateStaff>;
const updatePasswordMock = updatePassword as jest.MockedFunction<
  typeof updatePassword
>;

const baseStaff = {
  id: "staff-1",
  cognitoUserId: "cognito-1",
  familyName: "山田",
  givenName: "太郎",
  mailAddress: "taro@example.com",
  owner: false,
  role: StaffRole.STAFF,
  enabled: true,
  status: true,
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
  version: 3,
  usageStartDate: "2026-04-01",
  notifications: {
    workStart: true,
    workEnd: true,
  },
  externalLinks: [],
} as unknown as Awaited<ReturnType<typeof fetchStaff>>;

const createUpdatedStaffResponse = (
  input: Parameters<typeof updateStaffMock>[0]["input"],
) => ({
  ...baseStaff,
  ...input,
  notifications: input.notifications ?? baseStaff.notifications,
  externalLinks:
    input.externalLinks?.map((link) =>
      link
        ? {
            label: link.label ?? "",
            url: link.url ?? "",
            enabled: link.enabled ?? true,
          }
        : null,
    ) ?? [],
  updatedAt: "2026-04-06T00:00:00.000Z",
  version: input.version ?? baseStaff.version,
}) as Awaited<ReturnType<typeof updateStaff>>;

function renderProfile() {
  const authValue: AuthContextProps = {
    session: { roles: [StaffRole.STAFF] },
    signOut: jest.fn(),
    signIn: jest.fn(),
    hasRole: () => false,
    isCognitoUserRole: () => false,
    isAuthenticated: true,
    isLoading: false,
    roles: [StaffRole.STAFF],
    cognitoUser: {
      id: "cognito-1",
      familyName: "山田",
      givenName: "太郎",
      mailAddress: "taro@example.com",
      owner: false,
      roles: [StaffRole.STAFF],
      emailVerified: true,
    },
  };
  const user = userEvent.setup({
    advanceTimers: jest.advanceTimersByTime,
  });
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <AuthContext.Provider value={authValue}>
            <div>
              <Profile />
              <Link to="/next">next page</Link>
            </div>
          </AuthContext.Provider>
        ),
      },
      {
        path: "/next",
        element: <div>next page</div>,
      },
    ],
    { initialEntries: ["/"] },
  );

  return {
    user,
    ...render(<RouterProvider router={router} />),
  };
}

describe("Profile", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    notifyMock = jest.fn();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fetchStaffMock.mockResolvedValue({ ...baseStaff } as never);
    updateStaffMock.mockImplementation(async ({ input }) =>
      createUpdatedStaffResponse(input),
    );
    updatePasswordMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  it("通知設定の変更を1秒後に自動保存する", async () => {
    const { user } = renderProfile();

    expect(screen.queryByRole("button", { name: "保存" })).not.toBeInTheDocument();
    await screen.findByRole("button", { name: "ログアウト" });
    await user.click(screen.getByRole("tab", { name: "通知設定" }));
    await screen.findByText("勤務開始メール");

    await user.click(screen.getByRole("checkbox", { name: "勤務開始メール" }));

    expect(
      within(screen.getByRole("tabpanel", { name: "通知設定" })).getByText("保存待ち"),
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(updateStaffMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => expect(updateStaffMock).toHaveBeenCalledTimes(1));
    expect(updateStaffMock.mock.calls[0]?.[0].input.notifications).toEqual({
      workStart: false,
      workEnd: true,
    });
  });

  it("個人リンクの追加と削除を自動保存し、保存ボタンを表示しない", async () => {
    const { user } = renderProfile();

    expect(screen.queryByRole("button", { name: "保存" })).not.toBeInTheDocument();
    await screen.findByRole("button", { name: "ログアウト" });
    await user.click(screen.getByRole("tab", { name: "個人リンク設定" }));
    await screen.findByRole("button", { name: "リンクを追加" });

    await user.click(screen.getByRole("button", { name: "リンクを追加" }));
    const labelInput = screen.getByLabelText("表示名");
    const urlInput = screen.getByLabelText("URL");

    await user.type(labelInput, "社内Wiki");
    await user.type(urlInput, "https://example.com/wiki");

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => expect(updateStaffMock).toHaveBeenCalledTimes(1));
    expect(updateStaffMock.mock.calls[0]?.[0].input.externalLinks).toEqual([
      expect.objectContaining({
        label: "社内Wiki",
        url: "https://example.com/wiki",
        enabled: true,
      }),
    ]);

    await user.click(screen.getByRole("button", { name: "リンクを削除" }));
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => expect(updateStaffMock).toHaveBeenCalledTimes(2));
    expect(updateStaffMock.mock.calls[1]?.[0].input.externalLinks).toEqual([]);
  });

  it("未完成リンクがある間は自動保存せず、離脱ガードを維持する", async () => {
    const { user } = renderProfile();

    await screen.findByRole("button", { name: "ログアウト" });
    await user.click(screen.getByRole("tab", { name: "個人リンク設定" }));
    await user.click(screen.getByRole("button", { name: "リンクを追加" }));

    expect(
      screen.getByText("表示名とURLがそろうまで保存されません。"),
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(updateStaffMock).not.toHaveBeenCalled();

    await user.click(screen.getByText("next page"));

    expect(await screen.findByText("変更内容の確認")).toBeInTheDocument();
  });

  it("自動保存失敗後はエラートーストを出し、次の編集で再送する", async () => {
    updateStaffMock
      .mockRejectedValueOnce(new Error("save failed"))
      .mockImplementation(async ({ input }) => createUpdatedStaffResponse(input));

    const { user } = renderProfile();

    await screen.findByRole("button", { name: "ログアウト" });
    await user.click(screen.getByRole("tab", { name: "通知設定" }));
    await user.click(screen.getByRole("checkbox", { name: "勤務開始メール" }));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "error",
          description: MESSAGE_CODE.E05003,
        }),
      ),
    );
    expect(updateStaffMock).toHaveBeenCalledTimes(1);
    expect(
      notifyMock.mock.calls.some(([arg]) => arg?.tone === "success"),
    ).toBe(false);

    await user.click(screen.getByRole("checkbox", { name: "勤務終了メール" }));
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => expect(updateStaffMock).toHaveBeenCalledTimes(2));
    expect(
      notifyMock.mock.calls.some(([arg]) => arg?.tone === "success"),
    ).toBe(false);
  });

  it("セキュリティタブは自動保存対象にせず、手動変更ボタンを維持する", async () => {
    const { user } = renderProfile();

    await screen.findByRole("button", { name: "ログアウト" });
    await user.click(screen.getByRole("tab", { name: "セキュリティ" }));

    const currentPasswordField = screen
      .getByText("現在のパスワード")
      .closest("label")
      ?.querySelector("input");
    const newPasswordField = screen
      .getByText("新しいパスワード")
      .closest("label")
      ?.querySelector("input");
    const confirmPasswordField = screen
      .getByText("新しいパスワード(確認)")
      .closest("label")
      ?.querySelector("input");

    expect(currentPasswordField).not.toBeNull();
    expect(newPasswordField).not.toBeNull();
    expect(confirmPasswordField).not.toBeNull();

    await user.type(currentPasswordField as HTMLInputElement, "Current1!");
    await user.type(newPasswordField as HTMLInputElement, "NewPassword1!");
    await user.type(confirmPasswordField as HTMLInputElement, "NewPassword1!");
    fireEvent.blur(currentPasswordField as HTMLInputElement);
    fireEvent.blur(newPasswordField as HTMLInputElement);
    fireEvent.blur(confirmPasswordField as HTMLInputElement);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(updateStaffMock).not.toHaveBeenCalled();
    const submitButton = screen.getByRole("button", { name: "パスワードを変更" });
    expect(submitButton).toBeInTheDocument();
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });
});
