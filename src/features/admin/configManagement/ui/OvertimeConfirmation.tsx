import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton, SettingsSwitch } from "@features/admin/layout/ui/SettingsPrimitives";
import { CreateAppConfigInput, UpdateAppConfigInput, } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useContext, useEffect, useState } from "react";

import { E14001, S14001, S14002 } from "@/errors";

export default function OvertimeConfirmation() {
    const { getOverTimeCheckEnabled, getConfigId, saveConfig, fetchConfig } = useContext(AppConfigContext);
    const [enabled, setEnabled] = useState<boolean>(false);
    const [id, setId] = useState<string | null>(null);
    const dispatch = useAppDispatchV2();
    useEffect(() => {
        if (typeof getOverTimeCheckEnabled === "function") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEnabled(getOverTimeCheckEnabled());
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setId(getConfigId());
    }, [getOverTimeCheckEnabled, getConfigId]);
    const handleSave = async () => {
        try {
            if (id) {
                await saveConfig({
                    id,
                    overTimeCheckEnabled: enabled,
                } as unknown as UpdateAppConfigInput);
                dispatch(pushNotification({
                    tone: "success",
                    message: S14002
                }));
            }
            else {
                await saveConfig({
                    name: "default",
                    overTimeCheckEnabled: enabled,
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
            <SettingsSwitch checked={enabled} onChange={setEnabled} label={enabled ? "有効" : "無効"}/>
          </div>
          <p className="text-sm text-slate-500">
            勤怠編集画面で、残業申請がない場合や承認時間を超えた場合に確認メッセージを表示するかどうかを切り替えます。
          </p>
        </div>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
