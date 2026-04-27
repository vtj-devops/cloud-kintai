import { AuthContext } from "@app/providers/auth/AuthContext";
import { useGetAttendanceStatisticsSnapshotQuery } from "@entities/attendance-statistics/api/attendanceStatisticsApi";
import { rebuildAttendanceStatistics } from "@entities/attendance-statistics/model/attendanceStatisticsService";
import type {
  AttendanceStatisticsProgress,
  AttendanceStatisticsSnapshot,
} from "@entities/attendance-statistics/model/types";
import {
  Alert,
  Button,
  ButtonGroup,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { PageTitle } from "@shared/ui/typography";
import dayjs from "dayjs";
import { useContext, useMemo, useState } from "react";

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      spacing={0.5}
      sx={{
        minWidth: 140,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 1.25,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value}</Typography>
    </Stack>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

function formatRangeLabel(rangeStart?: string | null, rangeEnd?: string | null) {
  if (!rangeStart || !rangeEnd) {
    return "";
  }

  return `${rangeStart.replaceAll("-", "/")} - ${rangeEnd.replaceAll("-", "/")}`;
}

function formatMonthRangeLabel(rangeStart: string, rangeEnd: string) {
  return `${rangeStart.replaceAll("-", "/")} 〜 ${rangeEnd.replaceAll("-", "/")}`;
}

function formatDateTimeLabel(value?: string | null) {
  if (!value) {
    return "";
  }

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return value;
  }

  return parsed.format("YYYY/MM/DD HH:mm");
}

function resolveErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return "稼働統計の取得に失敗しました";
}

function ProgressPanel(props: {
  progressPercent: number;
  currentStepLabel: string;
  startedAt?: string | null;
  variantText: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: { xs: 2, sm: 3 },
      }}
    >
      <Stack spacing={1.5}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle1">{props.variantText}</Typography>
          <Typography variant="body2" color="text.secondary">
            {props.currentStepLabel}
          </Typography>
          {props.startedAt ? (
            <Typography variant="caption" color="text.secondary">
              開始時刻: {formatDateTimeLabel(props.startedAt)}
            </Typography>
          ) : null}
        </Stack>
        <Stack spacing={0.75}>
          <Typography variant="body2" color="text.secondary">
            進捗: {Math.round(props.progressPercent)}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(props.progressPercent, 100))}
            aria-label="稼働統計の再集計進捗"
          />
        </Stack>
      </Stack>
    </Paper>
  );
}

function SnapshotSummary({
  snapshot,
}: {
  snapshot: AttendanceStatisticsSnapshot;
}) {
  const hasFallbackTerms = snapshot.monthlySummaries.some((item) => item.isFallback);

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: { xs: 2, sm: 3 },
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="subtitle1">年間サマリー</Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            useFlexGap
            flexWrap="wrap"
          >
            <StatItem label="稼働日数" value={`${snapshot.totalWorkDays} 日`} />
            <StatItem
              label="稼働時間"
              value={`${snapshot.totalWorkHours.toFixed(1)} 時間`}
            />
            <StatItem label="有給取得" value={`${snapshot.totalPaidDays} 日`} />
            <StatItem
              label="特別休暇"
              value={`${snapshot.totalSpecialHolidayDays} 日`}
            />
            <StatItem label="欠勤" value={`${snapshot.totalAbsentDays} 日`} />
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: { xs: 2, sm: 3 },
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="subtitle1">月別サマリー</Typography>
          {hasFallbackTerms ? (
            <Typography variant="body2" color="text.secondary">
              集計対象月が未登録の期間は、暫定で月初〜月末を集計期間として使用しています。
            </Typography>
          ) : null}
          <Stack spacing={1}>
            {snapshot.monthlySummaries.map((stat) => (
              <Stack
                key={stat.month}
                spacing={0.75}
                sx={{
                  borderBottom: "1px dashed",
                  borderColor: "divider",
                  pb: 1,
                }}
              >
                <Stack direction="row" justifyContent="space-between">
                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">
                      {stat.month}月
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatMonthRangeLabel(stat.rangeStart, stat.rangeEnd)}
                      {stat.isFallback ? "（暫定）" : ""}
                    </Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {stat.workHours.toFixed(1)} 時間
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <MiniStat label="稼働日" value={`${stat.workDays} 日`} />
                  <MiniStat label="有給" value={`${stat.paidDays} 日`} />
                  <MiniStat
                    label="特別休暇"
                    value={`${stat.specialHolidayDays} 日`}
                  />
                  <MiniStat label="欠勤" value={`${stat.absentDays} 日`} />
                </Stack>
              </Stack>
            ))}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body1">年間合計</Typography>
              <Typography variant="h6">
                {snapshot.totalWorkHours.toFixed(1)} 時間
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}

