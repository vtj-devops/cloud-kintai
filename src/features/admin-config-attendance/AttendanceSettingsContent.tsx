import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import {
  appendItem,
  removeItemAt,
  toggleEnabledAt,
  updateItem,
} from "@features/admin/configManagement/lib/arrayHelpers";
import {
  DEFAULT_AM_HOLIDAY_END,
  DEFAULT_AM_HOLIDAY_START,
  DEFAULT_PM_HOLIDAY_END,
  DEFAULT_PM_HOLIDAY_START,
  TIME_FORMAT,
} from "@features/admin/configManagement/lib/constants";
import OfficeModeSection from "@features/admin/configManagement/ui/OfficeModeSection";
import QuickInputSection from "@features/admin/configManagement/ui/QuickInputSection";
import WorkingTimeSection from "@features/admin/configManagement/ui/WorkingTimeSection";
import AdminSettingsSection from "@features/admin/layout/ui/AdminSettingsSection";
import {
  SettingsAlert,
  SettingsSwitch,
  SettingsTimeField,
} from "@features/admin/layout/ui/SettingsPrimitives";
import {
  CreateAppConfigInput,
  UpdateAppConfigInput,
} from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppTabs } from "@shared/ui/tabs";
import dayjs, { Dayjs } from "dayjs";
import {
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { E14001, E14002, S14001, S14002 } from "@/errors";

type AttendanceSettingsTabKey = "rules" | "inputs";

type SavePayload = Record<string, unknown>;

type QuickInputEntry = {
  time: Dayjs;
  enabled: boolean;
};

const TAB_LABELS: Record<AttendanceSettingsTabKey, string> = {
  rules: "勤務ルール",
  inputs: "申請・入力",
};
const AUTO_SAVE_DELAY = 600;

function useAppConfigSaveAction() {
  const { getConfigId, saveConfig, fetchConfig } = useContext(AppConfigContext);
  const dispatch = useAppDispatchV2();

  const save = async (payload: SavePayload) => {
    try {
      const id = getConfigId();

      if (id) {
        await saveConfig({
          id,
          ...payload,
        } as unknown as UpdateAppConfigInput);
        dispatch(
          pushNotification({
            tone: "success",
            message: S14002,
          }),
        );
      } else {
        await saveConfig({
          name: "default",
          ...payload,
        } as unknown as CreateAppConfigInput);
        dispatch(
          pushNotification({
            tone: "success",
            message: S14001,
          }),
        );
      }

      await fetchConfig();
    } catch {
      dispatch(
        pushNotification({
          tone: "error",
          message: E14001,
        }),
      );
    }
  };

  const notifyValidationError = (message: string = E14002) => {
    dispatch(
      pushNotification({
        tone: "error",
        message,
      }),
    );
  };

  return {
    save,
    notifyValidationError,
  };
}

function AutoSaveStatus({ saving }: { saving: boolean }) {
  return (
    <p className="text-sm text-slate-500" aria-live="polite">
      {saving ? "変更を保存中..." : "変更は自動で保存されます。"}
    </p>
  );
}

function useAutoSaveAction({
  enabled = true,
  validate,
  onSave,
  onInvalid,
}: {
  enabled?: boolean;
  validate?: () => boolean;
  onSave: () => Promise<void>;
  onInvalid?: () => void;
}) {
  const [saveToken, setSaveToken] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!enabled || saveToken === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        if (validate && !validate()) {
          onInvalid?.();
          return;
        }

        setSaving(true);
        try {
          await onSave();
        } finally {
          setSaving(false);
        }
      })();
    }, AUTO_SAVE_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, onInvalid, onSave, saveToken, validate]);

  return {
    saving,
    queueSave: () => setSaveToken((prev) => prev + 1),
  };
}

