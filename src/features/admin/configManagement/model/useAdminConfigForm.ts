import dayjs, { Dayjs } from "dayjs";
import type { ChangeEvent } from "react";
import { useContext, useEffect, useMemo, useState } from "react";

import { useAppDispatchV2 } from "@/app/hooks";
import { AppConfigContext } from "@/context/AppConfigContext";
import { E14001, S14001, S14002 } from "@/errors";
import {
  appendItem,
  removeItemAt,
  toggleEnabledAt,
  updateItem,
} from "@/features/admin/configManagement/lib/arrayHelpers";
import {
  DEFAULT_AM_HOLIDAY_END,
  DEFAULT_AM_HOLIDAY_START,
  DEFAULT_PM_HOLIDAY_END,
  DEFAULT_PM_HOLIDAY_START,
  TIME_FORMAT,
} from "@/features/admin/configManagement/lib/constants";
import {
  buildCreatePayload,
  buildUpdatePayload,
} from "@/features/admin/configManagement/lib/payloadHelpers";
import { validateAdminConfigForm } from "@/features/admin/configManagement/lib/validation";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "@/shared/lib/store/snackbarSlice";

export type QuickInputEntry = { time: Dayjs; enabled: boolean };
export type LinkItem = {
  label: string;
  url: string;
  enabled: boolean;
  icon: string;
};
export type ReasonItem = { reason: string; enabled: boolean };

