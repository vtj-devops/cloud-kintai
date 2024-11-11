import { CreateStaffInput, UpdateStaffInput } from "../../../API";
import * as MESSAGE_CODE from "../../../errors";
import fetchCognitoUsers from "../../../hooks/common/fetchCognitoUsers";
import { StaffType } from "../../../hooks/useStaffs/useStaffs";

export async function handleSyncCognitoUser(
  staffs: StaffType[],
  refreshStaff: () => Promise<void>,
  createStaff: (input: CreateStaffInput) => Promise<void>,
  updateStaff: (input: UpdateStaffInput) => Promise<void>
) {
  const cognitoUsers = await fetchCognitoUsers().catch((e) => {
    throw e;
  });

  if (!cognitoUsers) {
    throw new Error(MESSAGE_CODE.E05006);
  }

  await Promise.all(
    cognitoUsers.map(async (cognitoUser) => {
      const isExistStaff = staffs.find(
        ({ cognitoUserId }) => cognitoUserId === cognitoUser.sub
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

      await createStaff({
        cognitoUserId: cognitoUser.sub,
        familyName: cognitoUser.familyName,
        givenName: cognitoUser.givenName,
        mailAddress: cognitoUser.mailAddress,
        role: cognitoUser.roles[0],
        enabled: cognitoUser.enabled,
        status: cognitoUser.status,
        owner: cognitoUser.owner,
      }).catch(() => {
        throw new Error(MESSAGE_CODE.E05002);
      });
    })
  )
    .then(async () => {
      await refreshStaff().catch(() => {
        throw new Error(MESSAGE_CODE.E05001);
      });
    })
    .catch((e) => {
      throw e;
    });
}
