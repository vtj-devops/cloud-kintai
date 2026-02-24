import dayjs from "dayjs";

import { DEFAULT_CONFIG_NAME } from "@/features/admin/configManagement/lib/constants";
import {
  buildCreatePayload,
  buildUpdatePayload,
  ConfigFormState,
} from "@/features/admin/configManagement/lib/payloadHelpers";

describe("Payload Builders", () => {
  const baseFormState: Omit<ConfigFormState, "id"> = {
    links: [
      {
        label: "Google",
        url: "https://google.com",
        enabled: true,
        icon: "search",
      },
    ],
    reasons: [{ reason: "遅刻", enabled: true }],
    quickInputStartTimes: [
      { time: dayjs("2020-01-01T09:00:00"), enabled: true },
    ],
    quickInputEndTimes: [{ time: dayjs("2020-01-01T18:00:00"), enabled: true }],
    officeMode: true,
    absentEnabled: true,
    hourlyPaidHolidayEnabled: true,
    amPmHolidayEnabled: true,
    specialHolidayEnabled: false,
    attendanceStatisticsEnabled: true,
    overTimeCheckEnabled: true,
    startTime: dayjs("2020-01-01T09:00:00"),
    endTime: dayjs("2020-01-01T18:00:00"),
    lunchRestStartTime: dayjs("2020-01-01T12:00:00"),
    lunchRestEndTime: dayjs("2020-01-01T13:00:00"),
    amHolidayStartTime: dayjs("2020-01-01T09:00:00"),
    amHolidayEndTime: dayjs("2020-01-01T12:00:00"),
    pmHolidayStartTime: dayjs("2020-01-01T13:00:00"),
    pmHolidayEndTime: dayjs("2020-01-01T18:00:00"),
  };

  describe("buildCreatePayload", () => {
    it("should generate CreateAppConfigInput with name field", () => {
      const payload = buildCreatePayload(baseFormState);

      expect(payload.name).toBe(DEFAULT_CONFIG_NAME);
      expect(payload.workStartTime).toBe("09:00");
      expect(payload.workEndTime).toBe("18:00");
      expect(payload.lunchRestStartTime).toBe("12:00");
      expect(payload.lunchRestEndTime).toBe("13:00");
      expect(payload.officeMode).toBe(true);
      expect(payload.absentEnabled).toBe(true);
      expect(payload.hourlyPaidHolidayEnabled).toBe(true);
      expect(payload.amPmHolidayEnabled).toBe(true);
      expect(payload.specialHolidayEnabled).toBe(false);
      expect(payload.attendanceStatisticsEnabled).toBe(true);
      expect(typeof payload.standardWorkHours).toBe("number");
    });

    it("should properly map links array", () => {
      const payload = buildCreatePayload(baseFormState);

      expect(payload.links).toHaveLength(1);
      expect(payload.links?.[0]).toEqual({
        label: "Google",
        url: "https://google.com",
        enabled: true,
        icon: "search",
      });
    });

    it("should properly map reasons array", () => {
      const payload = buildCreatePayload(baseFormState);

      expect(payload.reasons).toHaveLength(1);
      expect(payload.reasons?.[0]).toEqual({
        reason: "遅刻",
        enabled: true,
      });
    });

    it("should convert Dayjs times to HH:mm strings for quick inputs", () => {
      const payload = buildCreatePayload(baseFormState);

      expect(payload.quickInputStartTimes).toHaveLength(1);
      expect(payload.quickInputStartTimes?.[0]).toEqual({
        time: "09:00",
        enabled: true,
      });

      expect(payload.quickInputEndTimes).toHaveLength(1);
      expect(payload.quickInputEndTimes?.[0]).toEqual({
        time: "18:00",
        enabled: true,
      });
    });

    it("should convert all time fields to HH:mm format", () => {
      const payload = buildCreatePayload(baseFormState);

      expect(payload.amHolidayStartTime).toBe("09:00");
      expect(payload.amHolidayEndTime).toBe("12:00");
      expect(payload.pmHolidayStartTime).toBe("13:00");
      expect(payload.pmHolidayEndTime).toBe("18:00");
    });
  });

  describe("buildUpdatePayload", () => {
    const fullFormState: ConfigFormState = {
      id: "test-config-id",
      ...baseFormState,
    };

    it("should generate UpdateAppConfigInput with id field", () => {
      const payload = buildUpdatePayload(fullFormState);

      expect(payload.id).toBe("test-config-id");
      expect(payload.workStartTime).toBe("09:00");
      expect(payload.workEndTime).toBe("18:00");
      expect(payload.officeMode).toBe(true);
    });

    it("should throw error when id is null", () => {
      const stateWithoutId: ConfigFormState = {
        ...fullFormState,
        id: null,
      };

      expect(() => buildUpdatePayload(stateWithoutId)).toThrow(
        "ID is required for update payload",
      );
    });

    it("should produce same field values as buildCreatePayload except id/name", () => {
      const createPayload = buildCreatePayload(baseFormState);
      const updatePayload = buildUpdatePayload(fullFormState);

      // CreateとUpdateで共通のフィールドを比較
      expect(updatePayload.workStartTime).toBe(createPayload.workStartTime);
      expect(updatePayload.workEndTime).toBe(createPayload.workEndTime);
      expect(updatePayload.lunchRestStartTime).toBe(
        createPayload.lunchRestStartTime,
      );
      expect(updatePayload.lunchRestEndTime).toBe(
        createPayload.lunchRestEndTime,
      );
      expect(updatePayload.standardWorkHours).toBe(
        createPayload.standardWorkHours,
      );
      expect(updatePayload.officeMode).toBe(createPayload.officeMode);
      expect(updatePayload.absentEnabled).toBe(createPayload.absentEnabled);
      expect(updatePayload.hourlyPaidHolidayEnabled).toBe(
        createPayload.hourlyPaidHolidayEnabled,
      );
      expect(updatePayload.amPmHolidayEnabled).toBe(
        createPayload.amPmHolidayEnabled,
      );
      expect(updatePayload.specialHolidayEnabled).toBe(
        createPayload.specialHolidayEnabled,
      );
      expect(updatePayload.attendanceStatisticsEnabled).toBe(
        createPayload.attendanceStatisticsEnabled,
      );
    });

    it("should handle empty arrays for links and reasons", () => {
      const stateWithEmptyArrays: ConfigFormState = {
        ...fullFormState,
        links: [],
        reasons: [],
        quickInputStartTimes: [],
        quickInputEndTimes: [],
      };

      const payload = buildUpdatePayload(stateWithEmptyArrays);

      expect(payload.links).toEqual([]);
      expect(payload.reasons).toEqual([]);
      expect(payload.quickInputStartTimes).toEqual([]);
      expect(payload.quickInputEndTimes).toEqual([]);
    });
  });

  describe("Integration: payload builders consistency", () => {
    it("should ensure Create and Update payloads use same transformation logic", () => {
      // 同じ状態から生成した場合、id/name以外は同一であることを確認
      const createPayload = buildCreatePayload(baseFormState);
      const updatePayload = buildUpdatePayload({
        ...baseFormState,
        id: "test-id",
      });

      // フィールド数の確認（Create: name + 共通, Update: id + 共通）
      const createKeys = Object.keys(createPayload).toSorted();
      const updateKeys = Object.keys(updatePayload).toSorted();

      // name/id以外のキーセットは一致すべき
      const createWithoutName = createKeys.filter((k) => k !== "name");
      const updateWithoutId = updateKeys.filter((k) => k !== "id");

      expect(createWithoutName).toEqual(updateWithoutId);
    });
  });
});
