import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton, SettingsSwitch } from "@features/admin/layout/ui/SettingsPrimitives";
import { useContext, useEffect, useState } from "react";

import { useSaveAppConfigSection } from "../lib/useSaveAppConfigSection";

export default function OvertimeConfirmation() {
    const { getOverTimeCheckEnabled } = useContext(AppConfigContext);
    const [enabled, setEnabled] = useState<boolean>(false);
    const saveAppConfigSection = useSaveAppConfigSection();
    useEffect(() => {
        if (typeof getOverTimeCheckEnabled === "function") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEnabled(getOverTimeCheckEnabled());
        }
    }, [getOverTimeCheckEnabled]);
    const handleSave = async () => {
        await saveAppConfigSection({ overTimeCheckEnabled: enabled });
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
