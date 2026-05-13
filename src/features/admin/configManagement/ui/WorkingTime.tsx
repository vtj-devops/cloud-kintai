import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton } from "@features/admin/layout/ui/SettingsPrimitives";
import { Dayjs } from "dayjs";
import { useContext, useEffect, useState } from "react";

import { useSaveAppConfigSection } from "../lib/useSaveAppConfigSection";
import WorkingTimeSection from "./WorkingTimeSection";

export default function WorkingTime() {
    const { getStartTime, getEndTime, getLunchRestStartTime, getLunchRestEndTime } = useContext(AppConfigContext);
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const [lunchRestStartTime, setLunchRestStartTime] = useState<Dayjs | null>(null);
    const [lunchRestEndTime, setLunchRestEndTime] = useState<Dayjs | null>(null);
    const saveAppConfigSection = useSaveAppConfigSection();
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStartTime(getStartTime());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEndTime(getEndTime());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLunchRestStartTime(getLunchRestStartTime());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLunchRestEndTime(getLunchRestEndTime());
    }, [getEndTime, getLunchRestEndTime, getLunchRestStartTime, getStartTime]);
    const handleSave = async () => {
        if (startTime && endTime && lunchRestStartTime && lunchRestEndTime) {
            await saveAppConfigSection({
                workStartTime: startTime.format("HH:mm"),
                workEndTime: endTime.format("HH:mm"),
                lunchRestStartTime: lunchRestStartTime.format("HH:mm"),
                lunchRestEndTime: lunchRestEndTime.format("HH:mm"),
            });
        }
    };
    return (<AdminSettingsLayout>
      <AdminSettingsSection actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <WorkingTimeSection startTime={startTime} endTime={endTime} lunchRestStartTime={lunchRestStartTime} lunchRestEndTime={lunchRestEndTime} setStartTime={setStartTime} setEndTime={setEndTime} setLunchRestStartTime={setLunchRestStartTime} setLunchRestEndTime={setLunchRestEndTime}/>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
