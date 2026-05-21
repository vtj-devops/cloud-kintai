import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import { useWorkflowNotificationInbox } from "@features/workflow/notification/model/useWorkflowNotificationInbox";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import {
  Box,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { AppButton } from "@shared/ui/button";
import {
  DataStateContainer,
  EmptyState,
  InlineAlert,
} from "@shared/ui/feedback";
import {
  DashboardInnerSurface,
  PageContent,
  PageSection,
} from "@shared/ui/layout";
import Page from "@shared/ui/page/Page";
import { SectionTitle } from "@shared/ui/typography";
import dayjs from "dayjs";
import {
  type UIEvent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";

const formatEventAt = (eventAt: string) =>
  dayjs(eventAt).format("YYYY/MM/DD HH:mm");

export default function WorkflowNotificationsPage() {
  const navigate = useNavigate();
  const { getWorkflowNotificationEnabled } = useContext(AppConfigContext);
  const { isCognitoUserRole } = useContext(AuthContext);
  const workflowNotificationEnabled = getWorkflowNotificationEnabled();
  const [actionError, setActionError] = useState<string | null>(null);
  const {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    error,
    markAsRead,
    markAllAsRead,
    loadMoreNotifications,
  } = useWorkflowNotificationInbox();

  const isAdminUser = useMemo(
    () =>
      isCognitoUserRole(StaffRole.ADMIN) ||
      isCognitoUserRole(StaffRole.STAFF_ADMIN),
    [isCognitoUserRole],
  );

  const workflowDetailBasePath = useMemo(
    () => (isAdminUser ? "/admin/workflow" : "/workflow"),
    [isAdminUser],
  );

  const handleOpenNotification = async (
    notificationId: string,
    workflowId: string,
  ) => {
    setActionError(null);
    try {
      await markAsRead(notificationId);
      navigate(`${workflowDetailBasePath}/${encodeURIComponent(workflowId)}`);
    } catch (markReadError) {
      const message =
        markReadError instanceof Error
          ? markReadError.message
          : String(markReadError);
      setActionError(message);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionError(null);
    try {
      await markAllAsRead();
    } catch (markReadError) {
      const message =
        markReadError instanceof Error
          ? markReadError.message
          : String(markReadError);
      setActionError(message);
    }
  };

  const handleListScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!hasMore || loadingMore) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      const reachedBottom = scrollHeight - scrollTop - clientHeight < 80;

      if (reachedBottom) {
        void loadMoreNotifications();
      }
    },
    [hasMore, loadingMore, loadMoreNotifications],
  );

  if (!workflowNotificationEnabled) {
    return <Navigate to="/attendance/list" replace />;
  }

  return (
    <Page title="通知" width="full" showDefaultHeader={false}>
      <PageContent width="narrow">
        <PageSection layoutVariant="dashboard">
          <DashboardInnerSurface>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <SectionTitle as="h2">通知一覧</SectionTitle>
                  <Chip
                    label={`未読 ${unreadCount} 件`}
                    color="primary"
                    variant="outlined"
                  />
                </Stack>
                <AppButton
                  variant="outline"
                  tone="neutral"
                  size="sm"
                  startIcon={<MarkEmailReadIcon />}
                  disabled={unreadCount === 0 || loading}
                  onClick={() => {
                    void handleMarkAllAsRead();
                  }}
                >
                  すべて既読にする
                </AppButton>
              </Stack>

              {error && <InlineAlert tone="error">{error}</InlineAlert>}
              {actionError && (
                <InlineAlert tone="error">{actionError}</InlineAlert>
              )}

              <DataStateContainer
                isLoading={loading}
                hasData={notifications.length > 0}
                loadingContent={
                  <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress />
                  </Box>
                }
                emptyContent={
                  <Box
                    sx={{
                      py: 6,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <NotificationsNoneIcon color="disabled" />
                    <EmptyState message="通知はありません" />
                  </Box>
                }
              >
                <Box
                  sx={{ maxHeight: "65vh", overflowY: "auto", pr: 0.5 }}
                  onScroll={handleListScroll}
                >
                  <List disablePadding>
                    {notifications.map((notification) => (
                      <ListItemButton
                        key={notification.id}
                        onClick={() => {
                          void handleOpenNotification(
                            notification.id,
                            notification.workflowId,
                          );
                        }}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          backgroundColor: notification.isRead
                            ? "transparent"
                            : "action.hover",
                        }}
                      >
                        <ListItemText
                          primary={notification.title}
                          secondary={
                            <Stack spacing={0.5} mt={0.5}>
                              <Typography variant="body2" color="text.secondary">
                                {notification.body}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                {formatEventAt(notification.eventAt)}
                              </Typography>
                            </Stack>
                          }
                        />
                        {!notification.isRead && (
                          <Chip size="small" label="未読" color="primary" />
                        )}
                      </ListItemButton>
                    ))}
                  </List>
                  {loadingMore && (
                    <Box display="flex" justifyContent="center" py={1.5}>
                      <CircularProgress size={20} />
                    </Box>
                  )}
                </Box>
              </DataStateContainer>
            </Stack>
          </DashboardInnerSurface>
        </PageSection>
      </PageContent>
    </Page>
  );
}
