import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { useWorkflowNotification } from "@entities/workflow/model/useWorkflowNotification";
import { useDuplicateAttendanceWarning } from "@features/attendance/model/useDuplicateAttendanceWarning";
import { useWorkflowCommentNotification } from "@features/workflow/notification/model/useWorkflowCommentNotification";
import { useNetworkStatusNotification } from "@shared/lib/useNetworkStatusNotification";
import type { ReactNode } from "react";
import { useContext } from "react";

function AppRuntimeEffects() {
  const { authStatus } = useContext(AuthContext);
  const { derived } = useContext(AppConfigContext);

  useDuplicateAttendanceWarning();
  useNetworkStatusNotification();

  const workflowNotificationsEnabled =
    authStatus === "authenticated" && Boolean(derived?.workflowNotificationEnabled);

  useWorkflowNotification(workflowNotificationsEnabled);
  useWorkflowCommentNotification(workflowNotificationsEnabled);

  return null;
}

type AppRuntimeProviderProps = {
  children: ReactNode;
};

export function AppRuntimeProvider({ children }: AppRuntimeProviderProps) {
  return (
    <>
      <AppRuntimeEffects />
      {children}
    </>
  );
}
