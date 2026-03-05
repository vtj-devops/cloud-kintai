import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { CreateStaffInput, UpdateStaffInput } from "@shared/api/graphql/types";

import * as MESSAGE_CODE from "@/errors";
import fetchCognitoUsers from "@/hooks/common/fetchCognitoUsers";

export async function handleSyncCognitoUser(
  staffs: StaffType[],
  refreshStaff: () => Promise<void>,
  createStaff: (input: CreateStaffInput) => Promise<void>,
  updateStaff: (input: UpdateStaffInput) => Promise<void>,
) {
  const cognitoUsers = await fetchCognitoUsers();

  if (!cognitoUsers) {
    throw new Error(MESSAGE_CODE.E05006);
  }

  await Promise.all(
    cognitoUsers.map(async (cognitoUser) => {
      const isExistStaff = staffs.find(
        ({ cognitoUserId }) => cognitoUserId === cognitoUser.sub,
      );

      if (isExistStaff) {
        await updateStaff({
          id: isExistStaff.id,
          cognitoUserId: cognitoUser.sub,
          familyName: cognitoUser.familyName,
          givenName: cognitoUser.givenName,
          mailAddress: cognitoUser.mailAddress,
          role: cognitoUser.roles[0],
          enabled: cognitoUser.enabled,
          status: cognitoUser.status,
          owner: cognitoUser.owner,
        }).catch(() => {
          throw new Error(MESSAGE_CODE.E05003);
        });
        return;
      }

      const createInput = {
        cognitoUserId: cognitoUser.sub,
        familyName: cognitoUser.familyName,
        givenName: cognitoUser.givenName,
        mailAddress: cognitoUser.mailAddress,
        role: cognitoUser.roles[0],
        enabled: cognitoUser.enabled,
        status: cognitoUser.status,
        owner: cognitoUser.owner,
        attendanceManagementEnabled: true,
      } as CreateStaffInput & { attendanceManagementEnabled?: boolean };

      await createStaff(createInput).catch(() => {
        throw new Error(MESSAGE_CODE.E05002);
      });
    }),
  );

  try {
    await refreshStaff();
  } catch {
    throw new Error(MESSAGE_CODE.E05001);
  }
}
