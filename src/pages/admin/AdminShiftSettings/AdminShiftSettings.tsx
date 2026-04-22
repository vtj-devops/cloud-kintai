import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import type { ShiftDisplayMode } from "@entities/app-config/model/useAppConfig";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import SettingsIcon from "@features/admin/layout/ui/SettingsIcon";
import { SettingsAlert, SettingsButton, } from "@features/admin/layout/ui/SettingsPrimitives";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateAppConfigInput, UpdateAppConfigInput, } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";
import { SubsectionTitle } from "@shared/ui/typography";
// Title removed per admin UI simplification
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { E14001, S14001, S14002 } from "@/errors";

import { buildShiftGroupPayload, createShiftGroup, SHIFT_GROUP_UI_TEXTS, ShiftGroupRow, } from "./";
import { toShiftGroupFormValue } from "./shiftGroupFactory";
import type { ShiftGroupFormState } from "./shiftGroupSchema";
import { shiftGroupFormSchema } from "./shiftGroupSchema";

const SHIFT_GROUP_ERROR_FIELDS = [
    { key: "label", label: "ラベル名" },
    { key: "min", label: "最小人数" },
    { key: "max", label: "最大人数" },
    { key: "fixed", label: "固定人数" },
] as const;
type ShiftSettingsTab = "shift-group" | "shift-display";
const getValidationDetails = (errors: {
    shiftGroups?: Array<Record<string, {
        message?: unknown;
    } | undefined>>;
}) => {
    const details: string[] = [];
    errors.shiftGroups?.forEach((groupError, index) => {
        if (!groupError) {
            return;
        }
        const messageToLabels = new Map<string, string[]>();
        SHIFT_GROUP_ERROR_FIELDS.forEach(({ key, label }) => {
            const message = groupError[key]?.message;
            if (typeof message !== "string" || message.length === 0) {
                return;
            }
            const labels = messageToLabels.get(message) ?? [];
            if (!labels.includes(label)) {
                labels.push(label);
            }
            messageToLabels.set(message, labels);
        });
        messageToLabels.forEach((labels, message) => {
            const labelText = labels.join(" / ");
            details.push(`${index + 1}行目 ${labelText}: ${message}`);
        });
    });
    return details;
};
export default function AdminShiftSettings() {
    const { getShiftGroups, getConfigId, saveConfig, fetchConfig, getShiftDefaultMode, } = useContext(AppConfigContext);
    const dispatch = useAppDispatchV2();
    const [configId, setConfigId] = useState<string | null>(null);
    const [savingShiftGroup, setSavingShiftGroup] = useState(false);
    const [savingShiftDisplay, setSavingShiftDisplay] = useState(false);
    const [activeTab, setActiveTab] = useState<ShiftSettingsTab>("shift-group");
    const [shiftDefaultMode, setShiftDefaultMode] = useState<ShiftDisplayMode>("normal");
    const [savedShiftDefaultMode, setSavedShiftDefaultMode] = useState<ShiftDisplayMode>("normal");
    const { control, handleSubmit, reset, trigger, formState: { errors }, } = useForm<ShiftGroupFormState>({
        defaultValues: { shiftGroups: [] },
        resolver: zodResolver(shiftGroupFormSchema),
        mode: "onChange",
    });
    const { fields, append, remove } = useFieldArray({
        control,
        name: "shiftGroups",
    });
    useEffect(() => {
        const initialGroups = getShiftGroups();
        reset({
            shiftGroups: initialGroups.map((group) => toShiftGroupFormValue(group)),
        });
        setConfigId(getConfigId());
        if (typeof getShiftDefaultMode === "function") {
            const nextShiftDefaultMode = getShiftDefaultMode();
            setShiftDefaultMode(nextShiftDefaultMode);
            setSavedShiftDefaultMode(nextShiftDefaultMode);
        }
        void trigger();
    }, [getConfigId, getShiftDefaultMode, getShiftGroups, reset, trigger]);
    const handleAddGroup = () => {
        append(createShiftGroup());
        void trigger();
    };
    const validationDetails = useMemo(() => getValidationDetails(errors as {
        shiftGroups?: Array<Record<string, {
            message?: unknown;
        } | undefined>>;
    }), [errors]);
    const hasValidationError = validationDetails.length > 0;
    const initialShiftGroupSnapshot = useMemo(() => JSON.stringify(getShiftGroups().map((group) => ({
        label: group.label ?? "",
        min: typeof group.min === "number" && !Number.isNaN(group.min) ? String(group.min) : "",
        max: typeof group.max === "number" && !Number.isNaN(group.max) ? String(group.max) : "",
        fixed: typeof group.fixed === "number" && !Number.isNaN(group.fixed) ? String(group.fixed) : "",
        description: group.description ?? "",
    }))), [getShiftGroups]);
    const currentShiftGroupSnapshot = useMemo(() => JSON.stringify(fields.map((field) => ({
        label: field.label ?? "",
        min: field.min ?? "",
        max: field.max ?? "",
        fixed: field.fixed ?? "",
        description: field.description ?? "",
    }))), [fields]);
    const isShiftGroupDirty = initialShiftGroupSnapshot !== currentShiftGroupSnapshot;
    const isShiftDisplayDirty = shiftDefaultMode !== savedShiftDefaultMode;
    const { dialog } = usePageLeaveGuard({
        isDirty: isShiftGroupDirty || isShiftDisplayDirty,
        isBusy: savingShiftGroup || savingShiftDisplay,
    });
    const persistConfig = useCallback(async (payloadShiftGroups: ReturnType<typeof buildShiftGroupPayload>) => {
        if (configId) {
            await saveConfig({
                id: configId,
                shiftGroups: payloadShiftGroups,
            } as UpdateAppConfigInput);
            dispatch(pushNotification({
                tone: "success",
                message: S14002
            }));
        }
        else {
            await saveConfig({
                name: "default",
                shiftGroups: payloadShiftGroups,
            } as CreateAppConfigInput);
            dispatch(pushNotification({
                tone: "success",
                message: S14001
            }));
        }
        await fetchConfig();
    }, [configId, dispatch, fetchConfig, saveConfig]);
    const handleSave = handleSubmit(async (values) => {
        if (savingShiftGroup) {
            return;
        }
        setSavingShiftGroup(true);
        const payloadShiftGroups = buildShiftGroupPayload(values.shiftGroups);
        try {
            await persistConfig(payloadShiftGroups);
            reset(values);
        }
        catch (error) {
            console.error(error);
            dispatch(pushNotification({
                tone: "error",
                message: E14001
            }));
        }
        finally {
            setSavingShiftGroup(false);
        }
    });
    const handleShiftDisplaySave = async () => {
        if (savingShiftDisplay) {
            return;
        }
        setSavingShiftDisplay(true);
        try {
            const payload = {
                shiftCollaborativeEnabled: true,
                shiftDefaultMode,
            };
            if (configId) {
                await saveConfig({
                    id: configId,
                    ...payload,
                } as UpdateAppConfigInput);
                dispatch(pushNotification({
                    tone: "success",
                    message: S14002
                }));
            }
            else {
                await saveConfig({
                    name: "default",
                    ...payload,
                } as CreateAppConfigInput);
                dispatch(pushNotification({
                    tone: "success",
                    message: S14001
                }));
            }
            await fetchConfig();
            setSavedShiftDefaultMode(shiftDefaultMode);
        }
        catch (error) {
            console.error(error);
            dispatch(pushNotification({
                tone: "error",
                message: E14001
            }));
        }
        finally {
            setSavingShiftDisplay(false);
        }
    };
    return (<AdminSettingsLayout>
      {dialog}
      <div className="flex flex-col gap-6">
        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            {[
            { value: "shift-group" as const, label: "シフトグループ" },
            { value: "shift-display" as const, label: "シフト表示" },
        ].map((tab) => (<button key={tab.value} type="button" role="tab" aria-selected={activeTab === tab.value} onClick={() => setActiveTab(tab.value)} className={[
                "rounded-xl px-4 py-3 text-sm font-medium transition",
                activeTab === tab.value
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            ].join(" ")}>
                {tab.label}
              </button>))}
          </div>
        </div>

        <div role="tabpanel" hidden={activeTab !== "shift-group"} aria-labelledby="shift-group-tab">
          {activeTab === "shift-group" && (<div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  {SHIFT_GROUP_UI_TEXTS.introTitle}
                </span>
                <ul className="list-disc pl-6 m-0 text-sm text-slate-600">
                  {SHIFT_GROUP_UI_TEXTS.introBullets.map((text) => (<li key={text}>
                      {text}
                    </li>))}
                </ul>
              </div>
              <SettingsAlert>{SHIFT_GROUP_UI_TEXTS.saveInfo}</SettingsAlert>

              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex flex-col gap-6">
                  <SubsectionTitle className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">シフトグループ</SubsectionTitle>
                  <div className="flex flex-col gap-4">
                  {fields.length === 0 ? (<SettingsAlert>
                      {SHIFT_GROUP_UI_TEXTS.emptyGroups}
                    </SettingsAlert>) : (fields.map((group, index) => (<ShiftGroupRow key={group.id} control={control} index={index} onDelete={() => remove(index)}/>)))}
                  </div>
                  <button className="flex flex-row items-center gap-2 self-start px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition" onClick={handleAddGroup} type="button">
                    <SettingsIcon name="plus" className="text-slate-500"/>
                    <span>グループを追加</span>
                  </button>
                  {hasValidationError && (<SettingsAlert variant="warning">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm">
                          {SHIFT_GROUP_UI_TEXTS.validationWarning}
                        </span>
                        <ul className="list-disc pl-6 m-0 text-sm">
                          {validationDetails.map((detail) => (<li key={detail}>
                              {detail}
                            </li>))}
                        </ul>
                      </div>
                    </SettingsAlert>)}
                </div>
              </div>

              <div className="flex flex-row justify-end pb-8">
                <SettingsButton onClick={handleSave} disabled={hasValidationError || savingShiftGroup}>
                  {savingShiftGroup ? "保存中..." : "保存"}
                </SettingsButton>
              </div>
            </div>)}
        </div>

        <div role="tabpanel" hidden={activeTab !== "shift-display"} aria-labelledby="shift-display-tab">
          {activeTab === "shift-display" && (<div className="flex flex-col gap-6">
              <SettingsAlert>シフト管理画面の表示モードを設定します。</SettingsAlert>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex flex-col gap-6">
                  <SubsectionTitle className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">シフト表示</SubsectionTitle>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-slate-700">表示モード</span>
                      <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={() => setShiftDefaultMode("normal")} className={[
                "rounded-xl border px-4 py-2 text-sm font-medium transition",
                shiftDefaultMode === "normal"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}>
                          通常モード
                        </button>
                        <button type="button" onClick={() => setShiftDefaultMode("collaborative")} className={[
                "rounded-xl border px-4 py-2 text-sm font-medium transition",
                shiftDefaultMode === "collaborative"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}>
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
                <SettingsButton onClick={handleShiftDisplaySave} disabled={savingShiftDisplay}>
                  {savingShiftDisplay ? "保存中..." : "保存"}
                </SettingsButton>
              </div>
            </div>)}
        </div>
      </div>
    </AdminSettingsLayout>);
}
