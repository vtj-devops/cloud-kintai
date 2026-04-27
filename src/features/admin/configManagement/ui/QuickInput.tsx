import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { appendItem, removeItemAt, toggleEnabledAt, updateItem, } from "@features/admin/configManagement/lib/arrayHelpers";
import { TIME_FORMAT } from "@features/admin/configManagement/lib/constants";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton } from "@features/admin/layout/ui/SettingsPrimitives";
import { CreateAppConfigInput, UpdateAppConfigInput, } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import dayjs, { Dayjs } from "dayjs";
import { useContext, useEffect, useState } from "react";

import { E14001, S14001, S14002 } from "@/errors";

import QuickInputSection from "./QuickInputSection";

type Entry = {
    time: Dayjs;
    enabled: boolean;
};
export default function QuickInput() {
    const { getQuickInputStartTimes, getQuickInputEndTimes, getConfigId, saveConfig, fetchConfig, } = useContext(AppConfigContext);
    const [quickInputStartTimes, setQuickInputStartTimes] = useState<Entry[]>([]);
    const [quickInputEndTimes, setQuickInputEndTimes] = useState<Entry[]>([]);
    const [id, setId] = useState<string | null>(null);
    const dispatch = useAppDispatchV2();
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuickInputStartTimes(getQuickInputStartTimes().map((entry) => ({
            time: dayjs(entry.time, TIME_FORMAT),
            enabled: entry.enabled,
        })));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuickInputEndTimes(getQuickInputEndTimes().map((entry) => ({
            time: dayjs(entry.time, TIME_FORMAT),
            enabled: entry.enabled,
        })));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setId(getConfigId());
    }, [getQuickInputStartTimes, getQuickInputEndTimes, getConfigId]);
    const handleAddQuickInputStartTime = () => setQuickInputStartTimes(appendItem(quickInputStartTimes, { time: dayjs(), enabled: true }));
    const handleQuickInputStartTimeChange = (index: number, newValue: Dayjs | null) => {
        if (!newValue)
            return;
        setQuickInputStartTimes(updateItem(quickInputStartTimes, index, (e) => ({ ...e, time: newValue })));
    };
    const handleQuickInputStartTimeToggle = (index: number) => setQuickInputStartTimes(toggleEnabledAt(quickInputStartTimes, index));
    const handleRemoveQuickInputStartTime = (index: number) => setQuickInputStartTimes(removeItemAt(quickInputStartTimes, index));
    const handleAddQuickInputEndTime = () => setQuickInputEndTimes(appendItem(quickInputEndTimes, { time: dayjs(), enabled: true }));
    const handleQuickInputEndTimeChange = (index: number, newValue: Dayjs | null) => {
        if (!newValue)
            return;
        setQuickInputEndTimes(updateItem(quickInputEndTimes, index, (e) => ({ ...e, time: newValue })));
    };
    const handleQuickInputEndTimeToggle = (index: number) => setQuickInputEndTimes(toggleEnabledAt(quickInputEndTimes, index));
    const handleRemoveQuickInputEndTime = (index: number) => setQuickInputEndTimes(removeItemAt(quickInputEndTimes, index));
    const handleSave = async () => {
        try {
            if (id) {
                await saveConfig({
                    id,
                    quickInputStartTimes: quickInputStartTimes.map((e) => ({
                        time: e.time.format("HH:mm"),
                        enabled: e.enabled,
                    })),
                    quickInputEndTimes: quickInputEndTimes.map((e) => ({
                        time: e.time.format("HH:mm"),
                        enabled: e.enabled,
                    })),
                } as unknown as UpdateAppConfigInput);
                dispatch(pushNotification({
                    tone: "success",
                    message: S14002
                }));
            }
            else {
                await saveConfig({
                    name: "default",
                    quickInputStartTimes: quickInputStartTimes.map((e) => ({
                        time: e.time.format("HH:mm"),
                        enabled: e.enabled,
                    })),
                    quickInputEndTimes: quickInputEndTimes.map((e) => ({
                        time: e.time.format("HH:mm"),
                        enabled: e.enabled,
                    })),
                } as unknown as CreateAppConfigInput);
                dispatch(pushNotification({
                    tone: "success",
                    message: S14001
                }));
            }
            await fetchConfig();
        }
        catch {
            dispatch(pushNotification({
                tone: "error",
                message: E14001
            }));
        }
    };
    return (<AdminSettingsLayout description={<>
          勤怠編集画面でボタンを押すと時刻が簡単に入力されます。
          <br />
          この機能は、勤務開始時刻と勤務終了時刻のみを設定できます。
        </>}>
      <AdminSettingsSection actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <QuickInputSection quickInputStartTimes={quickInputStartTimes} quickInputEndTimes={quickInputEndTimes} onAddQuickInputStartTime={handleAddQuickInputStartTime} onQuickInputStartTimeChange={handleQuickInputStartTimeChange} onQuickInputStartTimeToggle={handleQuickInputStartTimeToggle} onRemoveQuickInputStartTime={handleRemoveQuickInputStartTime} onAddQuickInputEndTime={handleAddQuickInputEndTime} onQuickInputEndTimeChange={handleQuickInputEndTimeChange} onQuickInputEndTimeToggle={handleQuickInputEndTimeToggle} onRemoveQuickInputEndTime={handleRemoveQuickInputEndTime}/>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
