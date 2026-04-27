import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton } from "@features/admin/layout/ui/SettingsPrimitives";
import { CreateAppConfigInput, UpdateAppConfigInput, } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useContext, useEffect, useState } from "react";

import { E14001, S14001, S14002 } from "@/errors";

import OfficeModeSection from "./OfficeModeSection";

export default function OfficeMode() {
    const { getOfficeMode, getHourlyPaidHolidayEnabled, getConfigId, saveConfig, fetchConfig, } = useContext(AppConfigContext);
    const [officeMode, setOfficeMode] = useState<boolean>(false);
    const [hourlyPaidHolidayEnabled, setHourlyPaidHolidayEnabled] = useState<boolean>(false);
    const [id, setId] = useState<string | null>(null);
    const dispatch = useAppDispatchV2();
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOfficeMode(getOfficeMode());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHourlyPaidHolidayEnabled(getHourlyPaidHolidayEnabled());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setId(getConfigId());
    }, [getOfficeMode, getHourlyPaidHolidayEnabled, getConfigId]);
    const handleSave = async () => {
        try {
            if (id) {
                await saveConfig({
                    id,
                    officeMode,
                    hourlyPaidHolidayEnabled,
                } as unknown as UpdateAppConfigInput);
                dispatch(pushNotification({
                    tone: "success",
                    message: S14002
                }));
            }
            else {
                await saveConfig({
                    name: "default",
                    officeMode,
                    hourlyPaidHolidayEnabled,
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
        <OfficeModeSection officeMode={officeMode} onOfficeModeChange={setOfficeMode} hourlyPaidHolidayEnabled={hourlyPaidHolidayEnabled} onHourlyPaidHolidayEnabledChange={setHourlyPaidHolidayEnabled}/>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
