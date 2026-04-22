import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton } from "@features/admin/layout/ui/SettingsPrimitives";
import { CreateAppConfigInput, UpdateAppConfigInput, } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { Dayjs } from "dayjs";
import { useContext, useEffect, useState } from "react";

import { E14001, E14002, S14001, S14002 } from "@/errors";

import WorkingTimeSection from "./WorkingTimeSection";

export default function WorkingTime() {
    const { getStartTime, getEndTime, getLunchRestStartTime, getLunchRestEndTime, getConfigId, saveConfig, fetchConfig, } = useContext(AppConfigContext);
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const [lunchRestStartTime, setLunchRestStartTime] = useState<Dayjs | null>(null);
    const [lunchRestEndTime, setLunchRestEndTime] = useState<Dayjs | null>(null);
    const [id, setId] = useState<string | null>(null);
    const dispatch = useAppDispatchV2();
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStartTime(getStartTime());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEndTime(getEndTime());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLunchRestStartTime(getLunchRestStartTime());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLunchRestEndTime(getLunchRestEndTime());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setId(getConfigId());
    }, [
        getStartTime,
        getEndTime,
        getLunchRestStartTime,
        getLunchRestEndTime,
        getConfigId,
    ]);
    const handleSave = async () => {
        if (startTime && endTime && lunchRestStartTime && lunchRestEndTime) {
            try {
                if (id) {
                    await saveConfig({
                        id,
                        workStartTime: startTime.format("HH:mm"),
                        workEndTime: endTime.format("HH:mm"),
                        lunchRestStartTime: lunchRestStartTime.format("HH:mm"),
                        lunchRestEndTime: lunchRestEndTime.format("HH:mm"),
                    } as unknown as UpdateAppConfigInput);
                    dispatch(pushNotification({
                        tone: "success",
                        message: S14002
                    }));
                }
                else {
                    await saveConfig({
                        name: "default",
                        workStartTime: startTime.format("HH:mm"),
                        workEndTime: endTime.format("HH:mm"),
                        lunchRestStartTime: lunchRestStartTime.format("HH:mm"),
                        lunchRestEndTime: lunchRestEndTime.format("HH:mm"),
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
        }
        else {
            dispatch(pushNotification({
                tone: "error",
                message: E14002
            }));
        }
    };
    return (<AdminSettingsLayout>
      <AdminSettingsSection actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <WorkingTimeSection startTime={startTime} endTime={endTime} lunchRestStartTime={lunchRestStartTime} lunchRestEndTime={lunchRestEndTime} setStartTime={setStartTime} setEndTime={setEndTime} setLunchRestStartTime={setLunchRestStartTime} setLunchRestEndTime={setLunchRestEndTime}/>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
