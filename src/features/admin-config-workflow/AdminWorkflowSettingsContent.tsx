import SettingsIcon from "@features/admin/layout/ui/SettingsIcon";
import {
  SettingsAlert,
  SettingsSwitch,
  SettingsTextAreaField,
  SettingsTextField,
} from "@features/admin/layout/ui/SettingsPrimitives";
import { AppTabs } from "@shared/ui/tabs";
import { formatDateSlash } from "@shared/lib/time";
import { SectionTitle, SubsectionTitle } from "@shared/ui/typography";
import { useState } from "react";

import { useAdminWorkflowSettings } from "./useAdminWorkflowSettings";

type AdminWorkflowSettingsContentProps = {
  state: ReturnType<typeof useAdminWorkflowSettings>;
};

type SettingsTabKey = "categories" | "templates";

const subtleButtonClassName =
  "rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white";

function WorkflowCategoryTabPanel({
  state,
}: AdminWorkflowSettingsContentProps) {
  const {
    items,
    saving,
    hasChanges,
    handleToggleEnabled,
    handleMoveItem,
    handleReset,
  } = state;

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="flex flex-col gap-1">
        <SectionTitle className="text-xl font-semibold text-slate-800">
          ワークフロー種別
        </SectionTitle>
        <p className="text-sm text-slate-500">
          表示順序の変更と有効/無効の切り替えを行えます。
        </p>
      </div>

      <SettingsAlert className="mb-2">
        並び順は新規申請画面とワークフロー一覧の種別フィルタに反映されます。
      </SettingsAlert>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          {items.map((item, index) => (
            <div
              key={item.category}
              className="flex flex-row items-center justify-between gap-2 rounded p-2 transition-colors hover:bg-slate-50"
            >
              <div className="flex flex-row items-center gap-2">
                <span className="w-6 text-center text-sm text-slate-400">
                  {index + 1}
                </span>
                <span className="text-base font-medium text-slate-700">
                  {item.label}
                </span>
              </div>
              <div className="flex flex-row items-center gap-1">
                <button
                  className="rounded p-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                  onClick={() => handleMoveItem(index, index - 1)}
                  disabled={saving || index === 0}
                  aria-label={`${item.label}を上へ移動`}
                  type="button"
                >
                  <SettingsIcon name="arrow-up" />
                </button>
                <button
                  className="rounded p-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                  onClick={() => handleMoveItem(index, index + 1)}
                  disabled={saving || index === items.length - 1}
                  aria-label={`${item.label}を下へ移動`}
                  type="button"
                >
                  <SettingsIcon name="arrow-down" />
                </button>
                <div className="ml-2 min-w-[88px]">
                  <SettingsSwitch
                    checked={item.enabled}
                    disabled={saving}
                    onChange={() => handleToggleEnabled(index)}
                    label={item.enabled ? "有効" : "無効"}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-row justify-between pt-2">
        <button
          className={`flex flex-row items-center gap-2 ${subtleButtonClassName} disabled:opacity-50`}
          onClick={handleReset}
          disabled={saving}
          type="button"
        >
          <SettingsIcon name="reset" />
          <span>デフォルトに戻す</span>
        </button>
        <p className="text-sm text-slate-500" aria-live="polite">
          {saving
            ? "変更を保存中..."
            : hasChanges
              ? "変更を自動保存します..."
              : "変更は自動で保存されます。"}
        </p>
      </div>
    </div>
  );
}

function WorkflowTemplateTabPanel({
  state,
}: AdminWorkflowSettingsContentProps) {
  const {
    templates,
    templateLoading,
    templateError,
    templateName,
    setTemplateName,
    templateTitle,
    setTemplateTitle,
    templateContent,
    setTemplateContent,
    editingTemplateId,
    templateSaving,
    resetTemplateForm,
    handleTemplateSubmit,
    handleTemplateEdit,
    handleTemplateDelete,
  } = state;

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="flex flex-col gap-1">
        <SectionTitle className="text-xl font-semibold text-slate-800">
          ワークフローテンプレート
        </SectionTitle>
        <p className="text-sm text-slate-500">
          「その他」申請で利用するテンプレートを管理できます。新しいものが上に表示されます。
        </p>
      </div>

      <SettingsAlert className="mb-2">
        テンプレート適用時は、申請フォームの入力内容を上書きする確認が表示されます。
      </SettingsAlert>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          <SubsectionTitle className="border-b border-slate-100 pb-2 text-lg font-semibold text-slate-800">
            {editingTemplateId ? "テンプレート編集" : "テンプレート作成"}
          </SubsectionTitle>
          <SettingsTextField
            label="テンプレート名"
            value={templateName}
            onChange={setTemplateName}
          />
          <SettingsTextField
            label="タイトルテンプレート"
            value={templateTitle}
            onChange={setTemplateTitle}
          />
          <SettingsTextAreaField
            label="詳細内容テンプレート"
            value={templateContent}
            onChange={setTemplateContent}
            minRows={5}
          />
          <div className="flex flex-row justify-end gap-2 pt-2">
            {editingTemplateId && (
              <button
                className={subtleButtonClassName}
                onClick={resetTemplateForm}
                type="button"
              >
                キャンセル
              </button>
            )}
            <button
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              onClick={handleTemplateSubmit}
              disabled={templateSaving}
              type="button"
            >
              {templateSaving
                ? "保存中..."
                : editingTemplateId
                  ? "更新"
                  : "作成"}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          <SubsectionTitle className="border-b border-slate-100 pb-2 text-lg font-semibold text-slate-800">
            テンプレート一覧
          </SubsectionTitle>
          {templateError ? (
            <SettingsAlert variant="error">{templateError}</SettingsAlert>
          ) : null}
          {templateLoading ? (
            <p className="py-4 text-center text-sm text-slate-500">
              読み込み中...
            </p>
          ) : templates.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              テンプレートはまだありません。
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">
                      テンプレート名
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">
                      タイトルテンプレート
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">
                      作成日
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-right font-medium">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id} className="text-slate-700">
                      <td className="border-b border-slate-100 px-4 py-3">
                        {template.name}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {template.title}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        {formatDateSlash(template.createdAt)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 text-right">
                        <button
                          className="ml-1 rounded p-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => handleTemplateEdit(template.id)}
                          aria-label="テンプレートを編集"
                          type="button"
                        >
                          <SettingsIcon name="edit" />
                        </button>
                        <button
                          className="ml-1 rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleTemplateDelete(template.id)}
                          aria-label="テンプレートを削除"
                          type="button"
                        >
                          <SettingsIcon name="delete" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminWorkflowSettingsContent({
  state,
}: AdminWorkflowSettingsContentProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabKey>("categories");

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <AppTabs
        value={activeTab}
        onChange={setActiveTab}
        appearance="underline"
        panelPadding={0}
        tabsProps={{ "aria-label": "ワークフロー設定タブ", variant: "fullWidth" }}
        items={[
          {
            value: "categories",
            label: "ワークフロー種別",
            content: <WorkflowCategoryTabPanel state={state} />,
          },
          {
            value: "templates",
            label: "ワークフローテンプレート",
            content: <WorkflowTemplateTabPanel state={state} />,
          },
        ]}
      />
    </div>
  );
}