export function useAdminConfigForm() {
  const {
    fetchConfig,
    saveConfig,
    getStartTime,
    getEndTime,
    getConfigId,
    getLinks,
    getReasons,
    getOfficeMode,
    getQuickInputStartTimes,
    getQuickInputEndTimes,
    getLunchRestStartTime,
    getLunchRestEndTime,
    getHourlyPaidHolidayEnabled,
    getAmHolidayStartTime,
    getAmHolidayEndTime,
    getPmHolidayStartTime,
    getPmHolidayEndTime,
    getAmPmHolidayEnabled,
    getSpecialHolidayEnabled,
    getAbsentEnabled,
    getAttendanceStatisticsEnabled,
    getOverTimeCheckEnabled,
    getThemeTokens,
  } = useContext(AppConfigContext);

  const adminPanelTokens = useMemo(
    () => getThemeTokens(),
    [
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
  );
  const sectionSpacing = adminPanelTokens.component.adminPanel.sectionSpacing;

  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [quickInputStartTimes, setQuickInputStartTimes] = useState<
    QuickInputEntry[]
  >([]);
  const [quickInputEndTimes, setQuickInputEndTimes] = useState<
    QuickInputEntry[]
  >([]);
  const [id, setId] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [reasons, setReasons] = useState<ReasonItem[]>([]);
  const [officeMode, setOfficeMode] = useState<boolean>(false);
  const [lunchRestStartTime, setLunchRestStartTime] = useState<Dayjs | null>(
    null,
  );
  const [lunchRestEndTime, setLunchRestEndTime] = useState<Dayjs | null>(null);
  const [hourlyPaidHolidayEnabled, setHourlyPaidHolidayEnabled] =
    useState<boolean>(false);
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
  const [attendanceStatisticsEnabled, setAttendanceStatisticsEnabled] =
    useState<boolean>(false);
  const [amPmHolidayEnabled, setAmPmHolidayEnabled] = useState<boolean>(true);
  const [specialHolidayEnabled, setSpecialHolidayEnabled] =
    useState<boolean>(false);
  const [absentEnabled, setAbsentEnabled] = useState<boolean>(false);
  const [overTimeCheckEnabled, setOverTimeCheckEnabled] =
    useState<boolean>(false);

  const dispatch = useAppDispatchV2();

  const hydrateFromContext = () => {
    setStartTime(getStartTime());
    setEndTime(getEndTime());
    setId(getConfigId());
    setLinks(getLinks());
    setReasons(getReasons());
    setOfficeMode(getOfficeMode());

    const startTimes = getQuickInputStartTimes();
    setQuickInputStartTimes(
      startTimes.map((entry) => ({
        time: dayjs(entry.time, TIME_FORMAT),
        enabled: entry.enabled,
      })),
    );
    setQuickInputEndTimes(
      getQuickInputEndTimes().map((entry) => ({
        time: dayjs(entry.time, TIME_FORMAT),
        enabled: entry.enabled,
      })),
    );

    setLunchRestStartTime(getLunchRestStartTime());
    setLunchRestEndTime(getLunchRestEndTime());
    setHourlyPaidHolidayEnabled(getHourlyPaidHolidayEnabled());

    if (typeof getSpecialHolidayEnabled === "function") {
      setSpecialHolidayEnabled(getSpecialHolidayEnabled());
    }
    if (typeof getAbsentEnabled === "function") {
      setAbsentEnabled(getAbsentEnabled());
    }

    if (typeof getOverTimeCheckEnabled === "function") {
      setOverTimeCheckEnabled(getOverTimeCheckEnabled());
    }

    setAttendanceStatisticsEnabled(getAttendanceStatisticsEnabled());

    if (
      typeof getAmHolidayStartTime === "function" &&
      getAmHolidayStartTime()
    ) {
      setAmHolidayStartTime(getAmHolidayStartTime());
    }
    if (typeof getAmHolidayEndTime === "function" && getAmHolidayEndTime()) {
      setAmHolidayEndTime(getAmHolidayEndTime());
    }
    if (
      typeof getPmHolidayStartTime === "function" &&
      getPmHolidayStartTime()
    ) {
      setPmHolidayStartTime(getPmHolidayStartTime());
    }
    if (typeof getPmHolidayEndTime === "function" && getPmHolidayEndTime()) {
      setPmHolidayEndTime(getPmHolidayEndTime());
    }

    if (typeof getAmPmHolidayEnabled === "function") {
      setAmPmHolidayEnabled(getAmPmHolidayEnabled());
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    hydrateFromContext();
  }, []);

  const handleAddLink = () => {
    setLinks(
      appendItem(links, { label: "", url: "", enabled: true, icon: "" }),
    );
  };

  const handleLinkChange = (
    index: number,
    field: keyof LinkItem,
    value: string | boolean,
  ) => {
    setLinks(
      updateItem(
        links,
        index,
        (link) =>
          ({
            ...link,
            [field]: value,
          }) as LinkItem,
      ),
    );
  };

  const handleRemoveLink = (index: number) => {
    setLinks(removeItemAt(links, index));
  };

  const handleAddReason = () => {
    setReasons(appendItem(reasons, { reason: "", enabled: true }));
  };

  const handleReasonChange = (
    index: number,
    field: keyof ReasonItem,
    value: string | boolean,
  ) => {
    setReasons(
      updateItem(
        reasons,
        index,
        (reason) =>
          ({
            ...reason,
            [field]: value,
          }) as ReasonItem,
      ),
    );
  };

  const handleRemoveReason = (index: number) => {
    setReasons(removeItemAt(reasons, index));
  };

  const handleOfficeModeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOfficeMode(event.target.checked);
  };

  const handleAddQuickInputStartTime = () => {
    setQuickInputStartTimes(
      appendItem(quickInputStartTimes, { time: dayjs(), enabled: true }),
    );
  };

  const handleQuickInputStartTimeChange = (
    index: number,
    newValue: Dayjs | null,
  ) => {
    if (!newValue) return;
    setQuickInputStartTimes(
      updateItem(quickInputStartTimes, index, (entry) => ({
        ...entry,
        time: newValue,
      })),
    );
  };

  const handleQuickInputStartTimeToggle = (index: number) => {
    setQuickInputStartTimes(toggleEnabledAt(quickInputStartTimes, index));
  };

  const handleRemoveQuickInputStartTime = (index: number) => {
    setQuickInputStartTimes(removeItemAt(quickInputStartTimes, index));
  };

  const handleAddQuickInputEndTime = () => {
    setQuickInputEndTimes(
      appendItem(quickInputEndTimes, { time: dayjs(), enabled: true }),
    );
  };
  const handleQuickInputEndTimeChange = (
    index: number,
    newValue: Dayjs | null,
  ) => {
    if (!newValue) return;
    setQuickInputEndTimes(
      updateItem(quickInputEndTimes, index, (entry) => ({
        ...entry,
        time: newValue,
      })),
    );
  };

  const handleQuickInputEndTimeToggle = (index: number) => {
    setQuickInputEndTimes(toggleEnabledAt(quickInputEndTimes, index));
  };

  const handleRemoveQuickInputEndTime = (index: number) => {
    setQuickInputEndTimes(removeItemAt(quickInputEndTimes, index));
  };

  const handleHourlyPaidHolidayEnabledChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setHourlyPaidHolidayEnabled(event.target.checked);
  };

  const handleSpecialHolidayEnabledChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setSpecialHolidayEnabled(event.target.checked);
  };

  const handleAbsentEnabledChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAbsentEnabled(event.target.checked);
  };

  const handleAttendanceStatisticsEnabledChange = (
    _: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setAttendanceStatisticsEnabled(checked);
  };

  const handleOverTimeCheckEnabledChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setOverTimeCheckEnabled(event.target.checked);
  };

  const handleSave = async () => {
    const validationResult = validateAdminConfigForm({
      startTime,
      endTime,
      lunchRestStartTime,
      lunchRestEndTime,
      amHolidayStartTime,
      amHolidayEndTime,
      pmHolidayStartTime,
      pmHolidayEndTime,
    });

    if (!validationResult.isValid) {
      dispatch(setSnackbarError(validationResult.errorMessage!));
      return;
    }

    const formState = {
      id,
      links,
      reasons,
      quickInputStartTimes,
      quickInputEndTimes,
      officeMode,
      absentEnabled,
      hourlyPaidHolidayEnabled,
      amPmHolidayEnabled,
      specialHolidayEnabled,
      attendanceStatisticsEnabled,
      overTimeCheckEnabled,
      startTime: startTime!,
      endTime: endTime!,
      lunchRestStartTime: lunchRestStartTime!,
      lunchRestEndTime: lunchRestEndTime!,
      amHolidayStartTime: amHolidayStartTime!,
      amHolidayEndTime: amHolidayEndTime!,
      pmHolidayStartTime: pmHolidayStartTime!,
      pmHolidayEndTime: pmHolidayEndTime!,
    };

    try {
      if (id) {
        const payload = buildUpdatePayload(formState);
        await saveConfig(payload);
        dispatch(setSnackbarSuccess(S14002));
      } else {
        const payload = buildCreatePayload(formState);
        await saveConfig(payload);
        dispatch(setSnackbarSuccess(S14001));
      }
      await fetchConfig();
    } catch {
      dispatch(setSnackbarError(E14001));
    }
  };

  return {
    sectionSpacing,
    startTime,
    endTime,
    lunchRestStartTime,
    lunchRestEndTime,
    quickInputStartTimes,
    quickInputEndTimes,
    links,
    reasons,
    officeMode,
    hourlyPaidHolidayEnabled,
    amHolidayStartTime,
    amHolidayEndTime,
    pmHolidayStartTime,
    pmHolidayEndTime,
    amPmHolidayEnabled,
    specialHolidayEnabled,
    absentEnabled,
    attendanceStatisticsEnabled,
    overTimeCheckEnabled,
    setStartTime,
    setEndTime,
    setLunchRestStartTime,
    setLunchRestEndTime,
    setAmHolidayStartTime,
    setAmHolidayEndTime,
    setPmHolidayStartTime,
    setPmHolidayEndTime,
    setAmPmHolidayEnabled,
    handleOfficeModeChange,
    handleHourlyPaidHolidayEnabledChange,
    handleSpecialHolidayEnabledChange,
    handleAbsentEnabledChange,
    handleAttendanceStatisticsEnabledChange,
    handleOverTimeCheckEnabledChange,
    handleAddLink,
    handleLinkChange,
    handleRemoveLink,
    handleAddReason,
    handleReasonChange,
    handleRemoveReason,
    handleAddQuickInputStartTime,
    handleQuickInputStartTimeChange,
    handleQuickInputStartTimeToggle,
    handleRemoveQuickInputStartTime,
    handleAddQuickInputEndTime,
    handleQuickInputEndTimeChange,
    handleQuickInputEndTimeToggle,
    handleRemoveQuickInputEndTime,
    handleSave,
  };
}
