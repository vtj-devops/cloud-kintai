import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton, SettingsSwitch } from "@features/admin/layout/ui/SettingsPrimitives";
import { useContext, useEffect, useState } from "react";

import { useSaveAppConfigSection } from "../lib/useSaveAppConfigSection";

export default function AttendanceStatistics() {
  const { getAttendanceStatisticsEnabled } = useContext(AppConfigContext);
  const [enabled, setEnabled] = useState<boolean>(false);
  const saveAppConfigSection = useSaveAppConfigSection();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(getAttendanceStatisticsEnabled());
  }, [getAttendanceStatisticsEnabled]);
  const handleChange = (checked: boolean) => {
    setEnabled(checked);
  };
  const handleSave = async () => {
    await saveAppConfigSection({ attendanceStatisticsEnabled: enabled });
  };
    return (<AdminSettingsLayout>
      <AdminSettingsSection actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <div className="flex flex-col gap-4">
          <div>
            <SettingsSwitch checked={enabled} onChange={handleChange} label={enabled ? "有効" : "無効"} ariaLabel="稼働統計の表示切り替え"/>
          </div>
          <p className="text-sm text-slate-500">
            勤怠メニューの稼働統計ページ表示を有効/無効にします。無効時はメニューから非表示になり、直接アクセスは勤怠一覧にリダイレクトされます。
          </p>
        </div>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
