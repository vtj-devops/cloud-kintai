import {
  ApproverMultipleMode,
  ApproverSettingMode,
  CreateStaffInput,
  DeleteStaffInput,
  Staff,
  UpdateStaffInput,
} from "@shared/api/graphql/types";
import { useEffect, useState } from "react";

import { StaffExternalLink } from "@/entities/staff/externalLink";

import createStaffData from "./createStaffData";
import deleteStaffData from "./deleteStaffData";
import fetchStaffs from "./fetchStaffs";
import updateStaffData from "./updateStaffData";

export enum StaffRole {
  OWNER = "Owner",
  ADMIN = "Admin",
  STAFF_ADMIN = "StaffAdmin",
  STAFF = "Staff",
  GUEST = "Guest",
  OPERATOR = "Operator",
  NONE = "None",
}

export const roleLabelMap = new Map<StaffRole, string>([
  [StaffRole.OWNER, "オーナー"],
  [StaffRole.ADMIN, "管理者"],
  [StaffRole.STAFF_ADMIN, "スタッフ管理者"],
  [StaffRole.STAFF, "スタッフ"],
  [StaffRole.GUEST, "ゲスト"],
  [StaffRole.OPERATOR, "オペレーター"],
  [StaffRole.NONE, "未設定"],
]);

export type StaffType = {
  id: Staff["id"];
  cognitoUserId: Staff["cognitoUserId"];
  familyName: Staff["familyName"];
  givenName: Staff["givenName"];
  mailAddress: Staff["mailAddress"];
  owner: Staff["owner"];
  role: StaffRole;
  enabled: Staff["enabled"];
  status: Staff["status"];
  createdAt: Staff["createdAt"];
  updatedAt: Staff["updatedAt"];
  usageStartDate?: Staff["usageStartDate"];
  notifications?: Staff["notifications"];
  externalLinks?: (StaffExternalLink | null)[] | null;
  sortKey?: Staff["sortKey"];
  workType?: string | null;
  developer?: Staff["developer"];
  approverSetting?: ApproverSettingMode | null;
  approverSingle?: string | null;
  approverMultiple?: (string | null)[] | null;
  approverMultipleMode?: ApproverMultipleMode | null;
  shiftGroup?: string | null;
  attendanceManagementEnabled?: boolean | null;
};

export function mappingStaffRole(role: Staff["role"]): StaffRole {
  switch (role) {
    case StaffRole.ADMIN:
      return StaffRole.ADMIN;
    case StaffRole.STAFF_ADMIN:
      return StaffRole.STAFF_ADMIN;
    case StaffRole.STAFF:
      return StaffRole.STAFF;
    case StaffRole.GUEST:
      return StaffRole.GUEST;
    case StaffRole.OPERATOR:
      return StaffRole.OPERATOR;
    default:
      return StaffRole.NONE;
  }
}

export type UseStaffsParams = {
  isAuthenticated: boolean;
};

