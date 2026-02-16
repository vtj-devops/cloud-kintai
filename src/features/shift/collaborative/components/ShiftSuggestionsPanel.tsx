import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import MinimizeIcon from "@mui/icons-material/Minimize";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { memo, useState } from "react";

import { RuleViolation, SuggestedAction } from "../rules/shiftRules";

type ViewMode = "minimized" | "default" | "expanded";
type SeverityFilter = "all" | "error" | "warning";

interface ShiftSuggestionsPanelProps {
  violations: RuleViolation[];
  isAnalyzing: boolean;
  onApplyAction: (action: SuggestedAction) => void;
  onRefresh: () => void;
}

export const ShiftSuggestionsPanelBase = ({
  violations,
  isAnalyzing,
  onApplyAction,
  onRefresh,
}: ShiftSuggestionsPanelProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [expandedViolations, setExpandedViolations] = useState<Set<string>>(
    new Set(),
  );

  const toggleViolation = (violationId: string) => {
    setExpandedViolations((prev) => {
      const next = new Set(prev);
      if (next.has(violationId)) {
        next.delete(violationId);
      } else {
        next.add(violationId);
      }
      return next;
    });
  };

  const handleFilterChange = (newFilter: SeverityFilter) => {
    setSeverityFilter(newFilter);
    // フィルター切り替え時は viewMode を "default" にリセット
    setViewMode("default");
  };

  const cycleViewMode = () => {
    setViewMode((prev) => {
      if (prev === "minimized") return "default";
      if (prev === "default") return "expanded";
      return "minimized";
    });
  };

  const getViewModeIcon = () => {
    if (viewMode === "minimized") return <ExpandMoreIcon />;
    if (viewMode === "expanded") return <MinimizeIcon />;
    return <ExpandLessIcon />;
  };

  const getViewModeTooltip = () => {
    if (viewMode === "minimized") return "展開する";
    if (viewMode === "expanded") return "最小化する";
    return "全て展開する";
  };

  const errorCount = violations.filter((v) => v.severity === "error").length;
  const warningCount = violations.filter(
    (v) => v.severity === "warning",
  ).length;

  const filteredViolations =
    severityFilter === "all"
      ? violations
      : violations.filter((v) => v.severity === severityFilter);

  const displayedViolations =
    viewMode === "minimized"
      ? []
      : viewMode === "default"
        ? filteredViolations.slice(0, 3)
        : filteredViolations;

  const getSeverityIcon = (severity: RuleViolation["severity"]) => {
    switch (severity) {
      case "error":
        return <ErrorIcon color="error" />;
      case "warning":
        return <WarningIcon color="warning" />;
      case "info":
        return <InfoIcon color="info" />;
    }
  };

  const getSeverityColor = (
    severity: RuleViolation["severity"],
  ): "error" | "warning" | "info" => {
    return severity;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        position: "fixed",
        right: 25,
        bottom: 55,
        width: viewMode === "minimized" ? 300 : 400,
        maxHeight: viewMode === "minimized" ? "auto" : "calc(100vh - 200px)",
        overflow: "auto",
        zIndex: 999,
        transition: "width 0.3s, max-height 0.3s, bottom 0.3s",
      }}
    >
      {/* ヘッダー */}
      <Box
        sx={{
          p: 2,
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <LightbulbIcon />
          <Typography variant="h6">シフト提案</Typography>
          {isAnalyzing && (
            <CircularProgress size={20} sx={{ color: "white" }} />
          )}
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={getViewModeTooltip()}>
            <IconButton
              size="small"
              onClick={cycleViewMode}
              sx={{ color: "white" }}
            >
              {getViewModeIcon()}
            </IconButton>
          </Tooltip>
          <Tooltip title="再分析">
            <IconButton
              size="small"
              onClick={onRefresh}
              disabled={isAnalyzing}
              sx={{ color: "white" }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {viewMode !== "minimized" && (
        <>
          {/* サマリー */}
          <Box sx={{ p: 2, bgcolor: "background.default" }}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label="すべて"
                size="small"
                variant={severityFilter === "all" ? "filled" : "outlined"}
                color={severityFilter === "all" ? "primary" : "default"}
                onClick={() => handleFilterChange("all")}
                sx={{ cursor: "pointer" }}
              />
              {errorCount > 0 && (
                <Chip
                  icon={<ErrorIcon />}
                  label={`エラー ${errorCount}`}
                  color="error"
                  size="small"
                  variant={severityFilter === "error" ? "filled" : "outlined"}
                  onClick={() => handleFilterChange("error")}
                  sx={{ cursor: "pointer" }}
                />
              )}
              {warningCount > 0 && (
                <Chip
                  icon={<WarningIcon />}
                  label={`警告 ${warningCount}`}
                  color="warning"
                  size="small"
                  variant={severityFilter === "warning" ? "filled" : "outlined"}
                  onClick={() => handleFilterChange("warning")}
                  sx={{ cursor: "pointer" }}
                />
              )}
              {violations.length === 0 && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="問題なし"
                  color="success"
                  size="small"
                />
              )}
            </Stack>
          </Box>

          <Divider />

          {/* 違反リスト */}
          {filteredViolations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <CheckCircleIcon
                sx={{ fontSize: 48, color: "success.main", mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {severityFilter === "all"
                  ? "すべてのシフトが適切に設定されています"
                  : `該当する${severityFilter === "error" ? "エラー" : "警告"}はありません`}
              </Typography>
            </Box>
          ) : (
            <>
              <List disablePadding>
                {displayedViolations
                  .filter((v) =>
                    severityFilter === "all"
                      ? true
                      : v.severity === severityFilter,
                  )
                  .map((violation, index) => {
                    const violationId = `${violation.ruleId}-${index}`;
                    const isExpanded = expandedViolations.has(violationId);

                    return (
                      <Box key={violationId}>
                        <ListItemButton
                          onClick={() => toggleViolation(violationId)}
                          sx={{
                            borderLeft: 4,
                            borderColor: `${getSeverityColor(
                              violation.severity,
                            )}.main`,
                          }}
                        >
                          <Box sx={{ mr: 2 }}>
                            {getSeverityIcon(violation.severity)}
                          </Box>
                          <ListItemText
                            primary={violation.message}
                            primaryTypographyProps={{
                              variant: "body2",
                              fontWeight: 600,
                            }}
                          />
                        </ListItemButton>

                        {/* 提案アクション */}
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ bgcolor: "background.default", p: 2 }}>
                            {violation.suggestedActions &&
                            violation.suggestedActions.length > 0 ? (
                              <Stack spacing={1}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight={600}
                                >
                                  推奨アクション:
                                </Typography>
                                {violation.suggestedActions.map((action) => (
                                  <Card key={action.id} variant="outlined">
                                    <CardContent
                                      sx={{
                                        p: 1.5,
                                        "&:last-child": { pb: 1.5 },
                                      }}
                                    >
                                      <Stack spacing={1}>
                                        <Typography
                                          variant="body2"
                                          fontWeight={600}
                                        >
                                          {action.description}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {action.impact}
                                        </Typography>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          startIcon={<CheckCircleIcon />}
                                          onClick={() => onApplyAction(action)}
                                          fullWidth
                                        >
                                          適用する
                                        </Button>
                                      </Stack>
                                    </CardContent>
                                  </Card>
                                ))}
                              </Stack>
                            ) : (
                              <Alert severity="info" sx={{ py: 0.5 }}>
                                自動提案はありません。手動で調整してください。
                              </Alert>
                            )}
                          </Box>
                        </Collapse>
                        <Divider />
                      </Box>
                    );
                  })}
              </List>
              {viewMode === "default" && filteredViolations.length > 3 && (
                <Box
                  sx={{
                    p: 2,
                    textAlign: "center",
                    bgcolor: "background.default",
                  }}
                >
                  <Button
                    size="small"
                    startIcon={<ExpandMoreIcon />}
                    onClick={() => setViewMode("expanded")}
                  >
                    残り {filteredViolations.length - 3} 件を表示
                  </Button>
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Paper>
  );
};

export const ShiftSuggestionsPanel = memo(ShiftSuggestionsPanelBase);
