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

import ReasonListSection from "./ReasonListSection";

export default function Reasons() {
    const { getReasons, getConfigId, saveConfig, fetchConfig } = useContext(AppConfigContext);
    const [reasons, setReasons] = useState<{
        reason: string;
        enabled: boolean;
    }[]>([]);
    const [id, setId] = useState<string | null>(null);
    const dispatch = useAppDispatchV2();
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReasons(getReasons());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setId(getConfigId());
    }, [getReasons, getConfigId]);
    const handleAddReason = () => setReasons(appendItem(reasons, { reason: "", enabled: true }));
    const handleReasonChange = (index: number, field: "reason" | "enabled", value: string | boolean) => {
        setReasons(updateItem(reasons, index, (r) => ({ ...r, [field]: value } as typeof r)));
    };
    const handleRemoveReason = (index: number) => setReasons(removeItemAt(reasons, index));
    const handleSave = async () => {
        try {
            if (id) {
                await saveConfig({
                    id,
                    reasons: reasons.map((r) => ({
                        reason: r.reason,
                        enabled: r.enabled,
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
                    reasons: reasons.map((r) => ({
                        reason: r.reason,
                        enabled: r.enabled,
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
    return (<AdminSettingsLayout description="修正理由のテキスト一覧を管理してください。">
      <AdminSettingsSection actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <ReasonListSection reasons={reasons} onAddReason={handleAddReason} onReasonChange={handleReasonChange} onRemoveReason={handleRemoveReason}/>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
