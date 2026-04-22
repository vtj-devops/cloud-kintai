import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton, SettingsSwitch } from "@features/admin/layout/ui/SettingsPrimitives";
import { CreateAppConfigInput, UpdateAppConfigInput, } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useContext, useEffect, useState } from "react";

import { E14001, S14001, S14002 } from "@/errors";

export default function SpecialHoliday() {
    const { getSpecialHolidayEnabled, getConfigId, saveConfig, fetchConfig } = useContext(AppConfigContext);
    const [specialHolidayEnabled, setSpecialHolidayEnabled] = useState<boolean>(false);
    const [id, setId] = useState<string | null>(null);
    const dispatch = useAppDispatchV2();
    useEffect(() => {
        if (typeof getSpecialHolidayEnabled === "function")
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSpecialHolidayEnabled(getSpecialHolidayEnabled());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setId(getConfigId());
    }, [getSpecialHolidayEnabled, getConfigId]);
    const handleSave = async () => {
        try {
            if (id) {
                await saveConfig({
                    id,
                    specialHolidayEnabled,
                } as unknown as UpdateAppConfigInput);
                dispatch(pushNotification({
                    tone: "success",
                    message: S14002
                }));
            }
            else {
                await saveConfig({
                    name: "default",
                    specialHolidayEnabled,
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
            <SettingsSwitch checked={specialHolidayEnabled} onChange={setSpecialHolidayEnabled} label={specialHolidayEnabled ? "有効" : "無効"}/>
          </div>
          <p className="text-sm text-slate-500">
            忌引きなどの特別休暇を有効化すると、勤怠編集画面で申請や編集ができるようになります。
          </p>
        </div>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
