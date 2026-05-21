import { StaffRole } from "@entities/staff/lib/staffRoleMapping";

import { mapTokenCognitoGroupsToRoles } from "../useCognitoUser";

describe("mapTokenCognitoGroupsToRoles", () => {
  it("トークングループが空の場合は Guest を返すこと", () => {
    expect(mapTokenCognitoGroupsToRoles([])).toEqual([StaffRole.GUEST]);
  });

  it("トークングループの未知値は Guest にフォールバックすること", () => {
    expect(mapTokenCognitoGroupsToRoles(["Unknown", "Operator"])).toEqual([
      StaffRole.GUEST,
      StaffRole.OPERATOR,
    ]);
  });
});
