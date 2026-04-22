import {
  type UpdateAppConfigPayload,
  useCreateAppConfigMutation,
  useGetAppConfigQuery,
  useUpdateAppConfigMutation,
} from "@entities/app-config/api/appConfigApi";
import { getWorkflowCategoryOrder } from "@entities/workflow/lib/workflowLabels";
import {
  buildVersionOrUpdatedAtCondition,
  getNextVersion,
} from "@shared/api/graphql/concurrency";
import type {
  AppConfig,
  CreateAppConfigInput,
  UpdateAppConfigInput,
} from "@shared/api/graphql/types";
import { resolveThemeColor } from "@shared/config/theme";
import {
  applyDesignTokenCssVariables,
  getDesignTokens,
} from "@shared/designSystem";
import { buildClockTimeDayjs } from "@shared/lib/time";
import { useCallback, useEffect, useMemo } from "react";

import type { ShiftGroupConfig } from "./shiftGroupTypes";

export type ShiftDisplayMode = "normal" | "collaborative";

const DEFAULT_THEME_TOKENS = getDesignTokens();

/**
 * アプリケーション設定の一部項目のみを抽出した型。
 */
export type DefaultAppConfig = Pick<
  AppConfig,
  | "name"
  | "workStartTime"
  | "workEndTime"
  | "lunchRestStartTime"
  | "lunchRestEndTime"
  | "links"
  | "officeMode"
  | "reasons"
  | "quickInputStartTimes"
  | "quickInputEndTimes"
  | "themeColor"
  | "shiftGroups"
  | "attendanceStatisticsEnabled"
  | "workflowNotificationEnabled"
  | "timeRecorderAnnouncementEnabled"
  | "timeRecorderAnnouncementMessage"
  | "overTimeCheckEnabled"
  | "shiftCollaborativeEnabled"
  | "shiftDefaultMode"
>;

/**
 * デフォルトのアプリケーション設定値。
 */
export const DEFAULT_CONFIG: DefaultAppConfig = {
  name: "default",
  workStartTime: "09:00",
  workEndTime: "18:00",
  lunchRestStartTime: "12:00",
  lunchRestEndTime: "13:00",
  officeMode: false,
  links: [],
  reasons: [],
  quickInputStartTimes: [],
  quickInputEndTimes: [],
  themeColor: resolveThemeColor(),
  shiftGroups: [],
  attendanceStatisticsEnabled: false,
  workflowNotificationEnabled: false,
  timeRecorderAnnouncementEnabled: false,
  timeRecorderAnnouncementMessage: "",
  overTimeCheckEnabled: false,
  shiftCollaborativeEnabled: false,
  shiftDefaultMode: "normal",
};

