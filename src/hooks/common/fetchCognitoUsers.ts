/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { API, Auth } from "aws-amplify";
import dayjs from "dayjs";

import * as MESSAGE_CODE from "../../errors";
import { Staff } from "../useStaffs/common";
import { StaffRole } from "../useStaffs/useStaffs";

export default async function fetchCognitoUsers(): Promise<Staff[]> {
  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: (await Auth.currentSession())
        .getAccessToken()
        .getJwtToken(),
    },
  };

  const response = await API.get("AdminQueries", "/listUsers", params);

  return await Promise.all(
    response.Users.map(async (user: any) => {
      const sub = user.Attributes.find(
        (attr: any) => attr.Name === "sub"
      )?.Value;

      if (!sub) {
        throw new Error(MESSAGE_CODE.E05007);
      }

      let adminResponse;
      // TODO: 暫定措置
      // 偶発的にエラーが発生するためリトライ処理を追加
      for (let i = 0; i < 3; i++) {
        try {
          adminResponse = await API.get("AdminQueries", "/listGroupsForUser", {
            ...params,
            queryStringParameters: {
              username: sub,
            },
          });
          break;
        } catch (error) {
          if (i === 2) {
            throw new Error(MESSAGE_CODE.E05008);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // 権限
      if (!adminResponse.Groups || adminResponse.Groups.length === 0) {
        throw new Error(MESSAGE_CODE.E05008);
      }

      const roles = adminResponse.Groups.map((group: any) => {
        switch (group.GroupName as string) {
          case "Admin":
            return StaffRole.ADMIN;
          case "StaffAdmin":
            return StaffRole.STAFF_ADMIN;
          case "Staff":
            return StaffRole.STAFF;
          case "Guest":
            return StaffRole.GUEST;
          default:
            return StaffRole.NONE;
        }
      });

      // オーナー権限
      const ownerAttribute = user.Attributes.find(
        (attr: any) => attr.Name === "custom:owner"
      );

      const owner = (() => {
        const flag = ownerAttribute ? Number(ownerAttribute.Value) : 0;
        return Boolean(flag);
      })();

      return {
        sub,
        enabled: user.Enabled,
        status: user.UserStatus,
        givenName: user.Attributes.find(
          (attr: any) => attr.Name === "given_name"
        )?.Value,
        familyName: user.Attributes.find(
          (attr: any) => attr.Name === "family_name"
        )?.Value,
        mailAddress: user.Attributes.find((attr: any) => attr.Name === "email")
          ?.Value,
        owner,
        roles,
        createdAt: dayjs(user.UserCreateDate as string),
        updatedAt: dayjs(user.UserLastModifiedDate as string),
      } as Staff;
    })
  );
}
