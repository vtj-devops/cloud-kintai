import { Alert, Snackbar, Stack, Typography } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";

export type PresenceNotificationType =
  | "user-joined"
  | "user-left"
  | "cell-editing-started"
  | "cell-editing-stopped";

export interface PresenceNotification {
  id: string;
  type: PresenceNotificationType;
  userName: string;
  timestamp: number;
  cellInfo?: {
    staffName: string;
    date: string;
  };
}

interface PresenceNotificationProps {
  notifications: PresenceNotification[];
  onDismiss?: (id: string) => void;
  autoHideDuration?: number;
}

/**
 * プレゼンス通知コンポーネント
 * ユーザーの参加/退出、セル編集開始/終了を通知
 */
export const PresenceNotificationContainer: React.FC<
  PresenceNotificationProps
> = ({ notifications, onDismiss, autoHideDuration = 4000 }) => {
  const [displayedNotifications, setDisplayedNotifications] = useState<
    PresenceNotification[]
  >([]);

  useEffect(() => {
    // 新しい通知を追加（最大3件まで）
    const newNotifications = notifications.filter(
      (n) => !displayedNotifications.some((p) => p.id === n.id),
    );

    if (newNotifications.length > 0) {
      setDisplayedNotifications((prev) =>
        [...prev, ...newNotifications].slice(-3),
      );
    }
    // displayedNotifications は意図的に依存配列から除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  const handleClose = useCallback(
    (id: string) => {
      setDisplayedNotifications((prev) => prev.filter((n) => n.id !== id));
      onDismiss?.(id);
    },
    [onDismiss],
  );

  return (
    <Stack
      spacing={1}
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1400,
        maxWidth: 400,
      }}
    >
      {displayedNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => handleClose(notification.id)}
          autoHideDuration={autoHideDuration}
        />
      ))}
    </Stack>
  );
};

interface NotificationItemProps {
  notification: PresenceNotification;
  onClose: () => void;
  autoHideDuration: number;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClose,
  autoHideDuration,
}) => {
  const [open, setOpen] = useState(true);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(onClose, 300); // アニメーション完了後に削除
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);

  const getMessage = () => {
    switch (notification.type) {
      case "user-joined":
        return `${notification.userName} が参加しました`;
      case "user-left":
        return `${notification.userName} が退出しました`;
      case "cell-editing-started":
        return notification.cellInfo
          ? `${notification.userName} が ${notification.cellInfo.staffName} の ${notification.cellInfo.date} を編集中です`
          : `${notification.userName} がセルを編集中です`;
      case "cell-editing-stopped":
        return notification.cellInfo
          ? `${notification.userName} が ${notification.cellInfo.staffName} の ${notification.cellInfo.date} の編集を終了しました`
          : `${notification.userName} が編集を終了しました`;
      default:
        return "";
    }
  };

  const getSeverity = (): "info" | "success" | "warning" | "error" => {
    switch (notification.type) {
      case "user-joined":
        return "success";
      case "user-left":
        return "info";
      case "cell-editing-started":
        return "warning";
      case "cell-editing-stopped":
        return "info";
      default:
        return "info";
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={handleClose}
        severity={getSeverity()}
        variant="filled"
        sx={{ width: "100%" }}
      >
        <Typography variant="body2">{getMessage()}</Typography>
      </Alert>
    </Snackbar>
  );
};

/**
 * プレゼンス通知を管理するカスタムフック
 */
export const usePresenceNotifications = () => {
  const [notifications, setNotifications] = useState<PresenceNotification[]>(
    [],
  );

  const addNotification = useCallback(
    (
      type: PresenceNotificationType,
      userName: string,
      cellInfo?: { staffName: string; date: string },
    ) => {
      const notification: PresenceNotification = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        userName,
        timestamp: Date.now(),
        cellInfo,
      };
      setNotifications((prev) => [...prev, notification]);
    },
    [],
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearNotifications,
  };
};