const useAppConfig = () => {
  const {
    data: fetchedConfig,
    isLoading,
    isFetching,
    refetch,
  } = useGetAppConfigQuery({ name: "default" });
  const [createAppConfig, { isLoading: isCreating }] =
    useCreateAppConfigMutation();
  const [updateAppConfig, { isLoading: isUpdating }] =
    useUpdateAppConfigMutation();

  const config = fetchedConfig ?? null;

  /**
   * 設定をバックエンドから再取得する。
   */
  const fetchConfig = useCallback(async () => {
    await refetch();
  }, [refetch]);

  /**
   * 設定を新規作成または更新する。
   */
  const saveConfig = useCallback(
    async (newConfig: CreateAppConfigInput | UpdateAppConfigInput) => {
      if ("id" in newConfig && newConfig.id) {
        await updateAppConfig({
          input: {
            ...(newConfig as UpdateAppConfigInput),
            version: getNextVersion(config?.version),
          },
          condition: buildVersionOrUpdatedAtCondition(
            config?.version,
            config?.updatedAt,
          ),
        } satisfies UpdateAppConfigPayload).unwrap();
        return;
      }

      await createAppConfig(newConfig as CreateAppConfigInput).unwrap();
    },
    [createAppConfig, updateAppConfig],
  );

  const getConfigId = useCallback(() => config?.id ?? null, [config?.id]);

  const getStartTime = useCallback(
    () =>
      buildClockTimeDayjs(
        config?.workStartTime ?? undefined,
        DEFAULT_CONFIG.workStartTime ?? "09:00",
      ),
    [config?.workStartTime],
  );

  const getEndTime = useCallback(
    () =>
      buildClockTimeDayjs(
        config?.workEndTime ?? undefined,
        DEFAULT_CONFIG.workEndTime ?? "18:00",
      ),
    [config?.workEndTime],
  );

  const getLunchRestStartTime = useCallback(
    () =>
      buildClockTimeDayjs(
        config?.lunchRestStartTime ?? undefined,
        DEFAULT_CONFIG.lunchRestStartTime ?? "12:00",
      ),
    [config?.lunchRestStartTime],
  );

  const getLunchRestEndTime = useCallback(
    () =>
      buildClockTimeDayjs(
        config?.lunchRestEndTime ?? undefined,
        DEFAULT_CONFIG.lunchRestEndTime ?? "13:00",
      ),
    [config?.lunchRestEndTime],
  );

  const getStandardWorkHours = useCallback(() => {
    const configured = config?.standardWorkHours;
    if (typeof configured === "number") {
      return Math.max(configured, 0);
    }

    const start = getStartTime();
    const end = getEndTime();
    const lunchStart = getLunchRestStartTime();
    const lunchEnd = getLunchRestEndTime();
    const baseHours = end.diff(start, "hour", true);
    const lunchHours = Math.max(lunchEnd.diff(lunchStart, "hour", true), 0);
    return Math.max(baseHours - lunchHours, 0);
  }, [
    config?.standardWorkHours,
    config?.workStartTime,
    config?.workEndTime,
    config?.lunchRestStartTime,
    config?.lunchRestEndTime,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  const getLinks = useCallback(() => {
    if (!config?.links) {
      return [];
    }

    return config.links
      .filter((link): link is NonNullable<typeof link> => Boolean(link))
      .map((link) => ({
        label: link.label ?? "",
        url: link.url ?? "",
        enabled: link.enabled ?? false,
        icon: link.icon ?? "",
      }));
  }, [config?.links]);

  const getReasons = useCallback(() => {
    if (!config?.reasons) {
      return [];
    }

    return config.reasons
      .filter((reason): reason is NonNullable<typeof reason> => Boolean(reason))
      .map((reason) => ({
        reason: reason.reason ?? "",
        enabled: reason.enabled ?? false,
      }));
  }, [config?.reasons]);

  const getOfficeMode = useCallback(
    () => config?.officeMode ?? false,
    [config?.officeMode],
  );

  const getAttendanceStatisticsEnabled = useCallback(
    () => config?.attendanceStatisticsEnabled ?? false,
    [config?.attendanceStatisticsEnabled],
  );

  const getWorkflowNotificationEnabled = useCallback(
    () => config?.workflowNotificationEnabled ?? false,
    [config?.workflowNotificationEnabled],
  );

  const getTimeRecorderAnnouncement = useCallback(
    () => ({
      enabled: Boolean(
        config?.timeRecorderAnnouncementEnabled ??
        DEFAULT_CONFIG.timeRecorderAnnouncementEnabled,
      ),
      message: String(
        config?.timeRecorderAnnouncementMessage ??
          DEFAULT_CONFIG.timeRecorderAnnouncementMessage ??
          "",
      ),
    }),
    [
      config?.timeRecorderAnnouncementEnabled,
      config?.timeRecorderAnnouncementMessage,
    ],
  );

  const getShiftCollaborativeEnabled = useCallback(
    () => config?.shiftCollaborativeEnabled ?? false,
    [config?.shiftCollaborativeEnabled],
  );

  const getShiftDefaultMode = useCallback((): ShiftDisplayMode => {
    return config?.shiftDefaultMode === "collaborative"
      ? "collaborative"
      : "normal";
  }, [config?.shiftDefaultMode]);

  const getQuickInputStartTimes = useCallback(
    (onlyEnabled = false) => {
      if (!config?.quickInputStartTimes) {
        return [];
      }

      return config.quickInputStartTimes
        .filter((time): time is NonNullable<typeof time> => Boolean(time))
        .filter((time) => (onlyEnabled ? Boolean(time.enabled) : true))
        .map((time) => ({
          time: time.time ?? "",
          enabled: time.enabled ?? false,
        }));
    },
    [config?.quickInputStartTimes],
  );

  const getQuickInputEndTimes = useCallback(
    (onlyEnabled = false) => {
      if (!config?.quickInputEndTimes) {
        return [];
      }

      return config.quickInputEndTimes
        .filter((time): time is NonNullable<typeof time> => Boolean(time))
        .filter((time) => (onlyEnabled ? Boolean(time.enabled) : true))
        .map((time) => ({
          time: time.time ?? "",
          enabled: time.enabled ?? false,
        }));
    },
    [config?.quickInputEndTimes],
  );

  const getShiftGroups = useCallback((): ShiftGroupConfig[] => {
    if (!config?.shiftGroups) {
      return [];
    }

    return config.shiftGroups
      .filter((group): group is NonNullable<typeof group> => Boolean(group))
      .map((group) => ({
        label: group.label ?? "",
        description: group.description ?? null,
        min: group.min ?? null,
        max: group.max ?? null,
        fixed: group.fixed ?? null,
      }));
  }, [config?.shiftGroups]);

  const getHourlyPaidHolidayEnabled = useCallback(
    () => config?.hourlyPaidHolidayEnabled ?? false,
    [config?.hourlyPaidHolidayEnabled],
  );

  const getAmHolidayStartTime = useCallback(
    () => buildClockTimeDayjs(config?.amHolidayStartTime, "09:00"),
    [config?.amHolidayStartTime],
  );

  const getAmHolidayEndTime = useCallback(
    () => buildClockTimeDayjs(config?.amHolidayEndTime, "12:00"),
    [config?.amHolidayEndTime],
  );

  const getPmHolidayStartTime = useCallback(
    () => buildClockTimeDayjs(config?.pmHolidayStartTime, "13:00"),
    [config?.pmHolidayStartTime],
  );

  const getPmHolidayEndTime = useCallback(
    () => buildClockTimeDayjs(config?.pmHolidayEndTime, "18:00"),
    [config?.pmHolidayEndTime],
  );

  const getAmPmHolidayEnabled = useCallback(
    () => config?.amPmHolidayEnabled ?? false,
    [config?.amPmHolidayEnabled],
  );

  const getSpecialHolidayEnabled = useCallback(
    () => config?.specialHolidayEnabled ?? false,
    [config?.specialHolidayEnabled],
  );

  const getAbsentEnabled = useCallback(
    () => config?.absentEnabled ?? false,
    [config?.absentEnabled],
  );

  const getOverTimeCheckEnabled = useCallback(
    () => config?.overTimeCheckEnabled ?? false,
    [config?.overTimeCheckEnabled],
  );

  const getWorkflowCategoryOrderFromConfig = useCallback(
    () => getWorkflowCategoryOrder(config),
    [config],
  );

  const getThemeColor = useCallback(() => {
    const fallbackColor = DEFAULT_CONFIG.themeColor;
    const candidate = config?.themeColor ?? fallbackColor;
    return resolveThemeColor(candidate || undefined);
  }, [config?.themeColor]);

  const getThemeTokens = useCallback(
    (brandPrimaryOverride?: string) => {
      const hasRemoteThemeColor = Boolean(config?.themeColor);
      const candidate =
        brandPrimaryOverride ?? config?.themeColor ?? DEFAULT_CONFIG.themeColor;

      if (!brandPrimaryOverride && !hasRemoteThemeColor) {
        return DEFAULT_THEME_TOKENS;
      }

      const resolved = resolveThemeColor(candidate || undefined);
      if (
        !brandPrimaryOverride &&
        resolved === DEFAULT_THEME_TOKENS.color.brand.primary.base
      ) {
        return DEFAULT_THEME_TOKENS;
      }

      return getDesignTokens({ brandPrimary: resolved });
    },
    [config?.themeColor],
  );

  useEffect(() => {
    const tokens = getThemeTokens();
    applyDesignTokenCssVariables(tokens);
  }, [config?.themeColor]);

  const loading = useMemo(
    () => isLoading || isFetching || isCreating || isUpdating,
    [isLoading, isFetching, isCreating, isUpdating],
  );
  const isConfigLoading = useMemo(
    () => isLoading || isFetching,
    [isLoading, isFetching],
  );

  const derived = useMemo(
    () => ({
      startTime: getStartTime(),
      endTime: getEndTime(),
      standardWorkHours: getStandardWorkHours(),
      configId: getConfigId(),
      links: getLinks(),
      reasons: getReasons(),
      officeMode: getOfficeMode(),
      attendanceStatisticsEnabled: getAttendanceStatisticsEnabled(),
      workflowNotificationEnabled: getWorkflowNotificationEnabled(),
      timeRecorderAnnouncement: getTimeRecorderAnnouncement(),
      shiftCollaborativeEnabled: getShiftCollaborativeEnabled(),
      shiftDefaultMode: getShiftDefaultMode(),
      quickInputStartTimes: getQuickInputStartTimes(),
      quickInputStartTimesEnabled: getQuickInputStartTimes(true),
      quickInputEndTimes: getQuickInputEndTimes(),
      quickInputEndTimesEnabled: getQuickInputEndTimes(true),
      shiftGroups: getShiftGroups(),
      lunchRestStartTime: getLunchRestStartTime(),
      lunchRestEndTime: getLunchRestEndTime(),
      hourlyPaidHolidayEnabled: getHourlyPaidHolidayEnabled(),
      amHolidayStartTime: getAmHolidayStartTime(),
      amHolidayEndTime: getAmHolidayEndTime(),
      pmHolidayStartTime: getPmHolidayStartTime(),
      pmHolidayEndTime: getPmHolidayEndTime(),
      amPmHolidayEnabled: getAmPmHolidayEnabled(),
      specialHolidayEnabled: getSpecialHolidayEnabled(),
      absentEnabled: getAbsentEnabled(),
      overTimeCheckEnabled: getOverTimeCheckEnabled(),
      workflowCategoryOrder: getWorkflowCategoryOrderFromConfig(),
      themeColor: getThemeColor(),
      themeTokens: getThemeTokens(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, loading],
  );

  return {
    config,
    derived,
    loading,
    isConfigLoading,
    fetchConfig,
    saveConfig,
    getStartTime,
    getEndTime,
    getStandardWorkHours,
    getConfigId,
    getLinks,
    getReasons,
    getOfficeMode,
    getAttendanceStatisticsEnabled,
    getWorkflowNotificationEnabled,
    getTimeRecorderAnnouncement,
    getShiftCollaborativeEnabled,
    getShiftDefaultMode,
    getQuickInputStartTimes,
    getQuickInputEndTimes,
    getShiftGroups,
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
    getOverTimeCheckEnabled,
    getWorkflowCategoryOrder: getWorkflowCategoryOrderFromConfig,
    getThemeColor,
    getThemeTokens,
  };
};

export default useAppConfig;
