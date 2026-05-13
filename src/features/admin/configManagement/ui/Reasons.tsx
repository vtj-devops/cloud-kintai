import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { appendItem, removeItemAt, updateItem } from "@features/admin/configManagement/lib/arrayHelpers";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton } from "@features/admin/layout/ui/SettingsPrimitives";
import { useContext, useEffect, useState } from "react";

import { useSaveAppConfigSection } from "../lib/useSaveAppConfigSection";
import ReasonListSection from "./ReasonListSection";

export default function Reasons() {
    const { getReasons } = useContext(AppConfigContext);
    const [reasons, setReasons] = useState<{
        reason: string;
        enabled: boolean;
    }[]>([]);
    const saveAppConfigSection = useSaveAppConfigSection();
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReasons(getReasons());
    }, [getReasons]);
    const handleAddReason = () => setReasons(appendItem(reasons, { reason: "", enabled: true }));
    const handleReasonChange = (index: number, field: "reason" | "enabled", value: string | boolean) => {
        setReasons(updateItem(reasons, index, (r) => ({ ...r, [field]: value } as typeof r)));
    };
    const handleRemoveReason = (index: number) => setReasons(removeItemAt(reasons, index));
    const handleSave = async () => {
        await saveAppConfigSection({
            reasons: reasons.map((r) => ({
                reason: r.reason,
                enabled: r.enabled,
            })),
        });
    };
    return (<AdminSettingsLayout description="修正理由のテキスト一覧を管理してください。">
      <AdminSettingsSection actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <ReasonListSection reasons={reasons} onAddReason={handleAddReason} onReasonChange={handleReasonChange} onRemoveReason={handleRemoveReason}/>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
