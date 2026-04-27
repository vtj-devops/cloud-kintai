import { AuthContext } from "@app/providers/auth/AuthContext";
import {
  SettingsAlert,
  SettingsSelect,
} from "@features/admin/layout/ui/SettingsPrimitives";
import { SectionTitle, SubsectionTitle } from "@shared/ui/typography";
import { useContext, useMemo, useState } from "react";

import { downloadJsonFile } from "../model/downloadJsonFile";
import {
  EXPORT_MODEL_DEFINITIONS,
  getExportModelDefinition,
} from "../model/exportRegistry";
import {
  type BulkExportProgress,
  createBulkExportArtifact,
  createSingleExportArtifact,
} from "../model/exportService";

type ExportMode = "all" | "single" | null;

export default function SchemaExport() {
  const { cognitoUser } = useContext(AuthContext);
  const modelOptions = useMemo(() => EXPORT_MODEL_DEFINITIONS, []);
  const [selectedModel, setSelectedModel] = useState(
    modelOptions[0]?.modelName ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ExportMode>(null);
  const [bulkExportProgress, setBulkExportProgress] =
    useState<BulkExportProgress | null>(null);
  const canUseExport = Boolean(cognitoUser?.owner);

  const handleSingleExport = async () => {
    const definition = getExportModelDefinition(selectedModel);
    if (!definition || activeMode) return;

    setError(null);
    setActiveMode("single");

    try {
      const artifact = await createSingleExportArtifact(definition);
      downloadJsonFile(artifact.payload, artifact.fileName);
    } catch (exportError) {
      const message =
        exportError instanceof Error
          ? exportError.message
          : "個別エクスポートに失敗しました。";
      setError(message);
    } finally {
      setActiveMode(null);
    }
  };

  const handleBulkExport = async () => {
    if (activeMode) return;

    setError(null);
    setActiveMode("all");
    setBulkExportProgress(null);

    try {
      const artifact = await createBulkExportArtifact(
        undefined,
        undefined,
        setBulkExportProgress,
      );
      downloadJsonFile(artifact.payload, artifact.fileName);
    } catch (exportError) {
      const message =
        exportError instanceof Error
          ? exportError.message
          : "一括エクスポートに失敗しました。";
      setError(message);
    } finally {
      setActiveMode(null);
      setBulkExportProgress(null);
    }
  };

  const isExporting = activeMode !== null;
  const bulkProgressValue =
    bulkExportProgress && bulkExportProgress.totalModels > 0
      ? (bulkExportProgress.completedModels / bulkExportProgress.totalModels) * 100
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionTitle className="m-0 text-2xl font-semibold text-slate-900">データエクスポート</SectionTitle>
        <p className="mt-2 text-sm text-slate-500">
          システム内の設定や登録データを、まとめて JSON ファイルとして保存できる保守機能です。
        </p>
      </div>

      {!canUseExport && (
        <SettingsAlert variant="warning">
          この機能はオーナー権限ユーザーのみ利用できます。
        </SettingsAlert>
      )}

      {error ? <SettingsAlert variant="error">{error}</SettingsAlert> : null}

      {canUseExport ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <SubsectionTitle className="m-0 text-lg font-semibold text-slate-900">個別エクスポート</SubsectionTitle>
              <SettingsSelect
                label="対象モデル"
                value={selectedModel}
                onChange={setSelectedModel}
                disabled={isExporting}
                options={modelOptions.map((option) => ({
                  value: option.modelName,
                  label: option.displayName,
                }))}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSingleExport}
                  disabled={!selectedModel || isExporting}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  個別エクスポート
                </button>
                {activeMode === "single" ? (
                  <span className="text-sm text-slate-500">処理中...</span>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <SubsectionTitle className="m-0 text-lg font-semibold text-slate-900">一括エクスポート</SubsectionTitle>
              <p className="m-0 text-sm text-slate-500">
                対象 {modelOptions.length} モデルを全件取得し、単一 JSON ファイルとしてダウンロードします。
              </p>
              <SettingsAlert variant="warning">
                全モデルの一括エクスポート実行中は、画面を移動せずそのままお待ちください。
              </SettingsAlert>
              {activeMode === "all" && bulkExportProgress ? (
                <div className="flex flex-col gap-2">
                  <p className="m-0 text-sm text-slate-500">
                    {bulkExportProgress.totalModels} モデル中{" "}
                    {bulkExportProgress.completedModels + 1} 件目を処理中:{" "}
                    {bulkExportProgress.currentModelName}
                  </p>
                  <div
                    role="progressbar"
                    aria-valuenow={bulkProgressValue}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="一括エクスポート進捗"
                    className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
                  >
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${bulkProgressValue}%` }}
                    />
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBulkExport}
                  disabled={isExporting}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  全モデルを一括エクスポート
                </button>
                {activeMode === "all" ? (
                  <span className="text-sm text-slate-500">処理中...</span>
                ) : null}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
