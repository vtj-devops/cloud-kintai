import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";

import AdminWorkflowSettingsContent from "./AdminWorkflowSettingsContent";
import { useAdminWorkflowSettings } from "./useAdminWorkflowSettings";

export default function AdminWorkflowCategorySettings() {
  const state = useAdminWorkflowSettings();
  const { dialog } = usePageLeaveGuard({
    isDirty: state.isDirty,
    isBusy: state.isBusy,
  });

  return (
    <AdminSettingsLayout>
      {dialog}
      <AdminWorkflowSettingsContent state={state} />
    </AdminSettingsLayout>
  );
}