function WorkingTimePanel() {
  const {
    getStartTime,
    getEndTime,
    getLunchRestStartTime,
    getLunchRestEndTime,
  } = useContext(AppConfigContext);
  const { save, notifyValidationError } = useAppConfigSaveAction();
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [lunchRestStartTime, setLunchRestStartTime] = useState<Dayjs | null>(null);
  const [lunchRestEndTime, setLunchRestEndTime] = useState<Dayjs | null>(null);

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

  const isValid = useCallback(
    () => Boolean(startTime && endTime && lunchRestStartTime && lunchRestEndTime),
    [endTime, lunchRestEndTime, lunchRestStartTime, startTime],
  );
  const persist = useCallback(async () => {
    await save({
      workStartTime: startTime?.format("HH:mm"),
      workEndTime: endTime?.format("HH:mm"),
      lunchRestStartTime: lunchRestStartTime?.format("HH:mm"),
      lunchRestEndTime: lunchRestEndTime?.format("HH:mm"),
    });
  }, [endTime, lunchRestEndTime, lunchRestStartTime, save, startTime]);
  const { saving: autoSaving, queueSave } = useAutoSaveAction({
    validate: isValid,
    onSave: persist,
    onInvalid: () => notifyValidationError(),
  });

  return (
    <AdminSettingsSection
      title="勤務時間"
      description="標準の始業、終業、昼休憩時間を設定します。"
      actions={<AutoSaveStatus saving={autoSaving} />}
    >
      <WorkingTimeSection
        startTime={startTime}
        endTime={endTime}
        lunchRestStartTime={lunchRestStartTime}
        lunchRestEndTime={lunchRestEndTime}
        setStartTime={(value) => {
          setStartTime(value);
          queueSave();
        }}
        setEndTime={(value) => {
          setEndTime(value);
          queueSave();
        }}
        setLunchRestStartTime={(value) => {
          setLunchRestStartTime(value);
          queueSave();
        }}
        setLunchRestEndTime={(value) => {
          setLunchRestEndTime(value);
          queueSave();
        }}
      />
    </AdminSettingsSection>
  );
}

