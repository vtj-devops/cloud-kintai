import type { ShiftGroupConfig } from "@entities/app-config/model/shiftGroupTypes";
import { DEFAULT_CONFIG } from "@entities/app-config/model/useAppConfig";
import {
  CreateAppConfigInput,
  UpdateAppConfigInput,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { createContext } from "react";

import { type DesignTokens, getDesignTokens } from "@/shared/designSystem";

const DEFAULT_THEME_TOKENS = getDesignTokens();

type AppConfigContextProps = {
  fetchConfig: () => Promise<void>;
  saveConfig: (
    newConfig: CreateAppConfigInput | UpdateAppConfigInput,
  ) => Promise<void>;
  getStartTime: () => dayjs.Dayjs;
  getEndTime: () => dayjs.Dayjs;
  getStandardWorkHours: () => number;
  getConfigId: () => string | null;
  getLinks: () => {
    label: string;
    url: string;
    enabled: boolean;
    icon: string;
  }[];
  getReasons: () => {
    reason: string;
    enabled: boolean;
  }[];
  getOfficeMode: () => boolean;
  getAttendanceStatisticsEnabled: () => boolean;
  getQuickInputStartTimes: (onlyEnabled?: boolean) => {
    time: string;
    enabled: boolean;
  }[];
  getQuickInputEndTimes: (onlyEnabled?: boolean) => {
    time: string;
    enabled: boolean;
  }[];
  getShiftGroups: () => ShiftGroupConfig[];
  getLunchRestStartTime: () => dayjs.Dayjs;
  getLunchRestEndTime: () => dayjs.Dayjs;
  getHourlyPaidHolidayEnabled: () => boolean;
  getAmHolidayStartTime: () => dayjs.Dayjs;
  getAmHolidayEndTime: () => dayjs.Dayjs;
  getPmHolidayStartTime: () => dayjs.Dayjs;
  getPmHolidayEndTime: () => dayjs.Dayjs;
  getAmPmHolidayEnabled: () => boolean;
  getSpecialHolidayEnabled?: () => boolean;
  getAbsentEnabled?: () => boolean;
  getOverTimeCheckEnabled?: () => boolean;
  getThemeColor: () => string;
  getThemeTokens: (brandPrimaryOverride?: string) => DesignTokens;
};

export const AppConfigContext = createContext<AppConfigContextProps>({
  fetchConfig: async () => {
    console.log("The process is not implemented.");
  },
  saveConfig: async () => {
    console.log("The process is not implemented.");
  },
  getStartTime: () => dayjs(DEFAULT_CONFIG.workStartTime, "HH:mm"),
  getEndTime: () => dayjs(DEFAULT_CONFIG.workEndTime, "HH:mm"),
  getStandardWorkHours: () => {
    const start = dayjs(DEFAULT_CONFIG.workStartTime, "HH:mm");
    const end = dayjs(DEFAULT_CONFIG.workEndTime, "HH:mm");
    const lunchStart = dayjs(DEFAULT_CONFIG.lunchRestStartTime, "HH:mm");
    const lunchEnd = dayjs(DEFAULT_CONFIG.lunchRestEndTime, "HH:mm");
    const baseHours = end.diff(start, "hour", true);
    const lunchHours = Math.max(lunchEnd.diff(lunchStart, "hour", true), 0);
    return Math.max(baseHours - lunchHours, 0);
  },
  getConfigId: () => null,
  getLinks: () => [],
  getReasons: () => [],
  getOfficeMode: () => false,
  getAttendanceStatisticsEnabled: () => false,
  getQuickInputStartTimes: () => [],
  getQuickInputEndTimes: () => [],
  getShiftGroups: () => [],
  getLunchRestStartTime: () =>
    dayjs(DEFAULT_CONFIG.lunchRestStartTime, "HH:mm"),
  getLunchRestEndTime: () => dayjs(DEFAULT_CONFIG.lunchRestEndTime, "HH:mm"),
  getHourlyPaidHolidayEnabled: () => false,
  getAmHolidayStartTime: () => dayjs("09:00", "HH:mm"),
  getAmHolidayEndTime: () => dayjs("12:00", "HH:mm"),
  getPmHolidayStartTime: () => dayjs("13:00", "HH:mm"),
  getPmHolidayEndTime: () => dayjs("18:00", "HH:mm"),
  getAmPmHolidayEnabled: () => false,
  getSpecialHolidayEnabled: () => false,
  getAbsentEnabled: () => false,
  getOverTimeCheckEnabled: () => false,
  // Ensure a string is always returned to satisfy the context type
  getThemeColor: () => DEFAULT_CONFIG.themeColor ?? "",
  getThemeTokens: () => DEFAULT_THEME_TOKENS,
});
