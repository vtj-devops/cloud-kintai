import "dayjs/locale/ja";

import GroupIcon from "@mui/icons-material/Group";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Popover,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppIconButton } from "@shared/ui/button";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React, { memo, useMemo, useState } from "react";

import { CollaborativeUser } from "../types/collaborative.types";

dayjs.extend(relativeTime);
dayjs.locale("ja");

interface ActiveUsersListProps {
  activeUsers: CollaborativeUser[];
  editingCells?: Map<string, { userId: string; userName: string }>;
  compact?: boolean;
}

type UserPresenceStatus = "online" | "idle" | "offline";

/**
 * アクティブユーザーのステータスを判定
 */
const getUserStatus = (lastActivity: number): UserPresenceStatus => {
  const now = Date.now();
  const diffMs = now - lastActivity;

  if (diffMs < 30000) return "online"; // 30秒以内
  if (diffMs < 300000) return "idle"; // 5分以内
  return "offline";
};

/**
 * ステータスに応じた色を返す
 */
const USER_STATUS_META: Record<
  UserPresenceStatus,
  { label: string; chipColor: "success" | "warning" | "default"; dotColor: string }
> = {
  online: { label: "オンライン", chipColor: "success", dotColor: "#4caf50" },
  idle: { label: "アイドル", chipColor: "warning", dotColor: "#ff9800" },
  offline: { label: "オフライン", chipColor: "default", dotColor: "#9e9e9e" },
};

/**
 * ユーザーが編集中のセル数を取得
 */
const getEditingCellCount = (
  userId: string,
  editingCells?: Map<string, { userId: string; userName: string }>,
): number => {
  if (!editingCells) return 0;
  let count = 0;
  editingCells.forEach((editor) => {
    if (editor.userId === userId) count++;
  });
  return count;
};

/**
 * アクティブユーザーリストコンポーネント
 */
const ActiveUsersListBase: React.FC<ActiveUsersListProps> = ({
  activeUsers,
  editingCells,
  compact = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const usersWithStatus = useMemo(
    () =>
      activeUsers.map((user) => ({
        ...user,
        status: getUserStatus(user.lastActivity),
        editingCount: getEditingCellCount(user.userId, editingCells),
      })),
    [activeUsers, editingCells],
  );

  // コンパクト表示（アバターグループのみ）
  if (compact) {
    return (
      <>
        <Tooltip title="アクティブユーザー">
          <AppIconButton onClick={handleClick} size="sm" aria-label="アクティブユーザー">
            <GroupIcon />
          </AppIconButton>
        </Tooltip>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <UserDetailList users={usersWithStatus} onClose={handleClose} />
        </Popover>
      </>
    );
  }

  // 通常表示（アバターグループ + ポップオーバー）
  return (
    <>
      <Box
        component="button"
        onClick={handleClick}
        sx={{
          cursor: "pointer",
          display: "inline-flex",
          border: "none",
          background: "none",
          padding: 0,
        }}
      >
        <AvatarGroup max={5}>
          {usersWithStatus.map((user) => (
            <Tooltip
              key={user.userId}
              title={`${user.userName}${user.editingCount > 0 ? ` (${user.editingCount}箇所を編集中)` : ""}`}
            >
              <UserStatusAvatar user={user} size={32} fontSize="0.875rem" />
            </Tooltip>
          ))}
        </AvatarGroup>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <UserDetailList users={usersWithStatus} onClose={handleClose} />
      </Popover>
    </>
  );
};

export const ActiveUsersList = memo(ActiveUsersListBase);

interface UserDetailListProps {
  users: Array<
    CollaborativeUser & {
      status: UserPresenceStatus;
      editingCount: number;
    }
  >;
  onClose: () => void;
}

const UserDetailList: React.FC<UserDetailListProps> = ({ users }) => {
  const theme = useTheme();
  return (
    <Paper sx={{ width: 320, maxHeight: 400, overflow: "auto" }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6">
          アクティブユーザー ({users.length})
        </Typography>
      </Box>
      <List>
        {users.map((user) => (
          <ListItem key={user.userId}>
            <ListItemAvatar>
              <UserStatusAvatar user={user} dotOffset={2} />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body1">{user.userName}</Typography>
                  <Chip
                    label={USER_STATUS_META[user.status].label}
                    size="small"
                    color={USER_STATUS_META[user.status].chipColor}
                    sx={{ height: 20 }}
                  />
                </Box>
              }
              primaryTypographyProps={{ component: "div" }}
              secondary={
                <Box>
                  <Typography variant="caption" display="block">
                    最終アクティビティ: {dayjs(user.lastActivity).fromNow()}
                  </Typography>
                  {user.editingCount > 0 && (
                    <Typography
                      variant="caption"
                      display="block"
                      color="primary"
                    >
                      {user.editingCount}個のセルを編集中
                    </Typography>
                  )}
                </Box>
              }
              secondaryTypographyProps={{ component: "div" }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

interface UserStatusAvatarProps {
  user: CollaborativeUser & { status: UserPresenceStatus; editingCount: number };
  size?: number;
  fontSize?: string;
  dotOffset?: number;
}

const UserStatusAvatar: React.FC<UserStatusAvatarProps> = ({
  user,
  size,
  fontSize,
  dotOffset = 0,
}) => {
  const theme = useTheme();
  const dotColor = USER_STATUS_META[user.status].dotColor;

  return (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      badgeContent={user.editingCount > 0 ? user.editingCount : 0}
      color="primary"
      sx={{
        "& .MuiBadge-badge": {
          fontSize: "0.65rem",
          height: "16px",
          minWidth: "16px",
        },
      }}
    >
      <Avatar
        sx={{
          bgcolor: user.color,
          ...(size ? { width: size, height: size } : {}),
          ...(fontSize ? { fontSize } : {}),
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: dotOffset,
            right: dotOffset,
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: dotColor,
            border: `2px solid ${theme.palette.background.paper}`,
            boxShadow: user.status === "online" ? `0 0 4px ${dotColor}` : "none",
          },
        }}
      >
        {user.userName.charAt(0)}
      </Avatar>
    </Badge>
  );
};
