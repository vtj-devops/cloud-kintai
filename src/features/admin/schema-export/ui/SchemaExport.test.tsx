import { AuthContext } from "@app/providers/auth/AuthContext";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SchemaExport from "./SchemaExport";

const mockCreateSingleExportArtifact = jest.fn();
const mockCreateBulkExportArtifact = jest.fn();
const mockDownloadJsonFile = jest.fn();

jest.mock("../model/exportService", () => ({
  createSingleExportArtifact: (...args: unknown[]) =>
    mockCreateSingleExportArtifact(...args),
  createBulkExportArtifact: (...args: unknown[]) =>
    mockCreateBulkExportArtifact(...args),
}));

jest.mock("../model/downloadJsonFile", () => ({
  downloadJsonFile: (...args: unknown[]) => mockDownloadJsonFile(...args),
}));

describe("SchemaExport", () => {
  const renderSchemaExport = (owner = true) =>
    render(
      <AuthContext.Provider
        value={{
          signOut: jest.fn(),
          signIn: jest.fn(),
          isCognitoUserRole: jest.fn(),
          cognitoUser: owner
            ? {
                id: "user-1",
                givenName: "Owner",
                familyName: "User",
                mailAddress: "owner@example.com",
                owner: true,
                roles: [],
                emailVerified: true,
              }
            : {
                id: "user-2",
                givenName: "Admin",
                familyName: "User",
                mailAddress: "admin@example.com",
                owner: false,
                roles: [],
                emailVerified: true,
              },
        }}
      >
        <SchemaExport />
      </AuthContext.Provider>
    );

  beforeEach(() => {
    mockCreateSingleExportArtifact.mockReset();
    mockCreateBulkExportArtifact.mockReset();
    mockDownloadJsonFile.mockReset();
  });

  it("renders export actions and model options for owner users", () => {
    renderSchemaExport();

    expect(screen.getByText("データエクスポート")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "個別エクスポート" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "全モデルを一括エクスポート" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("対象モデル")).toBeInTheDocument();
    expect(
      screen.getByText(
        "全モデルの一括エクスポート実行中は、画面を移動せずそのままお待ちください。"
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("対象モデル一覧")).not.toBeInTheDocument();
  });

  it("shows an authorization message for non-owner users", () => {
    renderSchemaExport(false);

    expect(screen.getByText("データエクスポート")).toBeInTheDocument();
    expect(
      screen.getByText("この機能はオーナー権限ユーザーのみ利用できます。")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "個別エクスポート" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "全モデルを一括エクスポート" })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("対象モデル")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("progressbar", { name: "一括エクスポート進捗" })
    ).not.toBeInTheDocument();
  });

  it("exports a selected model", async () => {
    const user = userEvent.setup();
    mockCreateSingleExportArtifact.mockResolvedValue({
      fileName: "single.json",
      payload: { model: "Staff", count: 1, exportedAt: "x", items: [] },
    });

    renderSchemaExport();

    await user.click(screen.getByRole("button", { name: "個別エクスポート" }));

    await waitFor(() => {
      expect(mockCreateSingleExportArtifact).toHaveBeenCalled();
      expect(mockDownloadJsonFile).toHaveBeenCalledWith(
        { model: "Staff", count: 1, exportedAt: "x", items: [] },
        "single.json"
      );
    });
  });

  it("disables actions while bulk export is running", async () => {
    const user = userEvent.setup();
    let resolvePromise: ((value: unknown) => void) | undefined;
    mockCreateBulkExportArtifact.mockImplementation(
      (_definitions, _date, onProgress) =>
        new Promise((resolve) => {
          onProgress?.({
            completedModels: 0,
            currentModelName: "AppConfig",
            totalModels: 17,
          });
          resolvePromise = resolve;
        })
    );

    renderSchemaExport();

    await user.click(
      screen.getByRole("button", { name: "全モデルを一括エクスポート" })
    );

    expect(
      screen.getByRole("button", { name: "全モデルを一括エクスポート" })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "個別エクスポート" })).toBeDisabled();
    expect(
      screen.getByText("17 モデル中 1 件目を処理中: AppConfig")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "一括エクスポート進捗" })
    ).toBeInTheDocument();

    resolvePromise?.({
      fileName: "bulk.json",
      payload: { exportedAt: "x", modelCounts: {}, models: {} },
    });

    await waitFor(() => {
      expect(mockDownloadJsonFile).toHaveBeenCalledWith(
        { exportedAt: "x", modelCounts: {}, models: {} },
        "bulk.json"
      );
    });
  });

  it("shows an error when export fails", async () => {
    const user = userEvent.setup();
    mockCreateSingleExportArtifact.mockRejectedValue(
      new Error("Staff の取得に失敗しました。")
    );

    renderSchemaExport();

    await user.click(screen.getByRole("button", { name: "個別エクスポート" }));

    expect(
      await screen.findByText("Staff の取得に失敗しました。")
    ).toBeInTheDocument();
  });
});
