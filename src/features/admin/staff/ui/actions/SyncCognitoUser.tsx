import { useAppDispatchV2 } from "@app/hooks";
import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { handleSyncCognitoUser } from "@features/admin/staff/model/handleSyncCognitoUser";
import { CreateStaffInput, UpdateStaffInput } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import { useState } from "react";

import * as MESSAGE_CODE from "@/errors";

export default function SyncCognitoUser({
  staffs,
  refreshStaff,
  createStaff,
  updateStaff,
}: {
  staffs: StaffType[];
  refreshStaff: () => Promise<void>;
  createStaff: (input: CreateStaffInput) => Promise<void>;
  updateStaff: (input: UpdateStaffInput) => Promise<void>;
}) {
  const dispatch = useAppDispatchV2();
  const [cognitoUserLoading, setCognitoUserLoading] = useState(false);
  return (
    <AppButton
      variant="outline"
      tone="secondary"
      size="sm"
      loading={cognitoUserLoading}
      startIcon={
        <svg
          className="h-4 w-4 text-emerald-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 0 1 15.3-6.3L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15.3 6.3L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      }
      disabled={cognitoUserLoading}
      onClick={() => {
        setCognitoUserLoading(true);
        handleSyncCognitoUser(staffs, refreshStaff, createStaff, updateStaff)
          .then(() => {
            dispatch(
              pushNotification({
                tone: "success",
                message: MESSAGE_CODE.S05005,
              }),
            );
          })
          .catch((e) => {
            dispatch(
              pushNotification({
                tone: "error",
                message: e.message,
              }),
            );
          })
          .finally(() => {
            setCognitoUserLoading(false);
          });
      }}
    >
      ユーザー同期
    </AppButton>
  );
}
