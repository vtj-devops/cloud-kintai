import { StaffRole } from "@entities/staff/lib/staffRoleMapping";

import { mappingStaffRole } from "../useStaffs";

describe("mappingStaffRole", () => {
  it("スタッフロールを正規化できること", () => {
    expect(mappingStaffRole("Staff" as Parameters<typeof mappingStaffRole>[0])).toBe(
      StaffRole.STAFF,
    );
    expect(mappingStaffRole("Admin" as Parameters<typeof mappingStaffRole>[0])).toBe(
      StaffRole.ADMIN,
    );
  });

  it("未知ロールは None にフォールバックすること", () => {
    expect(
      mappingStaffRole("UnexpectedRole" as Parameters<typeof mappingStaffRole>[0]),
    ).toBe(StaffRole.NONE);
  });
});
