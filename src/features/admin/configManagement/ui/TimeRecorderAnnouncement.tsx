import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton } from "@features/admin/layout/ui/SettingsPrimitives";
import { useContext, useEffect, useState } from "react";

import { useSaveAppConfigSection } from "../lib/useSaveAppConfigSection";
import TimeRecorderAnnouncementSection from "./TimeRecorderAnnouncementSection";

export default function TimeRecorderAnnouncement() {
    const { getTimeRecorderAnnouncement } = useContext(AppConfigContext);
    const [enabled, setEnabled] = useState(false);
    const [message, setMessage] = useState("");
    const saveAppConfigSection = useSaveAppConfigSection();
    useEffect(() => {
        const announcement = getTimeRecorderAnnouncement();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEnabled(announcement.enabled);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessage(announcement.message);
    }, [getTimeRecorderAnnouncement]);
    const handleSave = async () => {
        await saveAppConfigSection({
            timeRecorderAnnouncementEnabled: enabled,
            timeRecorderAnnouncementMessage: message,
        });
    };
    return (<AdminSettingsLayout>
      <AdminSettingsSection actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <TimeRecorderAnnouncementSection enabled={enabled} message={message} onEnabledChange={setEnabled} onMessageChange={setMessage}/>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
