import { AuthContext } from "@app/providers/auth/AuthContext";
import { isShiftWorkType } from "@entities/staff/lib/workTypeOptions";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { ProgressBar } from "@shared/ui/feedback";
import { PageSection } from "@shared/ui/layout";
import Page from "@shared/ui/page/Page";
import type { ReactNode } from "react";
import { useContext } from "react";

export const SHIFT_ACCESS_DENIED_MESSAGE =
  "シフト機能は勤務形態がシフト勤務のスタッフのみ利用できます。設定確認や変更が必要な場合は管理者へ確認してください。";

type ShiftAccessGuardProps = {
  title: string;
  children: ReactNode;
};

export default function ShiftAccessGuard({
  title,
  children,
}: ShiftAccessGuardProps) {
  const { authStatus, cognitoUser } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs, loading } = useStaffs({ isAuthenticated });

  const currentStaff = (() => {
    if (!cognitoUser?.id) {
      return null;
    }

    return staffs.find((staff) => staff.cognitoUserId === cognitoUser.id) ?? null;
  })();

  if (loading) {
    return (
      <Page title={title} width="full" showDefaultHeader={false}>
        <PageSection variant="plain" layoutVariant="detail" sx={{ gap: 0 }}>
          <ProgressBar data-testid="shift-access-loading" />
        </PageSection>
      </Page>
    );
  }

  if (!isShiftWorkType(currentStaff?.workType)) {
    return (
      <Page title={title} width="full" showDefaultHeader={false}>
        <PageSection variant="plain" layoutVariant="detail">
          <div
            role="alert"
            data-testid="shift-access-denied"
            className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-950"
          >
            {SHIFT_ACCESS_DENIED_MESSAGE}
          </div>
        </PageSection>
      </Page>
    );
  }

  return <>{children}</>;
}
