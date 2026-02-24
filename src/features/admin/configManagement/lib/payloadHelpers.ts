import {
  CreateAppConfigInput,
  UpdateAppConfigInput,
} from "@shared/api/graphql/types";
import { Dayjs } from "dayjs";

import {
  DEFAULT_CONFIG_NAME,
  TIME_FORMAT,
} from "@/features/admin/configManagement/lib/constants";

export const formatTime = (time: Dayjs) => time.format(TIME_FORMAT);

export const buildStandardWorkHours = (
  start: Dayjs,
  end: Dayjs,
  restStart: Dayjs,
  restEnd: Dayjs,
) => {
  const baseHours = end.diff(start, "hour", true);
  const lunchHours = Math.max(restEnd.diff(restStart, "hour", true), 0);
  return Math.max(baseHours - lunchHours, 0);
};

type RequiredTimes = {
  startTime: Dayjs;
  endTime: Dayjs;
  lunchRestStartTime: Dayjs;
  lunchRestEndTime: Dayjs;
  amHolidayStartTime: Dayjs;
  amHolidayEndTime: Dayjs;
  pmHolidayStartTime: Dayjs;
  pmHolidayEndTime: Dayjs;
};

type BuildBasePayloadOptions = {
  links: { label: string; url: string; enabled: boolean; icon: string }[];
  reasons: { reason: string; enabled: boolean }[];
  quickInputStartTimes: { time: Dayjs; enabled: boolean }[];
  quickInputEndTimes: { time: Dayjs; enabled: boolean }[];
  officeMode: boolean;
  absentEnabled: boolean;
  hourlyPaidHolidayEnabled: boolean;
  amPmHolidayEnabled: boolean;
  specialHolidayEnabled: boolean;
  attendanceStatisticsEnabled: boolean;
  overTimeCheckEnabled: boolean;
};

export type BaseAppConfigPayload = {
  workStartTime: string;
  workEndTime: string;
  standardWorkHours: number;
  links: { label: string; url: string; enabled: boolean; icon: string }[];
  reasons: { reason: string; enabled: boolean }[];
  officeMode: boolean;
  absentEnabled: boolean;
  quickInputStartTimes: { time: string; enabled: boolean }[];
  quickInputEndTimes: { time: string; enabled: boolean }[];
  lunchRestStartTime: string;
  lunchRestEndTime: string;
  hourlyPaidHolidayEnabled: boolean;
  amHolidayStartTime: string;
  amHolidayEndTime: string;
  pmHolidayStartTime: string;
  pmHolidayEndTime: string;
  amPmHolidayEnabled: boolean;
  specialHolidayEnabled: boolean;
  attendanceStatisticsEnabled: boolean;
  overTimeCheckEnabled: boolean;
};

export const buildBasePayload = (
  requiredTimes: RequiredTimes,
  opts: BuildBasePayloadOptions,
): BaseAppConfigPayload => ({
  workStartTime: formatTime(requiredTimes.startTime),
  workEndTime: formatTime(requiredTimes.endTime),
  standardWorkHours: buildStandardWorkHours(
    requiredTimes.startTime,
    requiredTimes.endTime,
    requiredTimes.lunchRestStartTime,
    requiredTimes.lunchRestEndTime,
  ),
  links: opts.links.map((link) => ({
    label: link.label,
    url: link.url,
    enabled: link.enabled,
    icon: link.icon,
  })),
  reasons: opts.reasons.map((reason) => ({
    reason: reason.reason,
    enabled: reason.enabled,
  })),
  officeMode: opts.officeMode,
  absentEnabled: opts.absentEnabled,
  quickInputStartTimes: opts.quickInputStartTimes.map((entry) => ({
    time: formatTime(entry.time),
    enabled: entry.enabled,
  })),
  quickInputEndTimes: opts.quickInputEndTimes.map((entry) => ({
    time: formatTime(entry.time),
    enabled: entry.enabled,
  })),
  lunchRestStartTime: formatTime(requiredTimes.lunchRestStartTime),
  lunchRestEndTime: formatTime(requiredTimes.lunchRestEndTime),
  hourlyPaidHolidayEnabled: opts.hourlyPaidHolidayEnabled,
  amHolidayStartTime: formatTime(requiredTimes.amHolidayStartTime),
  amHolidayEndTime: formatTime(requiredTimes.amHolidayEndTime),
  pmHolidayStartTime: formatTime(requiredTimes.pmHolidayStartTime),
  pmHolidayEndTime: formatTime(requiredTimes.pmHolidayEndTime),
  amPmHolidayEnabled: opts.amPmHolidayEnabled,
  specialHolidayEnabled: opts.specialHolidayEnabled,
  attendanceStatisticsEnabled: opts.attendanceStatisticsEnabled,
  overTimeCheckEnabled: opts.overTimeCheckEnabled,
});

