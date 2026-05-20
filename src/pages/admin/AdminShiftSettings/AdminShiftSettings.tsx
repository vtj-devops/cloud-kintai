import { useAppDispatchV2 } from "@app/hooks";
import type { ShiftDisplayMode } from "@entities/app-config/model/useAppConfig";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import SettingsIcon from "@features/admin/layout/ui/SettingsIcon";
import { SettingsAlert, SettingsButton } from "@features/admin/layout/ui/SettingsPrimitives";
import { useAdminShiftSettings } from "@features/admin-config-shift/useAdminShiftSettings";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";
import { SubsectionTitle } from "@shared/ui/typography";
import { useCallback, useState } from "react";

import { S14001, S14002 } from "@/errors";

import { SHIFT_GROUP_UI_TEXTS, ShiftGroupRow } from "./";

type ShiftSettingsTab = "shift-group" | "shift-display";

export default function AdminShiftSettings() {
  const dispatch = useAppDispatchV2();
  const [activeTab, setActiveTab] = useState<ShiftSettingsTab>("shift-group");

  const handleSaveSuccess = useCallback(
    (isUpdate: boolean) => {
      dispatch(
        pushNotification({
          tone: "success",
          message: isUpdate ? S14002 : S14001,
        }),
      );
    },
    [dispatch],
  );

  const {
    control,
    fields,
    validationDetails,
    hasValidationError,
    savingShiftGroup,
    savingShiftDisplay,
    isDirty,
    isBusy,
    shiftDefaultMode,
    setShiftDefaultMode,
    handleAddGroup,
    handleRemoveGroup,
    handleSaveShiftGroup,
    handleSaveShiftDisplay,
  } = useAdminShiftSettings({
    enableShiftDisplayAutoSave: false,
    onShiftGroupSaveSuccess: handleSaveSuccess,
    onShiftDisplaySaveSuccess: handleSaveSuccess,
  });

  const { dialog } = usePageLeaveGuard({
    isDirty,
    isBusy,
  });

  const handleSwitchShiftDefaultMode = (mode: ShiftDisplayMode) => {
    setShiftDefaultMode(mode);
  };

  return (
    <AdminSettingsLayout>
      {dialog}
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "shift-group" as const, label: "シフトグループ" },
              { value: "shift-display" as const, label: "シフト表示" },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={[
                  "rounded-xl px-4 py-3 text-sm font-medium transition",
                  activeTab === tab.value
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div
          role="tabpanel"
          hidden={activeTab !== "shift-group"}
          aria-labelledby="shift-group-tab"
        >
          {activeTab === "shift-group" && (
            <div className="flex flex-col gap-6">
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

              <div className="flex flex-row justify-end pb-8">
                <SettingsButton
                  onClick={handleSaveShiftGroup}
                  disabled={hasValidationError || savingShiftGroup}
                >
                  {savingShiftGroup ? "保存中..." : "保存"}
                </SettingsButton>
              </div>
            </div>
          )}
        </div>

        <div
          role="tabpanel"
          hidden={activeTab !== "shift-display"}
          aria-labelledby="shift-display-tab"
        >
          {activeTab === "shift-display" && (
            <div className="flex flex-col gap-6">
              <SettingsAlert>シフト管理画面の表示モードを設定します。</SettingsAlert>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-6">
                  <SubsectionTitle className="border-b border-slate-100 pb-2 text-lg font-semibold text-slate-800">
                    シフト表示
                  </SubsectionTitle>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-slate-700">表示モード</span>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleSwitchShiftDefaultMode("normal")}
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
                          onClick={() => handleSwitchShiftDefaultMode("collaborative")}
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

              <div className="flex flex-row justify-end pb-8">
                <SettingsButton
                  onClick={handleSaveShiftDisplay}
                  disabled={savingShiftDisplay}
                >
                  {savingShiftDisplay ? "保存中..." : "保存"}
                </SettingsButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminSettingsLayout>
  );
}
