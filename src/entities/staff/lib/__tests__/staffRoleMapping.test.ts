import {
  mapCognitoGroupsToStaffRoles,
  mapStaffRoleFromCognitoGroup,
  mapStaffRoleFromStaffRecord,
  StaffRole,
} from "../staffRoleMapping";

describe("staffRoleMapping", () => {
  it("staff レコードの role を StaffRole に正規化できること", () => {
    expect(mapStaffRoleFromStaffRecord("Admin")).toBe(StaffRole.ADMIN);
    expect(mapStaffRoleFromStaffRecord("StaffAdmin")).toBe(StaffRole.STAFF_ADMIN);
    expect(mapStaffRoleFromStaffRecord("Staff")).toBe(StaffRole.STAFF);
    expect(mapStaffRoleFromStaffRecord("Guest")).toBe(StaffRole.GUEST);
    expect(mapStaffRoleFromStaffRecord("Operator")).toBe(StaffRole.OPERATOR);
    expect(mapStaffRoleFromStaffRecord("Unknown")).toBe(StaffRole.NONE);
    expect(mapStaffRoleFromStaffRecord(undefined)).toBe(StaffRole.NONE);
  });

  it("Cognito グループの不明値でフォールバックを選べること", () => {
    expect(
      mapStaffRoleFromCognitoGroup("unknown-group", { fallback: StaffRole.NONE }),
    ).toBe(StaffRole.NONE);
    expect(
      mapStaffRoleFromCognitoGroup("unknown-group", { fallback: StaffRole.GUEST }),
    ).toBe(StaffRole.GUEST);
  });

  it("グループ配列マッピングで空配列時フォールバックを返すこと", () => {
    const roles = mapCognitoGroupsToStaffRoles([], {
      unknownGroupFallback: StaffRole.NONE,
      emptyGroupsFallback: [StaffRole.GUEST],
    });

    expect(roles).toEqual([StaffRole.GUEST]);
  });

  it("グループ配列マッピングで既知/未知グループを正規化できること", () => {
    const roles = mapCognitoGroupsToStaffRoles(["Admin", "mystery"], {
      unknownGroupFallback: StaffRole.NONE,
      emptyGroupsFallback: [StaffRole.GUEST],
    });

    expect(roles).toEqual([StaffRole.ADMIN, StaffRole.NONE]);
  });
});
