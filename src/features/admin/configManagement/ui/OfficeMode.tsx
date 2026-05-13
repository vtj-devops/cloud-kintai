import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton } from "@features/admin/layout/ui/SettingsPrimitives";
import { useContext, useEffect, useState } from "react";

import { useSaveAppConfigSection } from "../lib/useSaveAppConfigSection";
import OfficeModeSection from "./OfficeModeSection";

export default function OfficeMode() {
  const { getOfficeMode, getHourlyPaidHolidayEnabled } = useContext(AppConfigContext);
  const [officeMode, setOfficeMode] = useState<boolean>(false);
  const [hourlyPaidHolidayEnabled, setHourlyPaidHolidayEnabled] = useState<boolean>(false);
  const saveAppConfigSection = useSaveAppConfigSection();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOfficeMode(getOfficeMode());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHourlyPaidHolidayEnabled(getHourlyPaidHolidayEnabled());
  }, [getHourlyPaidHolidayEnabled, getOfficeMode]);
  const handleSave = async () => {
    await saveAppConfigSection({ officeMode, hourlyPaidHolidayEnabled });
  };
    return (<AdminSettingsLayout>
      <AdminSettingsSection actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <OfficeModeSection officeMode={officeMode} onOfficeModeChange={setOfficeMode} hourlyPaidHolidayEnabled={hourlyPaidHolidayEnabled} onHourlyPaidHolidayEnabledChange={setHourlyPaidHolidayEnabled}/>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
