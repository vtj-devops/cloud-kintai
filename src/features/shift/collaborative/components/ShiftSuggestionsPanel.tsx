import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
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
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { AppIconButton } from "@shared/ui/button";
import { memo, type UIEvent, useEffect, useRef, useState } from "react";

import { RuleViolation, SuggestedAction } from "../rules/shiftRules";

const DRAWER_WIDTH = 400;
const INITIAL_VISIBLE_VIOLATIONS = 10;
const VISIBLE_VIOLATIONS_STEP = 10;
const SCROLL_LOAD_THRESHOLD = 64;

type SeverityFilter = "all" | "error" | "warning";

interface ShiftSuggestionsPanelProps {
  open: boolean;
  onClose: () => void;
  violations: RuleViolation[];
  isAnalyzing: boolean;
  onApplyAction: (action: SuggestedAction) => void;
  onRefresh: () => void;
}

export const ShiftSuggestionsPanelBase = ({
  open,
  onClose,
  violations,
  isAnalyzing,
  onApplyAction,
  onRefresh,
}: ShiftSuggestionsPanelProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_VIOLATIONS);
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
    setVisibleCount(INITIAL_VISIBLE_VIOLATIONS);
  };

  const errorCount = violations.filter((v) => v.severity === "error").length;
  const warningCount = violations.filter(
    (v) => v.severity === "warning",
  ).length;

  const filteredViolations =
    severityFilter === "all"
      ? violations
      : violations.filter((v) => v.severity === severityFilter);

  const displayedViolations = filteredViolations.slice(0, visibleCount);
  const hasMoreViolations =
    displayedViolations.length < filteredViolations.length;

  useEffect(() => {
    if (!open || !hasMoreViolations) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) {
        return;
      }

      const hasScrollableSpace =
        container.scrollHeight - container.clientHeight > SCROLL_LOAD_THRESHOLD;

      if (!hasScrollableSpace) {
        setVisibleCount((prev) =>
          Math.min(prev + VISIBLE_VIOLATIONS_STEP, filteredViolations.length),
        );
      }
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [
    displayedViolations.length,
    filteredViolations.length,
    hasMoreViolations,
    open,
  ]);

  const handleListScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasMoreViolations) {
      return;
    }

    const target = event.currentTarget;
    const reachedBottom =
      target.scrollTop + target.clientHeight >=
      target.scrollHeight - SCROLL_LOAD_THRESHOLD;

    if (reachedBottom) {
      setVisibleCount((prev) =>
        Math.min(prev + VISIBLE_VIOLATIONS_STEP, filteredViolations.length),
      );
    }
  };

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
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      sx={{
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <LightbulbIcon color="warning" />
          <Typography variant="subtitle1" fontWeight="bold">
            シフト提案
          </Typography>
          {isAnalyzing && <CircularProgress size={18} />}
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="再分析">
            <AppIconButton
              size="sm"
              onClick={onRefresh}
              disabled={isAnalyzing}
              aria-label="提案を再分析"
            >
              <RefreshIcon />
            </AppIconButton>
          </Tooltip>
          <AppIconButton size="sm" onClick={onClose} aria-label="close">
            <CloseIcon fontSize="small" />
          </AppIconButton>
        </Stack>
      </Stack>

      <Box
        ref={scrollContainerRef}
        sx={{ overflow: "auto", flex: 1, p: 2 }}
        onScroll={handleListScroll}
      >
        <Stack spacing={2}>
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

          <Divider />

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
                {displayedViolations.map((violation, index) => {
                  const violationId = `${violation.ruleId}-${index}`;
                  const isExpanded = expandedViolations.has(violationId);

                  return (
                    <Box key={violationId}>
                      <ListItemButton
                        onClick={() => toggleViolation(violationId)}
                        sx={{
                          borderLeft: 4,
                          borderColor: `${getSeverityColor(violation.severity)}.main`,
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

              {hasMoreViolations && (
                <Box sx={{ px: 1, py: 1.5, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    スクロールして続きを読み込み
                  </Typography>
                </Box>
              )}

              {!hasMoreViolations && filteredViolations.length > 0 && (
                <Box sx={{ px: 1, py: 1.5, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    これ以上ありません
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
};

export const ShiftSuggestionsPanel = memo(ShiftSuggestionsPanelBase);
