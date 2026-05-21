export enum StaffRole {
  OWNER = "Owner",
  ADMIN = "Admin",
  STAFF_ADMIN = "StaffAdmin",
  STAFF = "Staff",
  GUEST = "Guest",
  OPERATOR = "Operator",
  NONE = "None",
}

const ROLE_MAPPING: Readonly<Record<string, StaffRole>> = {
  [StaffRole.ADMIN]: StaffRole.ADMIN,
  [StaffRole.STAFF_ADMIN]: StaffRole.STAFF_ADMIN,
  [StaffRole.STAFF]: StaffRole.STAFF,
  [StaffRole.GUEST]: StaffRole.GUEST,
  [StaffRole.OPERATOR]: StaffRole.OPERATOR,
};

type MapRoleOptions = {
  fallback: StaffRole;
};

function mapRole(value: string | null | undefined, { fallback }: MapRoleOptions): StaffRole {
  if (!value) {
    return fallback;
  }

  return ROLE_MAPPING[value] ?? fallback;
}

export function mapStaffRoleFromStaffRecord(role: string | null | undefined): StaffRole {
  return mapRole(role, { fallback: StaffRole.NONE });
}

type MapCognitoGroupToRoleOptions = {
  fallback: StaffRole;
};

export function mapStaffRoleFromCognitoGroup(
  groupName: string | null | undefined,
  { fallback }: MapCognitoGroupToRoleOptions,
): StaffRole {
  return mapRole(groupName, { fallback });
}

type MapCognitoGroupsToRolesOptions = {
  unknownGroupFallback: StaffRole;
  emptyGroupsFallback: readonly StaffRole[];
};

export function mapCognitoGroupsToStaffRoles(
  groups: readonly string[],
  { unknownGroupFallback, emptyGroupsFallback }: MapCognitoGroupsToRolesOptions,
): StaffRole[] {
  if (groups.length === 0) {
    return [...emptyGroupsFallback];
  }

  return groups.map((group) =>
    mapStaffRoleFromCognitoGroup(group, { fallback: unknownGroupFallback }),
  );
}
