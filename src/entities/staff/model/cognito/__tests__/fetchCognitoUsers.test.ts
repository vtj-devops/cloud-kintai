import { StaffRole } from "@entities/staff/lib/staffRoleMapping";

import { mapAdminCognitoGroupsToRoles } from "../fetchCognitoUsers";

describe("mapAdminCognitoGroupsToRoles", () => {
  it("管理画面の group は未知値を None にフォールバックすること", () => {
    const roles = mapAdminCognitoGroupsToRoles([
      { GroupName: "Admin" },
      { GroupName: "UnknownGroup" },
    ]);

    expect(roles).toEqual([StaffRole.ADMIN, StaffRole.NONE]);
  });
});
