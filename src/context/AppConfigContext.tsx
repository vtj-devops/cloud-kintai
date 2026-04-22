import type { ShiftGroupConfig } from "@entities/app-config/model/shiftGroupTypes";
import type {
  DefaultAppConfig,
  ShiftDisplayMode,
} from "@entities/app-config/model/useAppConfig";
import type { WorkflowCategoryOrderItem } from "@entities/workflow/lib/workflowLabels";
import {
  CreateAppConfigInput,
  UpdateAppConfigInput,
} from "@shared/api/graphql/types";
import { resolveThemeColor } from "@shared/config/theme";
import { type DesignTokens, getDesignTokens } from "@shared/designSystem";
import { buildClockTimeDayjs } from "@shared/lib/time";
import type dayjs from "dayjs";
import { createContext } from "react";

const DEFAULT_THEME_TOKENS = getDesignTokens();
const FALLBACK_CONFIG: DefaultAppConfig = {
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

export type AppConfigDerived = {
  startTime: dayjs.Dayjs;
  endTime: dayjs.Dayjs;
  standardWorkHours: number;
  configId: string | null;
  links: {
    label: string;
    url: string;
    enabled: boolean;
    icon: string;
  }[];
  reasons: {
    reason: string;
    enabled: boolean;
  }[];
  officeMode: boolean;
  attendanceStatisticsEnabled: boolean;
  workflowNotificationEnabled: boolean;
  timeRecorderAnnouncement: {
    enabled: boolean;
    message: string;
  };
  shiftCollaborativeEnabled: boolean;
  shiftDefaultMode: ShiftDisplayMode;
  quickInputStartTimes: { time: string; enabled: boolean }[];
  quickInputStartTimesEnabled: { time: string; enabled: boolean }[];
  quickInputEndTimes: { time: string; enabled: boolean }[];
  quickInputEndTimesEnabled: { time: string; enabled: boolean }[];
  shiftGroups: ShiftGroupConfig[];
  lunchRestStartTime: dayjs.Dayjs;
  lunchRestEndTime: dayjs.Dayjs;
  hourlyPaidHolidayEnabled: boolean;
  amHolidayStartTime: dayjs.Dayjs;
  amHolidayEndTime: dayjs.Dayjs;
  pmHolidayStartTime: dayjs.Dayjs;
  pmHolidayEndTime: dayjs.Dayjs;
  amPmHolidayEnabled: boolean;
  specialHolidayEnabled: boolean;
  absentEnabled: boolean;
  overTimeCheckEnabled: boolean;
  workflowCategoryOrder: WorkflowCategoryOrderItem[];
  themeColor: string;
  themeTokens: DesignTokens;
};

/** @deprecated Use `derived` instead of individual getters */
type DeprecatedGetters = {
  getConfigId: () => string | null;
  getStartTime: () => dayjs.Dayjs;
  getEndTime: () => dayjs.Dayjs;
  getLunchRestStartTime: () => dayjs.Dayjs;
  getLunchRestEndTime: () => dayjs.Dayjs;
  getStandardWorkHours: () => number;
  getLinks: () => AppConfigDerived["links"];
  getReasons: () => AppConfigDerived["reasons"];
  getOfficeMode: () => boolean;
  getAttendanceStatisticsEnabled: () => boolean;
  getWorkflowNotificationEnabled: () => boolean;
  getTimeRecorderAnnouncement: () => AppConfigDerived["timeRecorderAnnouncement"];
  getShiftCollaborativeEnabled: () => boolean;
  getShiftDefaultMode: () => ShiftDisplayMode;
  getQuickInputStartTimes: (
    onlyEnabled?: boolean,
  ) => AppConfigDerived["quickInputStartTimes"];
  getQuickInputEndTimes: (
    onlyEnabled?: boolean,
  ) => AppConfigDerived["quickInputEndTimes"];
  getShiftGroups: () => AppConfigDerived["shiftGroups"];
  getHourlyPaidHolidayEnabled: () => boolean;
  getAmHolidayStartTime: () => dayjs.Dayjs;
  getAmHolidayEndTime: () => dayjs.Dayjs;
  getPmHolidayStartTime: () => dayjs.Dayjs;
  getPmHolidayEndTime: () => dayjs.Dayjs;
  getAmPmHolidayEnabled: () => boolean;
  getSpecialHolidayEnabled: () => boolean;
  getAbsentEnabled: () => boolean;
  getOverTimeCheckEnabled: () => boolean;
  getWorkflowCategoryOrder: () => AppConfigDerived["workflowCategoryOrder"];
  getThemeColor: () => string;
  getThemeTokens: (
    brandPrimaryOverride?: string,
  ) => AppConfigDerived["themeTokens"];
};

type AppConfigContextProps = DeprecatedGetters & {
  config?: DefaultAppConfig | Record<string, unknown> | null;
  derived?: AppConfigDerived;
  loading?: boolean;
  isLoading?: boolean;
  isConfigLoading?: boolean;
  refetch?: () => Promise<void>;
  save?: (
    newConfig: CreateAppConfigInput | UpdateAppConfigInput,
  ) => Promise<void>;
  fetchConfig: () => Promise<void>;
  saveConfig: (
    newConfig: CreateAppConfigInput | UpdateAppConfigInput,
  ) => Promise<void>;
};

const FALLBACK_DERIVED: AppConfigDerived = {
  startTime: buildClockTimeDayjs(FALLBACK_CONFIG.workStartTime),
  endTime: buildClockTimeDayjs(FALLBACK_CONFIG.workEndTime),
  standardWorkHours: 8,
  configId: null,
  links: [],
  reasons: [],
  officeMode: false,
  attendanceStatisticsEnabled: false,
  workflowNotificationEnabled: false,
  timeRecorderAnnouncement: { enabled: false, message: "" },
  shiftCollaborativeEnabled: false,
  shiftDefaultMode: "normal",
  quickInputStartTimes: [],
  quickInputStartTimesEnabled: [],
  quickInputEndTimes: [],
  quickInputEndTimesEnabled: [],
  shiftGroups: [],
  lunchRestStartTime: buildClockTimeDayjs(FALLBACK_CONFIG.lunchRestStartTime),
  lunchRestEndTime: buildClockTimeDayjs(FALLBACK_CONFIG.lunchRestEndTime),
  hourlyPaidHolidayEnabled: false,
  amHolidayStartTime: buildClockTimeDayjs("09:00"),
  amHolidayEndTime: buildClockTimeDayjs("12:00"),
  pmHolidayStartTime: buildClockTimeDayjs("13:00"),
  pmHolidayEndTime: buildClockTimeDayjs("18:00"),
  amPmHolidayEnabled: false,
  specialHolidayEnabled: false,
  absentEnabled: false,
  overTimeCheckEnabled: false,
  workflowCategoryOrder: [],
  themeColor: FALLBACK_CONFIG.themeColor ?? "",
  themeTokens: DEFAULT_THEME_TOKENS,
};

export const AppConfigContext = createContext<AppConfigContextProps>({
  config: FALLBACK_CONFIG,
  derived: FALLBACK_DERIVED,
  loading: false,
  isLoading: false,
  isConfigLoading: false,
  refetch: async () => {},
  save: async () => {},
  fetchConfig: async () => {},
  saveConfig: async () => {},
  getConfigId: () => FALLBACK_DERIVED.configId,
  getStartTime: () => FALLBACK_DERIVED.startTime,
  getEndTime: () => FALLBACK_DERIVED.endTime,
  getLunchRestStartTime: () => FALLBACK_DERIVED.lunchRestStartTime,
  getLunchRestEndTime: () => FALLBACK_DERIVED.lunchRestEndTime,
  getStandardWorkHours: () => FALLBACK_DERIVED.standardWorkHours,
  getLinks: () => FALLBACK_DERIVED.links,
  getReasons: () => FALLBACK_DERIVED.reasons,
  getOfficeMode: () => FALLBACK_DERIVED.officeMode,
  getAttendanceStatisticsEnabled: () =>
    FALLBACK_DERIVED.attendanceStatisticsEnabled,
  getWorkflowNotificationEnabled: () =>
    FALLBACK_DERIVED.workflowNotificationEnabled,
  getTimeRecorderAnnouncement: () => FALLBACK_DERIVED.timeRecorderAnnouncement,
  getShiftCollaborativeEnabled: () =>
    FALLBACK_DERIVED.shiftCollaborativeEnabled,
  getShiftDefaultMode: () => FALLBACK_DERIVED.shiftDefaultMode,
  getQuickInputStartTimes: (onlyEnabled = false) =>
    onlyEnabled
      ? FALLBACK_DERIVED.quickInputStartTimesEnabled
      : FALLBACK_DERIVED.quickInputStartTimes,
  getQuickInputEndTimes: (onlyEnabled = false) =>
    onlyEnabled
      ? FALLBACK_DERIVED.quickInputEndTimesEnabled
      : FALLBACK_DERIVED.quickInputEndTimes,
  getShiftGroups: () => FALLBACK_DERIVED.shiftGroups,
  getHourlyPaidHolidayEnabled: () => FALLBACK_DERIVED.hourlyPaidHolidayEnabled,
  getAmHolidayStartTime: () => FALLBACK_DERIVED.amHolidayStartTime,
  getAmHolidayEndTime: () => FALLBACK_DERIVED.amHolidayEndTime,
  getPmHolidayStartTime: () => FALLBACK_DERIVED.pmHolidayStartTime,
  getPmHolidayEndTime: () => FALLBACK_DERIVED.pmHolidayEndTime,
  getAmPmHolidayEnabled: () => FALLBACK_DERIVED.amPmHolidayEnabled,
  getSpecialHolidayEnabled: () => FALLBACK_DERIVED.specialHolidayEnabled,
  getAbsentEnabled: () => FALLBACK_DERIVED.absentEnabled,
  getOverTimeCheckEnabled: () => FALLBACK_DERIVED.overTimeCheckEnabled,
  getWorkflowCategoryOrder: () => FALLBACK_DERIVED.workflowCategoryOrder,
  getThemeColor: () => FALLBACK_DERIVED.themeColor,
  getThemeTokens: () => FALLBACK_DERIVED.themeTokens,
});