function AmPmHolidayPanel() {
  const {
    getAmHolidayStartTime,
    getAmHolidayEndTime,
    getPmHolidayStartTime,
    getPmHolidayEndTime,
    getAmPmHolidayEnabled,
  } = useContext(AppConfigContext);
  const { save, notifyValidationError } = useAppConfigSaveAction();
  const [amHolidayStartTime, setAmHolidayStartTime] = useState<Dayjs | null>(
    dayjs(DEFAULT_AM_HOLIDAY_START, TIME_FORMAT),
  );
  const [amHolidayEndTime, setAmHolidayEndTime] = useState<Dayjs | null>(
    dayjs(DEFAULT_AM_HOLIDAY_END, TIME_FORMAT),
  );
  const [pmHolidayStartTime, setPmHolidayStartTime] = useState<Dayjs | null>(
    dayjs(DEFAULT_PM_HOLIDAY_START, TIME_FORMAT),
  );
  const [pmHolidayEndTime, setPmHolidayEndTime] = useState<Dayjs | null>(
    dayjs(DEFAULT_PM_HOLIDAY_END, TIME_FORMAT),
  );
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const nextAmStartTime = getAmHolidayStartTime();
    const nextAmEndTime = getAmHolidayEndTime();
    const nextPmStartTime = getPmHolidayStartTime();
    const nextPmEndTime = getPmHolidayEndTime();

    if (nextAmStartTime) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmHolidayStartTime(nextAmStartTime);
    }
    if (nextAmEndTime) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmHolidayEndTime(nextAmEndTime);
    }
    if (nextPmStartTime) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPmHolidayStartTime(nextPmStartTime);
    }
    if (nextPmEndTime) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPmHolidayEndTime(nextPmEndTime);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(getAmPmHolidayEnabled());
  }, [
    getAmHolidayEndTime,
    getAmHolidayStartTime,
    getAmPmHolidayEnabled,
    getPmHolidayEndTime,
    getPmHolidayStartTime,
  ]);

  const isValid = useCallback(
    () =>
      Boolean(
        amHolidayStartTime &&
          amHolidayEndTime &&
          pmHolidayStartTime &&
          pmHolidayEndTime,
      ),
    [amHolidayEndTime, amHolidayStartTime, pmHolidayEndTime, pmHolidayStartTime],
  );
  const persist = useCallback(async () => {
    await save({
      amHolidayStartTime: amHolidayStartTime?.format("HH:mm"),
      amHolidayEndTime: amHolidayEndTime?.format("HH:mm"),
      pmHolidayStartTime: pmHolidayStartTime?.format("HH:mm"),
      pmHolidayEndTime: pmHolidayEndTime?.format("HH:mm"),
      amPmHolidayEnabled: enabled,
    });
  }, [
    amHolidayEndTime,
    amHolidayStartTime,
    enabled,
    pmHolidayEndTime,
    pmHolidayStartTime,
    save,
  ]);
  const { saving: autoSaving, queueSave } = useAutoSaveAction({
    validate: isValid,
    onSave: persist,
    onInvalid: () => notifyValidationError(),
  });

  return (
    <AdminSettingsSection
      title="午前/午後休"
      description="半休機能の有効化と時間帯を設定します。"
      actions={<AutoSaveStatus saving={autoSaving} />}
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-slate-500">
          この機能が有効な場合、午前休暇と午後休暇の時間帯を設定できます。
        </p>
        <div>
          <SettingsSwitch
            checked={enabled}
            onChange={(checked) => {
              setEnabled(checked);
              queueSave();
            }}
            label={enabled ? "有効" : "無効"}
          />
        </div>

        <div className="flex flex-row flex-wrap items-end gap-4">
          <span className="w-12 text-sm font-semibold text-slate-700">午前</span>
          <SettingsTimeField
            label="開始"
            value={amHolidayStartTime}
            onChange={(value) => {
              setAmHolidayStartTime(value);
              queueSave();
            }}
            disabled={!enabled}
            className="w-full max-w-[200px]"
          />
          <span className="text-base text-slate-800">〜</span>
          <SettingsTimeField
            label="終了"
            value={amHolidayEndTime}
            onChange={(value) => {
              setAmHolidayEndTime(value);
              queueSave();
            }}
            disabled={!enabled}
            className="w-full max-w-[200px]"
          />
        </div>

        <div className="flex flex-row flex-wrap items-end gap-4">
          <span className="w-12 text-sm font-semibold text-slate-700">午後</span>
          <SettingsTimeField
            label="開始"
            value={pmHolidayStartTime}
            onChange={(value) => {
              setPmHolidayStartTime(value);
              queueSave();
            }}
            disabled={!enabled}
            className="w-full max-w-[200px]"
          />
          <span className="text-base text-slate-800">〜</span>
          <SettingsTimeField
            label="終了"
            value={pmHolidayEndTime}
            onChange={(value) => {
              setPmHolidayEndTime(value);
              queueSave();
            }}
            disabled={!enabled}
            className="w-full max-w-[200px]"
          />
        </div>
      </div>
    </AdminSettingsSection>
  );
}

function OfficeModePanel() {
  const { getOfficeMode, getHourlyPaidHolidayEnabled } =
    useContext(AppConfigContext);
  const { save } = useAppConfigSaveAction();
  const [officeMode, setOfficeMode] = useState(false);
  const [hourlyPaidHolidayEnabled, setHourlyPaidHolidayEnabled] =
    useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOfficeMode(getOfficeMode());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHourlyPaidHolidayEnabled(getHourlyPaidHolidayEnabled());
  }, [getHourlyPaidHolidayEnabled, getOfficeMode]);
  const persist = useCallback(async () => {
    await save({
      officeMode,
      hourlyPaidHolidayEnabled,
    });
  }, [hourlyPaidHolidayEnabled, officeMode, save]);
  const { saving: autoSaving, queueSave } = useAutoSaveAction({
    onSave: persist,
  });

  return (
    <AdminSettingsSection
      title="出勤モード"
      description="打刻運用方式と時間単位休暇機能を切り替えます。"
      actions={<AutoSaveStatus saving={autoSaving} />}
    >
      <OfficeModeSection
        officeMode={officeMode}
        onOfficeModeChange={(checked) => {
          setOfficeMode(checked);
          queueSave();
        }}
        hourlyPaidHolidayEnabled={hourlyPaidHolidayEnabled}
        onHourlyPaidHolidayEnabledChange={(checked) => {
          setHourlyPaidHolidayEnabled(checked);
          queueSave();
        }}
      />
    </AdminSettingsSection>
  );
}

