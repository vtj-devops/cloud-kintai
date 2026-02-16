import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { memo } from "react";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{ key: string; description: string }>;
}

export const KeyboardShortcutsHelpBase = ({
  open,
  onClose,
}: KeyboardShortcutsHelpProps) => {
  const shortcutGroups: ShortcutGroup[] = [
    {
      title: "移動",
      shortcuts: [
        { key: "↑ ↓ ← →", description: "セル間の移動" },
        { key: "Tab", description: "次のセルへ移動" },
        { key: "Shift + Tab", description: "前のセルへ移動" },
      ],
    },
    {
      title: "状態変更",
      shortcuts: [
        { key: "1", description: "出勤に変更" },
        { key: "2", description: "希望休に変更" },
        { key: "3", description: "固定休に変更" },
        { key: "4", description: "自動調整に変更" },
        { key: "5", description: "未入力に変更" },
      ],
    },
    {
      title: "選択",
      shortcuts: [
        { key: "Ctrl/Cmd + A", description: "全セル選択" },
        { key: "Shift + クリック", description: "範囲選択" },
        { key: "Ctrl/Cmd + クリック", description: "複数選択" },
      ],
    },
    {
      title: "その他",
      shortcuts: [
        { key: "?", description: "このヘルプを表示" },
        { key: "Esc", description: "選択解除・モーダルを閉じる" },
        { key: "Ctrl/Cmd + Z", description: "元に戻す（準備中）" },
        { key: "Ctrl/Cmd + Shift + Z", description: "やり直す（準備中）" },
      ],
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">キーボードショートカット</Typography>
          <IconButton
            edge="end"
            onClick={onClose}
            aria-label="close"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {shortcutGroups.map((group, index) => (
          <Box key={group.title} mb={index < shortcutGroups.length - 1 ? 3 : 0}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              {group.title}
            </Typography>
            <List dense disablePadding>
              {group.shortcuts.map((shortcut) => (
                <ListItem key={shortcut.key} disableGutters>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        backgroundColor: "action.hover",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: "0.875rem",
                        minWidth: "140px",
                      }}
                    >
                      {shortcut.key}
                    </Typography>
                    <ListItemText
                      primary={shortcut.description}
                      primaryTypographyProps={{
                        variant: "body2",
                        sx: { ml: 2 },
                      }}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
            {index < shortcutGroups.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export const KeyboardShortcutsHelp = memo(KeyboardShortcutsHelpBase);
