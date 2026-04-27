import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import useAppConfig from "@entities/app-config/model/useAppConfig";
import type { ReactNode } from "react";
import { useMemo } from "react";

type AppConfigProviderProps = {
  children: ReactNode;
};

export function AppConfigProvider({ children }: AppConfigProviderProps) {
  const { config, derived, loading, isConfigLoading, fetchConfig, saveConfig } =
    useAppConfig();

  const value = useMemo(
    () => ({
      config,
      derived,
      loading,
      isLoading: isConfigLoading,
      isConfigLoading,
      refetch: fetchConfig,
      save: saveConfig,
      fetchConfig,
      saveConfig,
      // Deprecated getters — kept for backward compat, use derived instead
      getConfigId: () => derived.configId,
      getStartTime: () => derived.startTime,
      getEndTime: () => derived.endTime,
      getLunchRestStartTime: () => derived.lunchRestStartTime,
      getLunchRestEndTime: () => derived.lunchRestEndTime,
      getStandardWorkHours: () => derived.standardWorkHours,
      getLinks: () => derived.links,
      getReasons: () => derived.reasons,
      getOfficeMode: () => derived.officeMode,
      getAttendanceStatisticsEnabled: () => derived.attendanceStatisticsEnabled,
      getWorkflowNotificationEnabled: () => derived.workflowNotificationEnabled,
      getTimeRecorderAnnouncement: () => derived.timeRecorderAnnouncement,
      getShiftCollaborativeEnabled: () => derived.shiftCollaborativeEnabled,
      getShiftDefaultMode: () => derived.shiftDefaultMode,
      getQuickInputStartTimes: (onlyEnabled = false) =>
        onlyEnabled
          ? derived.quickInputStartTimesEnabled
          : derived.quickInputStartTimes,
      getQuickInputEndTimes: (onlyEnabled = false) =>
        onlyEnabled
          ? derived.quickInputEndTimesEnabled
          : derived.quickInputEndTimes,
      getShiftGroups: () => derived.shiftGroups,
      getHourlyPaidHolidayEnabled: () => derived.hourlyPaidHolidayEnabled,
      getAmHolidayStartTime: () => derived.amHolidayStartTime,
      getAmHolidayEndTime: () => derived.amHolidayEndTime,
      getPmHolidayStartTime: () => derived.pmHolidayStartTime,
      getPmHolidayEndTime: () => derived.pmHolidayEndTime,
      getAmPmHolidayEnabled: () => derived.amPmHolidayEnabled,
      getSpecialHolidayEnabled: () => derived.specialHolidayEnabled,
      getAbsentEnabled: () => derived.absentEnabled,
      getOverTimeCheckEnabled: () => derived.overTimeCheckEnabled,
      getWorkflowCategoryOrder: () => derived.workflowCategoryOrder,
      getThemeColor: () => derived.themeColor,
      getThemeTokens: () => derived.themeTokens,
    }),
    [config, derived, fetchConfig, isConfigLoading, loading, saveConfig],
  );

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}