export function useStaffs({ isAuthenticated }: UseStaffsParams) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [staffs, setStaffs] = useState<StaffType[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStaffs([]);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);
    fetchStaffs()
      .then((res) =>
        setStaffs(
          res.map((staff) => ({
            id: staff.id,
            cognitoUserId: staff.cognitoUserId,
            familyName: staff.familyName,
            givenName: staff.givenName,
            mailAddress: staff.mailAddress,
            owner: staff.owner ?? false,
            role: mappingStaffRole(staff.role),
            enabled: staff.enabled,
            status: staff.status,
            usageStartDate: staff.usageStartDate,
            createdAt: staff.createdAt,
            updatedAt: staff.updatedAt,
            notifications: staff.notifications,
            externalLinks: staff.externalLinks ?? null,
            sortKey: staff.sortKey,
            workType: (staff as unknown as Record<string, unknown>).workType as
              | string
              | null,
            developer: (staff as unknown as Record<string, unknown>)
              .developer as boolean | undefined,
            approverSetting: staff.approverSetting ?? null,
            approverSingle: staff.approverSingle ?? null,
            approverMultiple: staff.approverMultiple ?? null,
            approverMultipleMode: staff.approverMultipleMode ?? null,
            shiftGroup: staff.shiftGroup ?? null,
            attendanceManagementEnabled: (
              staff as unknown as Record<string, unknown>
            ).attendanceManagementEnabled as boolean | null | undefined,
          })),
        ),
      )
      .catch((e: Error) => {
        setError(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthenticated]);

  const refreshStaff = () => {
    if (!isAuthenticated) {
      return Promise.reject(new Error("User is not authenticated"));
    }
    return fetchStaffs()
      .then((res) => {
        setStaffs(
          res.map((staff) => ({
            id: staff.id,
            cognitoUserId: staff.cognitoUserId,
            familyName: staff.familyName,
            givenName: staff.givenName,
            mailAddress: staff.mailAddress,
            owner: staff.owner ?? false,
            role: mappingStaffRole(staff.role),
            enabled: staff.enabled,
            status: staff.status,
            createdAt: staff.createdAt,
            updatedAt: staff.updatedAt,
            notifications: staff.notifications,
            externalLinks: staff.externalLinks ?? null,
            sortKey: staff.sortKey,
            usageStartDate: staff.usageStartDate,
            workType: staff.workType,
            developer: (staff as unknown as Record<string, unknown>)
              .developer as boolean | undefined,
            approverSetting: staff.approverSetting ?? null,
            approverSingle: staff.approverSingle ?? null,
            approverMultiple: staff.approverMultiple ?? null,
            approverMultipleMode: staff.approverMultipleMode ?? null,
            shiftGroup: staff.shiftGroup ?? null,
            attendanceManagementEnabled: (
              staff as unknown as Record<string, unknown>
            ).attendanceManagementEnabled as boolean | null | undefined,
          })),
        );
      })
      .catch((e: Error) => {
        throw e;
      });
  };

  const ensureAuthenticated = () => {
    if (!isAuthenticated) {
      throw new Error("User is not authenticated");
    }
  };

  const createStaff = async (input: CreateStaffInput) => {
    ensureAuthenticated();
    const inputWithDefault = {
      ...input,
      attendanceManagementEnabled:
        (
          input as CreateStaffInput & {
            attendanceManagementEnabled?: boolean | null;
          }
        ).attendanceManagementEnabled ?? true,
    } as CreateStaffInput;

    return createStaffData(inputWithDefault)
      .then((staff) => {
        setStaffs([
          ...staffs,
          {
            id: staff.id,
            cognitoUserId: staff.cognitoUserId,
            familyName: staff.familyName,
            givenName: staff.givenName,
            mailAddress: staff.mailAddress,
            owner: staff.owner ?? false,
            role: mappingStaffRole(staff.role),
            enabled: staff.enabled,
            status: staff.status,
            createdAt: staff.createdAt,
            updatedAt: staff.updatedAt,
            usageStartDate: staff.usageStartDate,
            notifications: staff.notifications,
            externalLinks: staff.externalLinks ?? null,
            sortKey: staff.sortKey,
            workType: staff.workType,
            developer: (staff as unknown as Record<string, unknown>)
              .developer as boolean | undefined,
            approverSetting: staff.approverSetting ?? null,
            approverSingle: staff.approverSingle ?? null,
            approverMultiple: staff.approverMultiple ?? null,
            approverMultipleMode: staff.approverMultipleMode ?? null,
            shiftGroup: staff.shiftGroup ?? null,
            attendanceManagementEnabled: (
              staff as unknown as Record<string, unknown>
            ).attendanceManagementEnabled as boolean | null | undefined,
          },
        ]);
      })
      .catch((e: Error) => {
        throw e;
      });
  };

  const updateStaff = async (input: UpdateStaffInput) => {
    ensureAuthenticated();
    return updateStaffData(input)
      .then((staff) => {
        setStaffs(
          staffs.map((s) => {
            if (s.id === staff.id) {
              return {
                id: staff.id,
                cognitoUserId: staff.cognitoUserId,
                familyName: staff.familyName,
                givenName: staff.givenName,
                mailAddress: staff.mailAddress,
                owner: staff.owner ?? false,
                role: mappingStaffRole(staff.role),
                enabled: staff.enabled,
                status: staff.status,
                createdAt: staff.createdAt,
                updatedAt: staff.updatedAt,
                usageStartDate: staff.usageStartDate,
                notifications: staff.notifications,
                externalLinks: staff.externalLinks ?? null,
                sortKey: staff.sortKey,
                workType: staff.workType,
                developer: (staff as unknown as Record<string, unknown>)
                  .developer as boolean | undefined,
                approverSetting: staff.approverSetting ?? null,
                approverSingle: staff.approverSingle ?? null,
                approverMultiple: staff.approverMultiple ?? null,
                approverMultipleMode: staff.approverMultipleMode ?? null,
                shiftGroup: staff.shiftGroup ?? null,
                attendanceManagementEnabled: (
                  staff as unknown as Record<string, unknown>
                ).attendanceManagementEnabled as boolean | null | undefined,
              };
            }
            return s;
          }),
        );
        return; // keep Promise<void> signature
      })
      .catch((e: Error) => {
        throw e;
      });
  };

  const deleteStaff = async (input: DeleteStaffInput) => {
    ensureAuthenticated();
    return deleteStaffData(input)
      .then((staff) => {
        setStaffs(staffs.filter((s) => s.id !== staff.id));
      })
      .catch((e: Error) => {
        throw e;
      });
  };

  const getAllStaffs = async (): Promise<StaffType[]> => {
    ensureAuthenticated();
    const res = await fetchStaffs();
    return res.map((staff) => ({
      id: staff.id,
      cognitoUserId: staff.cognitoUserId,
      familyName: staff.familyName,
      givenName: staff.givenName,
      mailAddress: staff.mailAddress,
      owner: staff.owner ?? false,
      role: mappingStaffRole(staff.role),
      enabled: staff.enabled,
      status: staff.status,
      usageStartDate: staff.usageStartDate,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
      notifications: staff.notifications,
      externalLinks: staff.externalLinks ?? null,
      sortKey: staff.sortKey,
      workType: staff.workType,
      developer: (staff as unknown as Record<string, unknown>).developer as
        | boolean
        | undefined,
      approverSetting: staff.approverSetting ?? null,
      approverSingle: staff.approverSingle ?? null,
      approverMultiple: staff.approverMultiple ?? null,
      approverMultipleMode: staff.approverMultipleMode ?? null,
      shiftGroup: staff.shiftGroup ?? null,
      attendanceManagementEnabled: (staff as unknown as Record<string, unknown>)
        .attendanceManagementEnabled as boolean | null | undefined,
    }));
  };

  return {
    loading,
    error,
    staffs,
    refreshStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    getAllStaffs,
  };
}
