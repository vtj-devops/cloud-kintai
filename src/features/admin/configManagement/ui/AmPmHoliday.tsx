import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { DEFAULT_AM_HOLIDAY_END, DEFAULT_AM_HOLIDAY_START, DEFAULT_PM_HOLIDAY_END, DEFAULT_PM_HOLIDAY_START, TIME_FORMAT, } from "@features/admin/configManagement/lib/constants";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import { SettingsButton, SettingsSwitch, SettingsTimeField, } from "@features/admin/layout/ui/SettingsPrimitives";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import dayjs, { Dayjs } from "dayjs";
import { useContext, useEffect, useState } from "react";

import { E14002 } from "@/errors";

import { useSaveAppConfigSection } from "../lib/useSaveAppConfigSection";

export default function AmPmHoliday() {
    const { getAmHolidayStartTime, getAmHolidayEndTime, getPmHolidayStartTime, getPmHolidayEndTime, getAmPmHolidayEnabled, } = useContext(AppConfigContext);
    const [amHolidayStartTime, setAmHolidayStartTime] = useState<Dayjs | null>(dayjs(DEFAULT_AM_HOLIDAY_START, TIME_FORMAT));
    const [amHolidayEndTime, setAmHolidayEndTime] = useState<Dayjs | null>(dayjs(DEFAULT_AM_HOLIDAY_END, TIME_FORMAT));
    const [pmHolidayStartTime, setPmHolidayStartTime] = useState<Dayjs | null>(dayjs(DEFAULT_PM_HOLIDAY_START, TIME_FORMAT));
    const [pmHolidayEndTime, setPmHolidayEndTime] = useState<Dayjs | null>(dayjs(DEFAULT_PM_HOLIDAY_END, TIME_FORMAT));
    const [amPmHolidayEnabled, setAmPmHolidayEnabled] = useState<boolean>(true);
    const saveAppConfigSection = useSaveAppConfigSection();
    const dispatch = useAppDispatchV2();
    useEffect(() => {
        if (typeof getAmHolidayStartTime === "function" && getAmHolidayStartTime())
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAmHolidayStartTime(getAmHolidayStartTime());
        if (typeof getAmHolidayEndTime === "function" && getAmHolidayEndTime())
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAmHolidayEndTime(getAmHolidayEndTime());
        if (typeof getPmHolidayStartTime === "function" && getPmHolidayStartTime())
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPmHolidayStartTime(getPmHolidayStartTime());
        if (typeof getPmHolidayEndTime === "function" && getPmHolidayEndTime())
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPmHolidayEndTime(getPmHolidayEndTime());
        if (typeof getAmPmHolidayEnabled === "function")
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAmPmHolidayEnabled(getAmPmHolidayEnabled());
    }, [getAmHolidayStartTime, getAmHolidayEndTime, getPmHolidayStartTime, getPmHolidayEndTime, getAmPmHolidayEnabled]);
    const handleSave = async () => {
        await saveAppConfigSection(
            {
                amHolidayStartTime: amHolidayStartTime?.format("HH:mm") ?? "",
                amHolidayEndTime: amHolidayEndTime?.format("HH:mm") ?? "",
                pmHolidayStartTime: pmHolidayStartTime?.format("HH:mm") ?? "",
                pmHolidayEndTime: pmHolidayEndTime?.format("HH:mm") ?? "",
                amPmHolidayEnabled,
            },
            {
                validate: () =>
                    Boolean(
                        amHolidayStartTime &&
                            amHolidayEndTime &&
                            pmHolidayStartTime &&
                            pmHolidayEndTime,
                    ),
                onInvalid: () => {
                    dispatch(
                        pushNotification({
                            tone: "error",
                            message: E14002,
                        }),
                    );
                },
            },
        );
    };
    return (<AdminSettingsLayout>
      <AdminSettingsSection actions={<SettingsButton onClick={handleSave}>保存</SettingsButton>}>
        <div className="flex flex-col gap-6">
          <p className="text-sm text-slate-500">
            この機能が有効な場合、午前休暇と午後休暇の時間帯を設定できます。
          </p>
          <div>
            <SettingsSwitch checked={amPmHolidayEnabled} onChange={setAmPmHolidayEnabled} label={amPmHolidayEnabled ? "有効" : "無効"}/>
          </div>

          <div className="flex flex-row flex-wrap items-end gap-4">
            <span className="w-12 text-sm font-semibold text-slate-700">午前</span>
            <SettingsTimeField label="開始" value={amHolidayStartTime} onChange={setAmHolidayStartTime} disabled={!amPmHolidayEnabled} className="w-full max-w-[200px]"/>
            <span className="text-base text-slate-800">〜</span>
            <SettingsTimeField label="終了" value={amHolidayEndTime} onChange={setAmHolidayEndTime} disabled={!amPmHolidayEnabled} className="w-full max-w-[200px]"/>
          </div>

          <div className="flex flex-row flex-wrap items-end gap-4">
            <span className="w-12 text-sm font-semibold text-slate-700">午後</span>
            <SettingsTimeField label="開始" value={pmHolidayStartTime} onChange={setPmHolidayStartTime} disabled={!amPmHolidayEnabled} className="w-full max-w-[200px]"/>
            <span className="text-base text-slate-800">〜</span>
            <SettingsTimeField label="終了" value={pmHolidayEndTime} onChange={setPmHolidayEndTime} disabled={!amPmHolidayEnabled} className="w-full max-w-[200px]"/>
          </div>
        </div>
      </AdminSettingsSection>
    </AdminSettingsLayout>);
}
