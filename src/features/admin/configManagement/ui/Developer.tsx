import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton, SettingsSwitch } from "@features/admin/layout/ui/SettingsPrimitives";
import { CreateAppConfigInput, UpdateAppConfigInput, } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { SubsectionTitle } from "@shared/ui/typography";
import { useContext, useEffect, useState } from "react";

import { E14001, S14001, S14002 } from "@/errors";

type DeveloperSettingItem = {
    id: string;
    title: string;
    description: string;
    checked: boolean;
};
export default function Developer() {
    const { getWorkflowNotificationEnabled, getConfigId, saveConfig, fetchConfig, } = useContext(AppConfigContext);
    const [workflowNotificationEnabled, setWorkflowNotificationEnabled] = useState(false);
    const [id, setId] = useState<string | null>(null);
    const dispatch = useAppDispatchV2();
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWorkflowNotificationEnabled(getWorkflowNotificationEnabled());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setId(getConfigId());
    }, [getConfigId, getWorkflowNotificationEnabled]);
    const handleChange = (checked: boolean) => {
        setWorkflowNotificationEnabled(checked);
    };
    const handleSave = async () => {
        try {
            if (id) {
                await saveConfig({
                    id,
                    workflowNotificationEnabled,
                } as UpdateAppConfigInput);
                dispatch(pushNotification({
                    tone: "success",
                    message: S14002
                }));
            }
            else {
                await saveConfig({
                    name: "default",
                    workflowNotificationEnabled,
                } as CreateAppConfigInput);
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
    const developerSettings: DeveloperSettingItem[] = [
        {
            id: "workflow-notification",
            title: "通知機能(開発中)",
            description: "有効にすると、ヘッダーの通知アイコンと通知一覧への導線が表示されます。",
            checked: workflowNotificationEnabled,
        },
    ];
    return (<AdminSettingsLayout description="実験中または内部向けの設定をまとめて管理します。項目の追加や削除があっても、この画面内で一覧できます。">
      <AdminSettingsSection title="開発者" actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <div className="flex flex-col gap-6">
          {developerSettings.map((setting) => (<div key={setting.id} className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <SubsectionTitle className="text-base font-semibold text-slate-800">
                {setting.title}
              </SubsectionTitle>
              <div>
                <SettingsSwitch checked={setting.checked} onChange={handleChange} label={setting.checked ? "有効" : "無効"}/>
              </div>
              <p className="text-sm text-slate-500">
                {setting.description}
              </p>
            </div>))}
        </div>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