/**
 * フォーム内部で扱う状態の型
 * GraphQLのCreateAppConfigInput/UpdateAppConfigInputに対応
 */
export type ConfigFormState = {
  id: string | null;
  links: { label: string; url: string; enabled: boolean; icon: string }[];
  reasons: { reason: string; enabled: boolean }[];
  quickInputStartTimes: { time: Dayjs; enabled: boolean }[];
  quickInputEndTimes: { time: Dayjs; enabled: boolean }[];
  officeMode: boolean;
  absentEnabled: boolean;
  hourlyPaidHolidayEnabled: boolean;
  amPmHolidayEnabled: boolean;
  specialHolidayEnabled: boolean;
  attendanceStatisticsEnabled: boolean;
  overTimeCheckEnabled: boolean;
  startTime: Dayjs;
  endTime: Dayjs;
  lunchRestStartTime: Dayjs;
  lunchRestEndTime: Dayjs;
  amHolidayStartTime: Dayjs;
  amHolidayEndTime: Dayjs;
  pmHolidayStartTime: Dayjs;
  pmHolidayEndTime: Dayjs;
};

/**
 * フォーム状態からGraphQL入力型への共通変換ロジック
 * CreateとUpdateで共通のフィールド変換を行う
 */
const transformFormStateToPayload = (
  state: Omit<ConfigFormState, "id">,
): Omit<CreateAppConfigInput, "name" | "id"> => {
  return buildBasePayload(
    {
      startTime: state.startTime,
      endTime: state.endTime,
      lunchRestStartTime: state.lunchRestStartTime,
      lunchRestEndTime: state.lunchRestEndTime,
      amHolidayStartTime: state.amHolidayStartTime,
      amHolidayEndTime: state.amHolidayEndTime,
      pmHolidayStartTime: state.pmHolidayStartTime,
      pmHolidayEndTime: state.pmHolidayEndTime,
    },
    {
      links: state.links,
      reasons: state.reasons,
      quickInputStartTimes: state.quickInputStartTimes,
      quickInputEndTimes: state.quickInputEndTimes,
      officeMode: state.officeMode,
      absentEnabled: state.absentEnabled,
      hourlyPaidHolidayEnabled: state.hourlyPaidHolidayEnabled,
      amPmHolidayEnabled: state.amPmHolidayEnabled,
      specialHolidayEnabled: state.specialHolidayEnabled,
      attendanceStatisticsEnabled: state.attendanceStatisticsEnabled,
      overTimeCheckEnabled: state.overTimeCheckEnabled,
    },
  );
};

/**
 * フォーム状態から CreateAppConfigInput を生成
 * 新規作成時に使用。nameフィールドは"default"固定
 */
export const buildCreatePayload = (
  state: Omit<ConfigFormState, "id">,
): CreateAppConfigInput => {
  return {
    name: DEFAULT_CONFIG_NAME,
    ...transformFormStateToPayload(state),
  };
};

/**
 * フォーム状態から UpdateAppConfigInput を生成
 * 更新時に使用。idは必須
 */
export const buildUpdatePayload = (
  state: ConfigFormState,
): UpdateAppConfigInput => {
  if (!state.id) {
    throw new Error("ID is required for update payload");
  }

  return {
    id: state.id,
    ...transformFormStateToPayload(state),
  };
};