function useToggleSetting(getter: () => boolean, saveKey: string) {
  const { save } = useAppConfigSaveAction();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(getter());
  }, [getter]);

  const persist = useCallback(async () => {
    await save({ [saveKey]: enabled });
  }, [enabled, save, saveKey]);

  const { saving, queueSave } = useAutoSaveAction({ onSave: persist });

  return { enabled, setEnabled, saving, queueSave };
}

function ToggleSettingPanel({
  title,
  description,
  helperText,
  getter,
  saveKey,
}: {
  title: string;
  description: string;
  helperText: string;
  getter: () => boolean;
  saveKey: string;
}) {
  const { enabled, setEnabled, saving, queueSave } = useToggleSetting(
    getter,
    saveKey,
  );

  return (
    <AdminSettingsSection
      title={title}
      description={description}
      actions={<AutoSaveStatus saving={saving} />}
    >
      <div className="flex flex-col gap-4">
        <div>
          <SettingsSwitch
            checked={enabled}
            onChange={(checked) => {
              setEnabled(checked);
              queueSave();
            }}
            label={enabled ? "有効" : "無効"}
          />
        </div>
        <p className="text-sm text-slate-500">{helperText}</p>
      </div>
    </AdminSettingsSection>
  );
}

function QuickInputPanel() {
  const { getQuickInputStartTimes, getQuickInputEndTimes } =
    useContext(AppConfigContext);
  const { save } = useAppConfigSaveAction();
  const [quickInputStartTimes, setQuickInputStartTimes] = useState<
    QuickInputEntry[]
  >([]);
  const [quickInputEndTimes, setQuickInputEndTimes] = useState<QuickInputEntry[]>(
    [],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuickInputStartTimes(
      getQuickInputStartTimes().map((entry) => ({
        time: dayjs(entry.time, TIME_FORMAT),
        enabled: entry.enabled,
      })),
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuickInputEndTimes(
      getQuickInputEndTimes().map((entry) => ({
        time: dayjs(entry.time, TIME_FORMAT),
        enabled: entry.enabled,
      })),
    );
  }, [getQuickInputEndTimes, getQuickInputStartTimes]);
  const persist = useCallback(async () => {
    await save({
      quickInputStartTimes: quickInputStartTimes.map((entry) => ({
        time: entry.time.format("HH:mm"),
        enabled: entry.enabled,
      })),
      quickInputEndTimes: quickInputEndTimes.map((entry) => ({
        time: entry.time.format("HH:mm"),
        enabled: entry.enabled,
      })),
    });
  }, [quickInputEndTimes, quickInputStartTimes, save]);
  const { saving: autoSaving, queueSave } = useAutoSaveAction({
    onSave: persist,
  });

  return (
    <AdminSettingsSection
      title="クイック入力"
      description="勤怠編集画面で使う出勤・退勤時刻の候補を整備します。"
      actions={<AutoSaveStatus saving={autoSaving} />}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          勤怠編集画面でボタンを押すと時刻が簡単に入力されます。この機能は、勤務開始時刻と勤務終了時刻のみを設定できます。
        </p>
        <QuickInputSection
          quickInputStartTimes={quickInputStartTimes}
          quickInputEndTimes={quickInputEndTimes}
          onAddQuickInputStartTime={() => {
            setQuickInputStartTimes(
              appendItem(quickInputStartTimes, {
                time: dayjs(),
                enabled: true,
              }),
            );
            queueSave();
          }}
          onQuickInputStartTimeChange={(index, newValue) => {
            if (!newValue) {
              return;
            }
            setQuickInputStartTimes(
              updateItem(quickInputStartTimes, index, (entry) => ({
                ...entry,
                time: newValue,
              })),
            );
            queueSave();
          }}
          onQuickInputStartTimeToggle={(index) => {
            setQuickInputStartTimes(
              toggleEnabledAt(quickInputStartTimes, index),
            );
            queueSave();
          }}
          onRemoveQuickInputStartTime={(index) => {
            setQuickInputStartTimes(removeItemAt(quickInputStartTimes, index));
            queueSave();
          }}
          onAddQuickInputEndTime={() => {
            setQuickInputEndTimes(
              appendItem(quickInputEndTimes, {
                time: dayjs(),
                enabled: true,
              }),
            );
            queueSave();
          }}
          onQuickInputEndTimeChange={(index, newValue) => {
            if (!newValue) {
              return;
            }
            setQuickInputEndTimes(
              updateItem(quickInputEndTimes, index, (entry) => ({
                ...entry,
                time: newValue,
              })),
            );
            queueSave();
          }}
          onQuickInputEndTimeToggle={(index) => {
            setQuickInputEndTimes(toggleEnabledAt(quickInputEndTimes, index));
            queueSave();
          }}
          onRemoveQuickInputEndTime={(index) => {
            setQuickInputEndTimes(removeItemAt(quickInputEndTimes, index));
            queueSave();
          }}
        />
      </div>
    </AdminSettingsSection>
  );
}

