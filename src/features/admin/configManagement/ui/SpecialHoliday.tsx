import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton, SettingsSwitch } from "@features/admin/layout/ui/SettingsPrimitives";
import { useContext, useEffect, useState } from "react";

import { useSaveAppConfigSection } from "../lib/useSaveAppConfigSection";

export default function SpecialHoliday() {
    const { getSpecialHolidayEnabled } = useContext(AppConfigContext);
    const [specialHolidayEnabled, setSpecialHolidayEnabled] = useState<boolean>(false);
    const saveAppConfigSection = useSaveAppConfigSection();
    useEffect(() => {
        if (typeof getSpecialHolidayEnabled === "function")
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSpecialHolidayEnabled(getSpecialHolidayEnabled());
    }, [getSpecialHolidayEnabled]);
    const handleSave = async () => {
        await saveAppConfigSection({ specialHolidayEnabled });
    };
    return (<AdminSettingsLayout>
      <AdminSettingsSection actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <div className="flex flex-col gap-4">
          <div>
            <SettingsSwitch checked={specialHolidayEnabled} onChange={setSpecialHolidayEnabled} label={specialHolidayEnabled ? "有効" : "無効"}/>
          </div>
          <p className="text-sm text-slate-500">
            忌引きなどの特別休暇を有効化すると、勤怠編集画面で申請や編集ができるようになります。
          </p>
        </div>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
