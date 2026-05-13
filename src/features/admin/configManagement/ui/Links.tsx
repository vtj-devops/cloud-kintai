import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { appendItem, removeItemAt, updateItem } from "@features/admin/configManagement/lib/arrayHelpers";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton } from "@features/admin/layout/ui/SettingsPrimitives";
import { useContext, useEffect, useState } from "react";

import { useSaveAppConfigSection } from "../lib/useSaveAppConfigSection";
import LinkListSection from "./LinkListSection";

export default function Links() {
    const { getLinks } = useContext(AppConfigContext);
    const [links, setLinks] = useState<{
        label: string;
        url: string;
        enabled: boolean;
        icon: string;
    }[]>([]);
    const saveAppConfigSection = useSaveAppConfigSection();
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLinks(getLinks());
    }, [getLinks]);
    const handleAddLink = () => setLinks(appendItem(links, { label: "", url: "", enabled: true, icon: "" }));
    const handleLinkChange = (index: number, field: "label" | "url" | "enabled" | "icon", value: string | boolean) => {
        setLinks(updateItem(links, index, (l) => ({ ...l, [field]: value } as typeof l)));
    };
    const handleRemoveLink = (index: number) => setLinks(removeItemAt(links, index));
    const handleSave = async () => {
        await saveAppConfigSection({
            links: links.map((l) => ({
                label: l.label,
                url: l.url,
                enabled: l.enabled,
                icon: l.icon,
            })),
        });
    };
    return (<AdminSettingsLayout>
      <AdminSettingsSection actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <LinkListSection links={links} onAddLink={handleAddLink} onLinkChange={handleLinkChange} onRemoveLink={handleRemoveLink}/>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
