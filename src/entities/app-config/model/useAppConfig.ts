import {
  useCreateAppConfigMutation,
  useGetAppConfigQuery,
  useUpdateAppConfigMutation,
} from "@entities/app-config/api/appConfigApi";
import type {
  AppConfig,
  CreateAppConfigInput,
  UpdateAppConfigInput,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo } from "react";

import { resolveThemeColor } from "@/shared/config/theme";
import {
  applyDesignTokenCssVariables,
  getDesignTokens,
} from "@/shared/designSystem";

import type { ShiftGroupConfig } from "./shiftGroupTypes";

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
  | "overTimeCheckEnabled"
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
  overTimeCheckEnabled: false,
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
        await updateAppConfig(newConfig as UpdateAppConfigInput).unwrap();
        return;
      }

      await createAppConfig(newConfig as CreateAppConfigInput).unwrap();
    },
    [createAppConfig, updateAppConfig],
  );

  const getConfigId = useCallback(() => config?.id ?? null, [config?.id]);

  const getStartTime = useCallback(
    () => dayjs(config?.workStartTime ?? DEFAULT_CONFIG.workStartTime, "HH:mm"),
    [config?.workStartTime],
  );

  const getEndTime = useCallback(
    () => dayjs(config?.workEndTime ?? DEFAULT_CONFIG.workEndTime, "HH:mm"),
    [config?.workEndTime],
  );

  const getLunchRestStartTime = useCallback(
    () =>
      dayjs(
        config?.lunchRestStartTime ?? DEFAULT_CONFIG.lunchRestStartTime,
        "HH:mm",
      ),
    [config?.lunchRestStartTime],
  );

  const getLunchRestEndTime = useCallback(
    () =>
      dayjs(
        config?.lunchRestEndTime ?? DEFAULT_CONFIG.lunchRestEndTime,
        "HH:mm",
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
    () => dayjs(config?.amHolidayStartTime ?? "09:00", "HH:mm"),
    [config?.amHolidayStartTime],
  );

  const getAmHolidayEndTime = useCallback(
    () => dayjs(config?.amHolidayEndTime ?? "12:00", "HH:mm"),
    [config?.amHolidayEndTime],
  );

  const getPmHolidayStartTime = useCallback(
    () => dayjs(config?.pmHolidayStartTime ?? "13:00", "HH:mm"),
    [config?.pmHolidayStartTime],
  );

  const getPmHolidayEndTime = useCallback(
    () => dayjs(config?.pmHolidayEndTime ?? "18:00", "HH:mm"),
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

  return {
    config,
    loading,
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
    getThemeColor,
    getThemeTokens,
  };
};

export default useAppConfig;
