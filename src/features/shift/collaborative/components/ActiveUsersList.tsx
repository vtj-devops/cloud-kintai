import "dayjs/locale/ja";

import GroupIcon from "@mui/icons-material/Group";
import {
  Avatar,
  AvatarGroup,
  Box,
  Chip,
  IconButton,
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

/**
 * アクティブユーザーのステータスを判定
 */
const getUserStatus = (lastActivity: number): "online" | "idle" | "offline" => {
  const now = Date.now();
  const diffMs = now - lastActivity;

  if (diffMs < 30000) return "online"; // 30秒以内
  if (diffMs < 300000) return "idle"; // 5分以内
  return "offline";
};

/**
 * ステータスに応じた色を返す
 */
const getStatusColor = (status: "online" | "idle" | "offline"): string => {
  switch (status) {
    case "online":
      return "#4caf50"; // green
    case "idle":
      return "#ff9800"; // orange
    case "offline":
      return "#9e9e9e"; // gray
  }
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
  const theme = useTheme();
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
          <IconButton onClick={handleClick} size="small">
            <GroupIcon />
          </IconButton>
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
            <Tooltip key={user.userId} title={user.userName}>
              <Avatar
                sx={{
                  bgcolor: user.color,
                  width: 32,
                  height: 32,
                  fontSize: "0.875rem",
                  position: "relative",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: getStatusColor(user.status),
                    border: `2px solid ${theme.palette.background.paper}`,
                  },
                }}
              >
                {user.userName.charAt(0)}
              </Avatar>
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
      status: "online" | "idle" | "offline";
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
              <Avatar
                sx={{
                  bgcolor: user.color,
                  position: "relative",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: getStatusColor(user.status),
                    border: `2px solid ${theme.palette.background.paper}`,
                  },
                }}
              >
                {user.userName.charAt(0)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body1">{user.userName}</Typography>
                  <Chip
                    label={
                      user.status === "online"
                        ? "オンライン"
                        : user.status === "idle"
                          ? "アイドル"
                          : "オフライン"
                    }
                    size="small"
                    color={
                      user.status === "online"
                        ? "success"
                        : user.status === "idle"
                          ? "warning"
                          : "default"
                    }
                    sx={{ height: 20 }}
                  />
                </Box>
              }
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
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
