import { useEffect, useState } from "react";

import {
  CreateStaffInput,
  DeleteStaffInput,
  Staff,
  UpdateStaffInput,
} from "../../API";
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
  NONE = "None",
}

export const roleLabelMap = new Map<StaffRole, string>([
  [StaffRole.OWNER, "オーナー"],
  [StaffRole.ADMIN, "管理者"],
  [StaffRole.STAFF_ADMIN, "スタッフ管理者"],
  [StaffRole.STAFF, "スタッフ"],
  [StaffRole.GUEST, "ゲスト"],
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
  sortKey?: Staff["sortKey"];
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
    default:
      return StaffRole.NONE;
  }
}

export default function useStaffs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [staffs, setStaffs] = useState<StaffType[]>([]);

  useEffect(() => {
    setLoading(true);
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
            sortKey: staff.sortKey,
          }))
        )
      )
      .catch((e: Error) => {
        setError(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const refreshStaff = () =>
    fetchStaffs()
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
            sortKey: staff.sortKey,
            usageStartDate: staff.usageStartDate,
          }))
        );
      })
      .catch((e: Error) => {
        throw e;
      });

  const createStaff = async (input: CreateStaffInput) =>
    createStaffData(input)
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
            sortKey: staff.sortKey,
          },
        ]);
      })
      .catch((e: Error) => {
        throw e;
      });

  const updateStaff = async (input: UpdateStaffInput) =>
    updateStaffData(input)
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
                sortKey: staff.sortKey,
              };
            }
            return s;
          })
        );
      })
      .catch((e: Error) => {
        throw e;
      });

  const deleteStaff = async (input: DeleteStaffInput) =>
    deleteStaffData(input)
      .then((staff) => {
        setStaffs(staffs.filter((s) => s.id !== staff.id));
      })
      .catch((e: Error) => {
        throw e;
      });

  return {
    loading,
    error,
    staffs,
    refreshStaff,
    createStaff,
    updateStaff,
    deleteStaff,
  };
}
