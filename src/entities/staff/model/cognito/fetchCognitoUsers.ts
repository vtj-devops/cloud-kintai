import {
  mapStaffRoleFromCognitoGroup,
  StaffRole,
} from "@entities/staff/lib/staffRoleMapping";
import { Staff } from "@entities/staff/model/useStaffs/common";
import { adminGet } from "@shared/api/amplify/adminQueriesClient";
import dayjs from "dayjs";

import * as MESSAGE_CODE from "@/errors";

type CognitoUserAttribute = {
  Name?: string;
  Value?: string;
};

type ListUsersUser = {
  Attributes?: CognitoUserAttribute[];
  Enabled?: boolean;
  UserStatus?: string;
  UserCreateDate?: string;
  UserLastModifiedDate?: string;
};

type ListUsersResponse = {
  Users?: ListUsersUser[];
};

type CognitoGroup = {
  GroupName?: string;
};

type ListGroupsForUserResponse = {
  Groups?: CognitoGroup[];
};

export function mapAdminCognitoGroupsToRoles(groups: readonly CognitoGroup[]): StaffRole[] {
  return groups.map((group) =>
    mapStaffRoleFromCognitoGroup(group.GroupName, { fallback: StaffRole.NONE }),
  );
}

export default async function fetchCognitoUsers(): Promise<Staff[]> {
  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await adminGet<ListUsersResponse>("/listUsers", params);
  const users = response?.Users ?? [];

  return await Promise.all(
    users.map(async (user) => {
      const attributes = user.Attributes ?? [];
      const sub = attributes.find((attr) => attr.Name === "sub")?.Value;

      if (!sub) {
        throw new Error(MESSAGE_CODE.E05007);
      }

      let adminResponse: ListGroupsForUserResponse | undefined;
      // TODO: 暫定措置
      // 偶発的にエラーが発生するためリトライ処理を追加
      for (let i = 0; i < 3; i++) {
        try {
          adminResponse = await adminGet<ListGroupsForUserResponse>(
            "/listGroupsForUser",
            {
              ...params,
              queryStringParameters: {
                username: sub,
              },
            }
          );
          break;
        } catch {
          if (i === 2) {
            throw new Error(MESSAGE_CODE.E05008);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const groups = adminResponse?.Groups ?? [];

      // 権限
      if (groups.length === 0) {
        throw new Error(MESSAGE_CODE.E05008);
      }

      const roles = mapAdminCognitoGroupsToRoles(groups);

      // オーナー権限
      const ownerAttribute = attributes.find(
        (attr) => attr.Name === "custom:owner"
      );

      const owner = (() => {
        const flag = ownerAttribute ? Number(ownerAttribute.Value) : 0;
        return Boolean(flag);
      })();

      return {
        sub,
        enabled: Boolean(user.Enabled),
        status: user.UserStatus ?? "",
        givenName: attributes.find((attr) => attr.Name === "given_name")?.Value,
        familyName: attributes.find((attr) => attr.Name === "family_name")
          ?.Value,
        mailAddress: attributes.find((attr) => attr.Name === "email")?.Value,
        owner,
        roles,
        createdAt: dayjs(user.UserCreateDate as string),
        updatedAt: dayjs(user.UserLastModifiedDate as string),
      } as Staff;
    })
  );
}