export default function AttendanceStatistics() {
  const { cognitoUser } = useContext(AuthContext);
  const [year, setYear] = useState<number>(dayjs().year());
  const [progress, setProgress] = useState<AttendanceStatisticsProgress | null>(null);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const shouldFetch = Boolean(cognitoUser?.id);
  const {
    data: snapshot,
    isLoading,
    isFetching,
    error,
    isError,
    refetch,
  } = useGetAttendanceStatisticsSnapshotQuery(
    {
      staffId: cognitoUser?.id ?? "",
      year,
    },
    {
      skip: !shouldFetch,
    },
  );

  const currentProgress = useMemo(() => {
    if (progress) {
      return progress;
    }

    if (snapshot?.status === "RUNNING") {
      return {
        progressPercent: snapshot.progressPercent ?? 0,
        currentStepLabel:
          snapshot.currentStepLabel ?? "前回の集計が中断された可能性があります",
        startedAt: snapshot.startedAt ?? "",
      };
    }

    return null;
  }, [progress, snapshot]);

  const handleRebuild = async () => {
    if (!cognitoUser?.id || isRebuilding) {
      return;
    }

    setActionError(null);
    setIsRebuilding(true);
    setProgress({
      progressPercent: 0,
      currentStepLabel: "集計を開始しています",
      startedAt: new Date().toISOString(),
    });

    try {
      await rebuildAttendanceStatistics({
        staffId: cognitoUser.id,
        year,
        onProgress: setProgress,
      });
      await refetch();
    } catch (rebuildError) {
      setActionError(
        rebuildError instanceof Error
          ? rebuildError.message
          : "統計の再集計に失敗しました。",
      );
      await refetch();
    } finally {
      setIsRebuilding(false);
      setProgress(null);
    }
  };

  if (!shouldFetch) {
    return (
      <Typography color="text.secondary">
        ログインユーザーの情報が取得できませんでした。
      </Typography>
    );
  }

  const loading = (isLoading || isFetching) && !snapshot;
  const errorMessage = isError ? resolveErrorMessage(error) : null;
  const snapshotErrorMessage =
    snapshot?.status === "FAILED" ? snapshot.errorMessage : null;
  const hasSnapshotData = Boolean(snapshot?.monthlySummaries?.length);

  return (
    <Stack spacing={2} sx={{ height: 1 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack spacing={0.5}>
          <PageTitle>稼働統計</PageTitle>
          <Typography variant="body2" color="text.secondary">
            {snapshot?.rangeStart && snapshot.rangeEnd
              ? `${formatRangeLabel(snapshot.rangeStart, snapshot.rangeEnd)} を集計期間として表示しています。`
              : "保存済みの集計結果を表示します。必要なときだけ手動で再集計してください。"}
          </Typography>
          {snapshot?.lastAggregatedAt ? (
            <Typography variant="body2" color="text.secondary">
              最終集計日時: {formatDateTimeLabel(snapshot.lastAggregatedAt)}
            </Typography>
          ) : null}
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Button
            variant="contained"
            onClick={() => void handleRebuild()}
            disabled={isRebuilding}
          >
            {isRebuilding ? "再集計中..." : "この年の統計を再集計"}
          </Button>
          <ButtonGroup variant="outlined" size="small">
            <Button
              onClick={() => setYear((prev) => prev - 1)}
              disabled={isRebuilding}
            >
              前年
            </Button>
            <Button disabled>{year}年</Button>
            <Button
              onClick={() => setYear((prev) => prev + 1)}
              disabled={isRebuilding}
            >
              翌年
            </Button>
          </ButtonGroup>
        </Stack>
      </Stack>

      {loading ? <LinearProgress aria-label="稼働統計を読み込み中" /> : null}

      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      {snapshotErrorMessage ? (
        <Alert severity="error">{snapshotErrorMessage}</Alert>
      ) : null}
      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

      {currentProgress ? (
        <ProgressPanel
          progressPercent={currentProgress.progressPercent}
          currentStepLabel={currentProgress.currentStepLabel}
          startedAt={currentProgress.startedAt}
          variantText={
            isRebuilding ? "統計を再集計しています" : "集計状態を表示しています"
          }
        />
      ) : null}

      {!isRebuilding && snapshot?.status === "RUNNING" ? (
        <Alert severity="warning">
          前回の手動集計が途中で中断された可能性があります。必要に応じて再集計を実行してください。
        </Alert>
      ) : null}

      {!hasSnapshotData &&
      !loading &&
      !errorMessage &&
      !snapshotErrorMessage &&
      !currentProgress ? (
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: { xs: 2, sm: 3 },
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="subtitle1">まだ統計が作成されていません</Typography>
            <Typography variant="body2" color="text.secondary">
              画面表示時のフルスキャンを避けるため、統計は保存済みスナップショットを表示します。
              まずは手動でこの年の統計を集計してください。
            </Typography>
          </Stack>
        </Paper>
      ) : null}

      {snapshot && hasSnapshotData ? <SnapshotSummary snapshot={snapshot} /> : null}
    </Stack>
  );
}
