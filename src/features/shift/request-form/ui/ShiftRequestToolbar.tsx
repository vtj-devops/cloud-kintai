import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import { AppIconButton } from "@shared/ui/button";
import dayjs from "dayjs";

type ShiftRequestToolbarProps = {
  monthLabel: string;
  isMobile: boolean;
  isAutoSaving: boolean;
  isAutoSavePending: boolean;
  lastSavedAt: Date | null;
  lastChangedAt: Date | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenPatterns: () => void;
};

export function ShiftRequestToolbar({
  monthLabel,
  isMobile,
  isAutoSaving,
  isAutoSavePending,
  lastSavedAt,
  lastChangedAt,
  onPrevMonth,
  onNextMonth,
  onOpenPatterns,
}: ShiftRequestToolbarProps) {
  return (
    <Paper
      sx={{
        p: { xs: 1.5, sm: 2.25 },
        borderRadius: "24px",
        border: "1px solid rgba(226,232,240,0.8)",
        boxShadow: "0 24px 48px -36px rgba(15,23,42,0.35)",
        bgcolor: "#ffffff",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <AppIconButton size="sm" onClick={onPrevMonth} aria-label="前の月">
            <ArrowBackIcon />
          </AppIconButton>
          <Typography
            sx={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}
          >
            {monthLabel}
          </Typography>
          <AppIconButton size="sm" onClick={onNextMonth} aria-label="次の月">
            <ArrowForwardIcon />
          </AppIconButton>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              ml: { xs: 0, sm: 1 },
            }}
          >
            {isAutoSaving && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.secondary">
                  保存中...
                </Typography>
              </Box>
            )}
            {isAutoSavePending && !isAutoSaving && (
              <Typography variant="caption" color="text.secondary">
                保存待ち
                {lastChangedAt &&
                  ` (${dayjs(lastChangedAt).format("M/D HH:mm:ss")})`}
              </Typography>
            )}
            {!isAutoSaving && !isAutoSavePending && lastSavedAt && (
              <Typography variant="caption" color="success.main">
                最終保存: {dayjs(lastSavedAt).format("M/D HH:mm:ss")}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            startIcon={<AddIcon />}
            onClick={onOpenPatterns}
            fullWidth={isMobile}
            sx={{
              minWidth: 140,
              borderRadius: "9999px",
              border: "1px solid rgba(6,95,70,0.35)",
              backgroundColor: "#19b985",
              color: "#ffffff",
              boxShadow:
                "inset 0 -2px 0 rgba(0,0,0,0.12), 0 12px 24px -18px rgba(5,150,105,0.55)",
              "&:hover": { backgroundColor: "#17ab7b" },
            }}
          >
            マイパターン
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

