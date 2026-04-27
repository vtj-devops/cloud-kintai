import dayjs from "dayjs";

import type { Staff } from "../common";
import { StaffRole } from "../useStaffs";

describe("Staff インターフェース", () => {
  it("必須フィールドのみで Staff オブジェクトを構築できること", () => {
    const staff: Staff = {
      sub: "sub-001",
      enabled: true,
      status: "CONFIRMED",
      mailAddress: "staff@example.com",
      owner: false,
      roles: [StaffRole.STAFF],
      createdAt: dayjs("2024-01-01"),
      updatedAt: dayjs("2024-01-01"),
    };

    expect(staff.sub).toBe("sub-001");
    expect(staff.enabled).toBe(true);
    expect(staff.status).toBe("CONFIRMED");
    expect(staff.mailAddress).toBe("staff@example.com");
    expect(staff.owner).toBe(false);
    expect(staff.roles).toEqual([StaffRole.STAFF]);
  });

  it("オプションフィールドが未設定の場合 undefined になること", () => {
    const staff: Staff = {
      sub: "sub-002",
      enabled: false,
      status: "UNCONFIRMED",
      mailAddress: "owner@example.com",
      owner: true,
      roles: [StaffRole.OWNER],
      createdAt: dayjs("2024-06-01"),
      updatedAt: dayjs("2024-06-15"),
    };

    expect(staff.givenName).toBeUndefined();
    expect(staff.familyName).toBeUndefined();
    expect(staff.usageStartDate).toBeUndefined();
  });

  it("複数のロールを持つ Staff オブジェクトを構築できること", () => {
    const staff: Staff = {
      sub: "sub-003",
      enabled: true,
      status: "CONFIRMED",
      mailAddress: "admin@example.com",
      owner: false,
      roles: [StaffRole.ADMIN, StaffRole.STAFF_ADMIN],
      createdAt: dayjs("2024-01-01"),
      updatedAt: dayjs("2024-01-01"),
    };

    expect(staff.roles).toHaveLength(2);
    expect(staff.roles).toContain(StaffRole.ADMIN);
    expect(staff.roles).toContain(StaffRole.STAFF_ADMIN);
  });

  it("usageStartDate を Dayjs として設定できること", () => {
    const startDate = dayjs("2024-04-01");
    const staff: Staff = {
      sub: "sub-004",
      enabled: true,
      status: "CONFIRMED",
      mailAddress: "new@example.com",
      owner: false,
      roles: [StaffRole.STAFF],
      usageStartDate: startDate,
      createdAt: dayjs("2024-04-01"),
      updatedAt: dayjs("2024-04-01"),
    };

    expect(staff.usageStartDate?.isSame(startDate)).toBe(true);
  });

  it("roles が空配列の Staff オブジェクトを構築できること", () => {
    const staff: Staff = {
      sub: "sub-005",
      enabled: false,
      status: "FORCE_CHANGE_PASSWORD",
      mailAddress: "guest@example.com",
      owner: false,
      roles: [],
      createdAt: dayjs("2024-01-01"),
      updatedAt: dayjs("2024-01-01"),
    };

    expect(staff.roles).toHaveLength(0);
  });
});
