import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { appendItem, removeItemAt, updateItem } from "@features/admin/configManagement/lib/arrayHelpers";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton } from "@features/admin/layout/ui/SettingsPrimitives";
import { CreateAppConfigInput, UpdateAppConfigInput, } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useContext, useEffect, useState } from "react";

import { E14001, S14001, S14002 } from "@/errors";

import LinkListSection from "./LinkListSection";

export default function Links() {
    const { getLinks, getConfigId, saveConfig, fetchConfig } = useContext(AppConfigContext);
    const [links, setLinks] = useState<{
        label: string;
        url: string;
        enabled: boolean;
        icon: string;
    }[]>([]);
    const [id, setId] = useState<string | null>(null);
    const dispatch = useAppDispatchV2();
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLinks(getLinks());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setId(getConfigId());
    }, [getLinks, getConfigId]);
    const handleAddLink = () => setLinks(appendItem(links, { label: "", url: "", enabled: true, icon: "" }));
    const handleLinkChange = (index: number, field: "label" | "url" | "enabled" | "icon", value: string | boolean) => {
        setLinks(updateItem(links, index, (l) => ({ ...l, [field]: value } as typeof l)));
    };
    const handleRemoveLink = (index: number) => setLinks(removeItemAt(links, index));
    const handleSave = async () => {
        try {
            if (id) {
                await saveConfig({
                    id,
                    links: links.map((l) => ({
                        label: l.label,
                        url: l.url,
                        enabled: l.enabled,
                        icon: l.icon,
                    })),
                } as unknown as UpdateAppConfigInput);
                dispatch(pushNotification({
                    tone: "success",
                    message: S14002
                }));
            }
            else {
                await saveConfig({
                    name: "default",
                    links: links.map((l) => ({
                        label: l.label,
                        url: l.url,
                        enabled: l.enabled,
                        icon: l.icon,
                    })),
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
        <LinkListSection links={links} onAddLink={handleAddLink} onLinkChange={handleLinkChange} onRemoveLink={handleRemoveLink}/>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
