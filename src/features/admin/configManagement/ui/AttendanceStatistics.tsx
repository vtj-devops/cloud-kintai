import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton, SettingsSwitch } from "@features/admin/layout/ui/SettingsPrimitives";
import { CreateAppConfigInput, UpdateAppConfigInput, } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useContext, useEffect, useState } from "react";

import { E14001, S14001, S14002 } from "@/errors";

export default function AttendanceStatistics() {
    const { getAttendanceStatisticsEnabled, getConfigId, saveConfig, fetchConfig, } = useContext(AppConfigContext);
    const [enabled, setEnabled] = useState<boolean>(false);
    const [id, setId] = useState<string | null>(null);
    const dispatch = useAppDispatchV2();
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEnabled(getAttendanceStatisticsEnabled());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setId(getConfigId());
    }, [getAttendanceStatisticsEnabled, getConfigId]);
    const handleChange = (checked: boolean) => {
        setEnabled(checked);
    };
    const handleSave = async () => {
        try {
            if (id) {
                await saveConfig({
                    id,
                    attendanceStatisticsEnabled: enabled,
                } as unknown as UpdateAppConfigInput);
                dispatch(pushNotification({
                    tone: "success",
                    message: S14002
                }));
            }
            else {
                await saveConfig({
                    name: "default",
                    attendanceStatisticsEnabled: enabled,
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
    return (<AdminSettingsLayout>
      <AdminSettingsSection actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <div className="flex flex-col gap-4">
          <div>
            <SettingsSwitch checked={enabled} onChange={handleChange} label={enabled ? "有効" : "無効"} ariaLabel="稼働統計の表示切り替え"/>
          </div>
          <p className="text-sm text-slate-500">
            勤怠メニューの稼働統計ページ表示を有効/無効にします。無効時はメニューから非表示になり、直接アクセスは勤怠一覧にリダイレクトされます。
          </p>
        </div>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
