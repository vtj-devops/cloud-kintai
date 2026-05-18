import { StaffRole, StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import {
  ApproverMultipleMode,
  ApproverSettingMode,
  UpdateStaffInput,
} from "@shared/api/graphql/types";

export type StaffAutocompleteOption = {
  value: string;
  label: string;
  description?: string;
};

export type StaffApproverFormValues = {
  approverSetting?: ApproverSettingMode | null;
  approverSingle?: string | null;
  approverMultiple?: string[] | null;
  approverMultipleMode?: ApproverMultipleMode | null;
};

export type StaffFormValues = StaffApproverFormValues & {
  staffId?: string | null;
  internalId?: string | null;
  familyName?: string | null;
  givenName?: string | null;
  mailAddress?: string | null;
  owner: boolean;
  sortKey?: string | null;
  usageStartDate?: string | null;
  workType?: string | null;
  shiftGroup?: string | null;
  attendanceManagementEnabled?: boolean;
  role?: string | null;
  developer?: boolean;
};

export type CreateStaffFormValues = StaffFormValues & {
  familyName: string;
  givenName: string;
  mailAddress: string;
  role: string;
};

export const CREATE_STAFF_DEFAULT_VALUES: CreateStaffFormValues = {
  familyName: "",
  givenName: "",
  mailAddress: "",
  role: StaffRole.STAFF,
  owner: false,
  sortKey: null,
  usageStartDate: null,
  workType: "weekday",
  shiftGroup: null,
  attendanceManagementEnabled: true,
  approverSetting: ApproverSettingMode.ADMINS,
  approverSingle: null,
  approverMultiple: [],
  approverMultipleMode: ApproverMultipleMode.ANY,
  developer: false,
};

export const EDIT_STAFF_DEFAULT_VALUES: Pick<
  StaffFormValues,
  "owner" | "developer" | "attendanceManagementEnabled"
> = {
  owner: false,
  developer: false,
  attendanceManagementEnabled: true,
};

export const ROLE_OPTIONS = [
  { value: StaffRole.ADMIN, label: "管理者" },
  { value: StaffRole.STAFF, label: "スタッフ" },
  { value: StaffRole.OPERATOR, label: "オペレーター" },
];

type ShiftGroupLike = {
  label: string;
  description?: string | null;
};

export const toShiftGroupOptions = (
  shiftGroups: ShiftGroupLike[],
): StaffAutocompleteOption[] =>
  shiftGroups.map((group) => ({
    value: group.label,
    label: group.label,
    description: group.description ?? "",
  }));

export const toAdminApproverOptions = (
  staffs: StaffType[],
  currentCognitoUserId?: string | null,
): StaffAutocompleteOption[] =>
  staffs
    .filter(
      (staff) =>
        (staff.role === StaffRole.ADMIN || staff.owner) &&
        staff.cognitoUserId !== currentCognitoUserId,
    )
    .map((staff) => ({
      value: staff.cognitoUserId ?? "",
      label:
        [staff.familyName, staff.givenName].filter((name) => Boolean(name)).join(" ") ||
        staff.mailAddress ||
        "",
      description: staff.mailAddress ?? "",
    }));

function appendApproverPayload(
  payload: UpdateStaffInput,
  data: StaffApproverFormValues,
  multipleModeFallback?: ApproverMultipleMode,
) {
  if (data.approverSetting === ApproverSettingMode.SINGLE) {
    payload.approverSingle = data.approverSingle ?? null;
  }

  if (data.approverSetting === ApproverSettingMode.MULTIPLE) {
    payload.approverMultiple = data.approverMultiple ?? [];
    payload.approverMultipleMode =
      data.approverMultipleMode ?? multipleModeFallback ?? null;
  }
}

export function buildCreateStaffUpdatePayload({
  id,
  data,
  canEditDeveloper,
}: {
  id: string;
  data: CreateStaffFormValues;
  canEditDeveloper: boolean;
}): UpdateStaffInput {
  const payload: UpdateStaffInput = {
    id,
    familyName: data.familyName,
    givenName: data.givenName,
    mailAddress: data.mailAddress,
    role: data.role,
    owner: data.owner,
    sortKey: data.sortKey ?? null,
    usageStartDate: data.usageStartDate ?? null,
    workType: data.workType ?? "weekday",
    shiftGroup: data.shiftGroup ?? null,
    attendanceManagementEnabled: data.attendanceManagementEnabled ?? true,
    approverSetting: data.approverSetting ?? ApproverSettingMode.ADMINS,
  };

  appendApproverPayload(payload, data, ApproverMultipleMode.ANY);

  if (canEditDeveloper) {
    payload.developer = data.developer ?? false;
  }

  return payload;
}

export function buildEditStaffUpdatePayload({
  id,
  data,
}: {
  id: string;
  data: StaffFormValues;
}): UpdateStaffInput {
  const payload: UpdateStaffInput = {
    id,
    mailAddress: data.mailAddress,
    familyName: data.familyName,
    givenName: data.givenName,
    owner: data.owner,
    sortKey: data.sortKey,
    usageStartDate: data.usageStartDate,
    workType: data.workType,
    shiftGroup: data.shiftGroup ?? null,
    attendanceManagementEnabled: data.attendanceManagementEnabled ?? true,
  };

  appendApproverPayload(payload, data);

  if (typeof data.developer !== "undefined") {
    payload.developer = data.developer;
  }

  return payload;
}
