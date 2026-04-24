import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { useWorkflowNotificationInbox } from "@features/workflow/notification/model/useWorkflowNotificationInbox";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { Badge } from "@mui/material";
import { AppIconButton } from "@shared/ui/button";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

export default function WorkflowNotificationButton() {
  const { authStatus } = useContext(AuthContext);
  const { getWorkflowNotificationEnabled } = useContext(AppConfigContext);
  const isAuthenticated = authStatus === "authenticated";
  const workflowNotificationEnabled = getWorkflowNotificationEnabled();
  const navigate = useNavigate();
  const { unreadCount } = useWorkflowNotificationInbox();

  if (!isAuthenticated || !workflowNotificationEnabled) {
    return null;
  }

  return (
    <AppIconButton
      aria-label="通知一覧"
      tooltip="通知一覧"
      onClick={() => navigate("/notifications")}
      tone="neutral"
    >
      <Badge
        badgeContent={unreadCount}
        color="error"
        max={99}
        overlap="circular"
        showZero
      >
        <NotificationsNoneIcon />
      </Badge>
    </AppIconButton>
  );
}