export default function AttendanceSettingsContent() {
  const [activeTab, setActiveTab] = useState<AttendanceSettingsTabKey>("rules");
  const {
    getSpecialHolidayEnabled = () => false,
    getAbsentEnabled = () => false,
    getOverTimeCheckEnabled = () => false,
  } = useContext(AppConfigContext);
  const tabs = [
    {
      value: "rules" as const,
      label: TAB_LABELS.rules,
      content: (
        <div className="flex flex-col gap-6">
          <SettingsAlert>
            勤怠一覧と勤怠編集に直接影響するルールを、このタブでまとめて更新できます。
          </SettingsAlert>
          <WorkingTimePanel />
          <AmPmHolidayPanel />
          <OfficeModePanel />
          <ToggleSettingPanel
            title="特別休暇"
            description="忌引きなどの特別休暇を勤怠編集で扱えるようにします。"
            helperText="特別休暇を有効化すると、勤怠編集画面で申請や編集ができるようになります。"
            getter={getSpecialHolidayEnabled}
            saveKey="specialHolidayEnabled"
          />
          <ToggleSettingPanel
            title="欠勤"
            description="欠勤を勤怠編集画面で扱えるようにします。"
            helperText="欠勤設定を有効にすると、勤怠編集画面で欠勤の管理が可能になります。"
            getter={getAbsentEnabled}
            saveKey="absentEnabled"
          />
        </div>
      ),
    },
    {
      value: "inputs" as const,
      label: TAB_LABELS.inputs,
      content: (
        <div className="flex flex-col gap-6">
          <SettingsAlert>
            申請時の確認挙動や、勤怠入力の補助設定をこのタブで管理します。
          </SettingsAlert>
          <ToggleSettingPanel
            title="残業確認"
            description="残業確認メッセージの表示可否を切り替えます。"
            helperText="勤怠編集画面で、残業申請がない場合や承認時間を超えた場合に確認メッセージを表示するかどうかを切り替えます。"
            getter={getOverTimeCheckEnabled}
            saveKey="overTimeCheckEnabled"
          />
          <QuickInputPanel />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <AppTabs
        value={activeTab}
        onChange={setActiveTab}
        items={tabs}
        appearance="mui-standard"
        panelPadding={3}
        tabsProps={{
          "aria-label": "勤怠設定タブ",
          variant: "scrollable",
        }}
      />
    </div>
  );
}
