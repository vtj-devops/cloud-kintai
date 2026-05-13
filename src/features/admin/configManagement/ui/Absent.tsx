import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton, SettingsSwitch } from "@features/admin/layout/ui/SettingsPrimitives";
import { useContext, useEffect, useState } from "react";

import { useSaveAppConfigSection } from "../lib/useSaveAppConfigSection";

export default function Absent() {
    const { getAbsentEnabled } = useContext(AppConfigContext);
    const [absentEnabled, setAbsentEnabled] = useState<boolean>(false);
    const saveAppConfigSection = useSaveAppConfigSection();
    useEffect(() => {
        if (typeof getAbsentEnabled === "function")
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAbsentEnabled(getAbsentEnabled());
    }, [getAbsentEnabled]);
    const handleSave = async () => {
        await saveAppConfigSection({ absentEnabled });
    };
    return (<AdminSettingsLayout>
      <AdminSettingsSection actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <div className="flex flex-col gap-4">
          <div>
            <SettingsSwitch checked={absentEnabled} onChange={setAbsentEnabled} label={absentEnabled ? "有効" : "無効"}/>
          </div>
          <p className="text-sm text-slate-500">
            欠勤設定を有効にすると、勤怠編集画面で欠勤の管理が可能になります。
          </p>
        </div>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
