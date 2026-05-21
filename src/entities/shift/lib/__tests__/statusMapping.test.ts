import { ShiftRequestStatus } from "@shared/api/graphql/types";

import {
  normalizeStatus,
  shiftRequestStatusToShiftState,
  shiftRequestStatusToShiftStateWithEmpty,
  shiftStateToShiftRequestStatus,
  shiftStateWithEmptyToShiftRequestStatus,
  statusToShiftRequestStatus,
} from "../statusMapping";

describe("entities/shift statusMapping", () => {
  it("maps ShiftRequestStatus to 4-state ShiftState", () => {
    expect(shiftRequestStatusToShiftState(ShiftRequestStatus.WORK)).toBe("work");
    expect(shiftRequestStatusToShiftState(ShiftRequestStatus.FIXED_OFF)).toBe(
      "fixedOff",
    );
    expect(
      shiftRequestStatusToShiftState(ShiftRequestStatus.REQUESTED_OFF),
    ).toBe("requestedOff");
    expect(shiftRequestStatusToShiftState(ShiftRequestStatus.AUTO)).toBe("auto");
    expect(shiftRequestStatusToShiftState(undefined)).toBe("auto");
  });

  it("maps ShiftRequestStatus to 5-state ShiftStateWithEmpty", () => {
    expect(
      shiftRequestStatusToShiftStateWithEmpty(ShiftRequestStatus.WORK),
    ).toBe("work");
    expect(shiftRequestStatusToShiftStateWithEmpty(undefined)).toBe("empty");
    expect(shiftRequestStatusToShiftStateWithEmpty(null)).toBe("empty");
  });

  it("maps ShiftState variants to ShiftRequestStatus", () => {
    expect(shiftStateToShiftRequestStatus("work")).toBe(ShiftRequestStatus.WORK);
    expect(shiftStateWithEmptyToShiftRequestStatus("auto")).toBe(
      ShiftRequestStatus.AUTO,
    );
    expect(shiftStateWithEmptyToShiftRequestStatus("empty")).toBeNull();
  });

  it("keeps request-form compatibility helpers", () => {
    expect(statusToShiftRequestStatus.fixedOff).toBe(ShiftRequestStatus.FIXED_OFF);
    expect(normalizeStatus("off")).toBe("fixedOff");
    expect(normalizeStatus("invalid")).toBe("auto");
  });
});
