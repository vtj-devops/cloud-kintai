import SettingsIcon from "@features/admin/layout/ui/SettingsIcon";
import {
  SettingsAlert,
} from "@features/admin/layout/ui/SettingsPrimitives";
import { AppButton } from "@shared/ui/button";
import { AppTabs } from "@shared/ui/tabs";
import { SubsectionTitle } from "@shared/ui/typography";
import { useState } from "react";

import {
  SHIFT_GROUP_UI_TEXTS,
  ShiftGroupRow,
} from "@/pages/admin/AdminShiftSettings";

import type { useAdminShiftSettings } from "./useAdminShiftSettings";

type AdminShiftSettingsContentProps = {
  state: ReturnType<typeof useAdminShiftSettings>;
};

type ShiftSettingsTab = "shift-group" | "shift-display";

function ShiftGroupTabPanel({ state }: AdminShiftSettingsContentProps) {
  const {
    control,
    fields,
    validationDetails,
    hasValidationError,
    savingShiftGroup,
    isShiftGroupDirty,
    handleAddGroup,
    handleRemoveGroup,
    handleSaveShiftGroup,
  } = state;

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-800">
          {SHIFT_GROUP_UI_TEXTS.introTitle}
        </span>
        <ul className="m-0 list-disc pl-6 text-sm text-slate-600">
          {SHIFT_GROUP_UI_TEXTS.introBullets.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </div>

      <SettingsAlert>{SHIFT_GROUP_UI_TEXTS.saveInfo}</SettingsAlert>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6">
          <SubsectionTitle className="border-b border-slate-100 pb-2 text-lg font-semibold text-slate-800">
            シフトグループ
          </SubsectionTitle>
          <div className="flex flex-col gap-4">
            {fields.length === 0 ? (
              <SettingsAlert>{SHIFT_GROUP_UI_TEXTS.emptyGroups}</SettingsAlert>
            ) : (
              fields.map((group, index) => (
                <ShiftGroupRow
                  key={group.id}
                  control={control}
                  index={index}
                  onDelete={() => handleRemoveGroup(index)}
                />
              ))
            )}
          </div>
          <button
            className="flex flex-row items-center gap-2 self-start rounded-lg border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-50"
            onClick={handleAddGroup}
            type="button"
          >
            <SettingsIcon name="plus" className="text-slate-500" />
            <span>グループを追加</span>
          </button>
          {hasValidationError && (
            <SettingsAlert variant="warning">
              <div className="flex flex-col gap-2">
                <span className="text-sm">
                  {SHIFT_GROUP_UI_TEXTS.validationWarning}
                </span>
                <ul className="m-0 list-disc pl-6 text-sm">
                  {validationDetails.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
            </SettingsAlert>
          )}
        </div>
      </div>

      <div className="flex flex-row items-center justify-end gap-4 pb-4">
        {savingShiftGroup && (
          <p className="text-sm text-slate-500" aria-live="polite">保存中...</p>
        )}
        <AppButton
          variant="solid"
          tone="primary"
          disabled={hasValidationError || !isShiftGroupDirty || savingShiftGroup}
          loading={savingShiftGroup}
          onClick={handleSaveShiftGroup}
        >
          保存
        </AppButton>
      </div>
    </div>
  );
}

function ShiftDisplayTabPanel({ state }: AdminShiftSettingsContentProps) {
  const { shiftDefaultMode, setShiftDefaultMode, savingShiftDisplay, isShiftDisplayDirty } =
    state;

  return (
    <div className="flex flex-col gap-6 pt-6">
      <SettingsAlert>シフト管理画面の表示モードを設定します。</SettingsAlert>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6">
          <SubsectionTitle className="border-b border-slate-100 pb-2 text-lg font-semibold text-slate-800">
            シフト表示
          </SubsectionTitle>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">
                表示モード
              </span>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShiftDefaultMode("normal")}
                  className={[
                    "rounded-xl border px-4 py-2 text-sm font-medium transition",
                    shiftDefaultMode === "normal"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  通常モード
                </button>
                <button
                  type="button"
                  onClick={() => setShiftDefaultMode("collaborative")}
                  className={[
                    "rounded-xl border px-4 py-2 text-sm font-medium transition",
                    shiftDefaultMode === "collaborative"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  共同編集モード
                </button>
              </div>
            </div>
            <span className="text-sm text-slate-500">
              スタッフ側への設定反映には数分程度かかる場合があります。
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-row justify-end pb-4">
        <p className="text-sm text-slate-500" aria-live="polite">
          {savingShiftDisplay
            ? "変更を保存中..."
            : isShiftDisplayDirty
              ? "変更を自動保存します..."
              : "変更は自動で保存されます。"}
        </p>
      </div>
    </div>
  );
}

export default function AdminShiftSettingsContent({
  state,
}: AdminShiftSettingsContentProps) {
  const [activeTab, setActiveTab] = useState<ShiftSettingsTab>("shift-group");
  const tabs = [
    {
      value: "shift-group" as const,
      label: "シフトグループ",
      content: <ShiftGroupTabPanel state={state} />,
    },
    {
      value: "shift-display" as const,
      label: "シフト表示",
      content: <ShiftDisplayTabPanel state={state} />,
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <AppTabs
          value={activeTab}
          onChange={setActiveTab}
          items={tabs}
          appearance="underline"
          panelPadding={0}
          tabsProps={{
            "aria-label": "シフト設定タブ",
            variant: "fullWidth",
          }}
        />
      </div>
    </div>
  );
}
