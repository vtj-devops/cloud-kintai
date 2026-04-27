import InfoIcon from "@mui/icons-material/Info";
import LockIcon from "@mui/icons-material/Lock";
import {
  Alert,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { PageContent } from "@shared/ui/layout";
import Page from "@shared/ui/page/Page";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

// モックデータ型定義
interface MockUser {
  id: string;
  name: string;
  role: "admin" | "staff";
  color: string;
  editingCell?: string; // "staffId-dayKey" format
  status: "editing" | "viewing" | "idle";
}

interface MockShiftCell {
  state: "work" | "fixedOff" | "requestedOff" | "auto" | "empty";
  isLocked: boolean;
  lastChangedBy?: string;
  lastChangedAt?: string;
  history: Array<{
    timestamp: string;
    user: string;
    from: string;
    to: string;
  }>;
}

interface MockStaff {
  id: string;
  name: string;
  group: string;
}

// モックユーザー（接続中のユーザー）
const mockActiveUsers: MockUser[] = [
  {
    id: "user1",
    name: "管理者 (Taro)",
    role: "admin",
    color: "#1976d2",
    editingCell: "staff2-15",
    status: "editing",
  },
  {
    id: "user2",
    name: "Hanako",
    role: "staff",
    color: "#9c27b0",
    status: "viewing",
  },
  {
    id: "user3",
    name: "Jiro",
    role: "staff",
    color: "#f57c00",
    editingCell: "staff3-10",
    status: "editing",
  },
];

// モックスタッフリスト
const mockStaffs: MockStaff[] = [
  { id: "staff1", name: "山田 太郎", group: "グループA" },
  { id: "staff2", name: "鈴木 花子", group: "グループA" },
  { id: "staff3", name: "田中 次郎", group: "グループB" },
  { id: "staff4", name: "佐藤 美咲", group: "グループB" },
  { id: "staff5", name: "高橋 健太", group: "グループA" },
];

// シフト状態の表示設定
const shiftStateConfig = {
  work: { label: "○", color: "success.main", text: "出勤" },
  fixedOff: { label: "固", color: "error.main", text: "固定休" },
  requestedOff: { label: "希", color: "warning.main", text: "希望休" },
  auto: { label: "△", color: "info.main", text: "自動調整枠" },
  empty: { label: "-", color: "text.disabled", text: "未入力" },
};

// モックシフトデータ生成
const generateMockShiftData = (
  staffs: MockStaff[],
  daysInMonth: number,
): Map<string, Map<string, MockShiftCell>> => {
  const data = new Map<string, Map<string, MockShiftCell>>();

  staffs.forEach((staff) => {
    const staffData = new Map<string, MockShiftCell>();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = String(day).padStart(2, "0");
      // ランダムにシフト状態を設定（プロトタイプなので）
      const states: Array<MockShiftCell["state"]> = [
        "work",
        "fixedOff",
        "requestedOff",
        "auto",
        "empty",
      ];
      const randomState = states[Math.floor(Math.random() * states.length)];

      staffData.set(dayKey, {
        state: randomState,
        isLocked: day <= 10, // 1-10日は確定済みとする
        lastChangedBy: day % 3 === 0 ? "管理者" : staff.name,
        lastChangedAt:
          day <= 15
            ? dayjs()
                .subtract(daysInMonth - day, "day")
                .format("M/D HH:mm")
            : undefined,
        history: [],
      });
    }
    data.set(staff.id, staffData);
  });

  return data;
};

// 日ごとの人数集計
const calculateDailyCount = (
  shiftData: Map<string, Map<string, MockShiftCell>>,
  dayKey: string,
): { work: number; fixedOff: number; requestedOff: number; total: number } => {
  let work = 0;
  let fixedOff = 0;
  let requestedOff = 0;

  shiftData.forEach((staffData) => {
    const cell = staffData.get(dayKey);
    if (cell) {
      if (cell.state === "work") work++;
      else if (cell.state === "fixedOff") fixedOff++;
      else if (cell.state === "requestedOff") requestedOff++;
    }
  });

  return { work, fixedOff, requestedOff, total: work };
};

export default function ShiftCollaborativePrototype() {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const monthStart = useMemo(
    () => currentMonth.startOf("month"),
    [currentMonth],
  );
  const daysInMonth = monthStart.daysInMonth();

  // モックデータ生成
  const shiftData = useMemo(
    () => generateMockShiftData(mockStaffs, daysInMonth),
    [daysInMonth],
  );

  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth }).map((_, i) =>
        monthStart.add(i, "day"),
      ),
    [monthStart, daysInMonth],
  );

  // 進捗計算（モック）
  const progress = useMemo(() => {
    let confirmedCount = 0;
    let needsAdjustmentCount = 0;
    let emptyCount = 0;

    days.forEach((day) => {
      const dayKey = day.format("DD");
      const count = calculateDailyCount(shiftData, dayKey);

      if (day.date() <= 10) {
        confirmedCount++;
      } else if (count.work < 2) {
        needsAdjustmentCount++;
      } else if (count.work === 0) {
        emptyCount++;
      }
    });

    return {
      confirmed: confirmedCount,
      needsAdjustment: needsAdjustmentCount,
      empty: emptyCount,
      percentage: Math.round((confirmedCount / days.length) * 100),
    };
  }, [days, shiftData]);

  const handleCellClick = (_staffId: string, _dayKey: string) => {
    // プロトタイプなので実装予定
  };

  const prevMonth = () => setCurrentMonth((m) => m.subtract(1, "month"));
  const nextMonth = () => setCurrentMonth((m) => m.add(1, "month"));

  return (
    <Page title="シフト調整(共同) プロトタイプ" width="full">
      <PageContent width="wide" className="py-3">
        <Stack spacing={3}>
          {/* ヘッダーエリア */}
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="h5" fontWeight="bold">
                  シフト調整(共同)
                </Typography>

                {/* 接続状態・参加ユーザー */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Chip
                    label="接続中"
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                  <Tooltip
                    title={
                      <Stack spacing={0.5}>
                        {mockActiveUsers.map((user) => (
                          <Box key={user.id}>
                            <Typography variant="caption">
                              {user.name} -{" "}
                              {user.status === "editing" ? "編集中" : "閲覧中"}
                              {user.editingCell && ` (${user.editingCell})`}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    }
                  >
                    <AvatarGroup max={4}>
                      {mockActiveUsers.map((user) => (
                        <Avatar
                          key={user.id}
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: user.color,
                            fontSize: 14,
                          }}
                        >
                          {user.name.charAt(0)}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                  </Tooltip>
                </Box>
              </Box>

              <Alert severity="info" icon={<InfoIcon />}>
                これはプロトタイプです。実際のデータは使用されていません。
                UIとインタラクションの確認用です。
              </Alert>
            </Stack>
          </Paper>

          {/* ツールバーエリア */}
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button onClick={prevMonth} variant="outlined" size="small">
                  前月
                </Button>
                <Chip
                  label={monthStart.format("YYYY年 M月")}
                  sx={{ minWidth: 120 }}
                />
                <Button onClick={nextMonth} variant="outlined" size="small">
                  翌月
                </Button>
              </Box>

              {/* 進捗状況 */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    📊 {monthStart.format("YYYY年M月")} シフト状況
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    進捗: {progress.percentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress.percentage}
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Typography variant="caption">
                    ✓ 確定済み: {progress.confirmed}日
                  </Typography>
                  <Typography variant="caption" color="warning.main">
                    ⚠ 要調整: {progress.needsAdjustment}日
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ○ 未入力: {progress.empty}日
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* シフトテーブル */}
          <TableContainer component={Paper} sx={{ maxHeight: "70vh" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      bgcolor: "background.paper",
                      fontWeight: "bold",
                      minWidth: 160,
                      position: "sticky",
                      left: 0,
                      zIndex: 3,
                    }}
                  >
                    スタッフ
                  </TableCell>
                  {days.map((day) => {
                    const dayKey = day.format("DD");
                    const count = calculateDailyCount(shiftData, dayKey);
                    const isWeekend = day.day() === 0 || day.day() === 6;
                    const needsAttention = count.work < 2;

                    return (
                      <TableCell
                        key={dayKey}
                        align="center"
                        sx={{
                          bgcolor: needsAttention
                            ? alpha("#f44336", 0.1)
                            : isWeekend
                              ? alpha("#2196f3", 0.05)
                              : "background.paper",
                          minWidth: 60,
                          borderLeft:
                            day.date() === 1 ? "2px solid" : undefined,
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="caption" fontWeight="bold">
                          {day.format("D")}
                        </Typography>
                        <Typography variant="caption" display="block">
                          ({day.format("dd")})
                        </Typography>
                        {needsAttention && (
                          <Chip
                            label={`${count.work}人`}
                            size="small"
                            color="error"
                            sx={{ height: 16, fontSize: 10, mt: 0.5 }}
                          />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {mockStaffs.map((staff) => {
                  const staffShiftData = shiftData.get(staff.id);

                  return (
                    <TableRow key={staff.id} hover>
                      <TableCell
                        sx={{
                          fontWeight: "medium",
                          position: "sticky",
                          left: 0,
                          bgcolor: "background.paper",
                          zIndex: 1,
                        }}
                      >
                        <Typography variant="body2">{staff.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {staff.group}
                        </Typography>
                      </TableCell>
                      {days.map((day) => {
                        const dayKey = day.format("DD");
                        const cell = staffShiftData?.get(dayKey);
                        if (!cell) return <TableCell key={dayKey} />;

                        const config = shiftStateConfig[cell.state];
                        const cellKey = `${staff.id}-${dayKey}`;
                        const isBeingEdited = mockActiveUsers.some(
                          (u) => u.editingCell === cellKey,
                        );
                        const editingUser = mockActiveUsers.find(
                          (u) => u.editingCell === cellKey,
                        );

                        return (
                          <Tooltip
                            key={dayKey}
                            title={
                              <Stack spacing={0.5}>
                                <Typography variant="caption" fontWeight="bold">
                                  {day.format("M月D日 (dd)")}
                                </Typography>
                                <Typography variant="caption">
                                  現在: {config.text}
                                </Typography>
                                {cell.lastChangedBy && (
                                  <>
                                    <Typography
                                      variant="caption"
                                      sx={{ mt: 0.5, fontWeight: "bold" }}
                                    >
                                      変更履歴:
                                    </Typography>
                                    <Typography variant="caption">
                                      • {cell.lastChangedAt} -{" "}
                                      {cell.lastChangedBy}
                                      が変更
                                    </Typography>
                                  </>
                                )}
                                {cell.isLocked && (
                                  <Typography
                                    variant="caption"
                                    color="warning.main"
                                  >
                                    🔒 確定済み
                                  </Typography>
                                )}
                              </Stack>
                            }
                          >
                            <TableCell
                              onClick={() => handleCellClick(staff.id, dayKey)}
                              sx={{
                                textAlign: "center",
                                cursor: cell.isLocked
                                  ? "not-allowed"
                                  : "pointer",
                                position: "relative",
                                bgcolor: isBeingEdited
                                  ? alpha(editingUser!.color, 0.1)
                                  : "transparent",
                                "&:hover": {
                                  bgcolor: cell.isLocked
                                    ? alpha("#666", 0.05)
                                    : alpha("#1976d2", 0.08),
                                },
                              }}
                            >
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                sx={{ color: config.color }}
                              >
                                {config.label}
                              </Typography>
                              {cell.isLocked && (
                                <LockIcon
                                  sx={{
                                    position: "absolute",
                                    top: 2,
                                    right: 2,
                                    fontSize: 12,
                                    color: "text.disabled",
                                  }}
                                />
                              )}
                              {isBeingEdited && (
                                <Avatar
                                  sx={{
                                    position: "absolute",
                                    top: 2,
                                    right: 2,
                                    width: 16,
                                    height: 16,
                                    fontSize: 10,
                                    bgcolor: editingUser!.color,
                                  }}
                                >
                                  {editingUser!.name.charAt(0)}
                                </Avatar>
                              )}
                            </TableCell>
                          </Tooltip>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* フッターエリア */}
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  最終保存: {dayjs().format("YYYY/MM/DD HH:mm:ss")}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button variant="outlined" size="small" disabled>
                    キャンセル
                  </Button>
                  <Button variant="contained" size="small" disabled>
                    確定してロック
                  </Button>
                </Box>
              </Box>

              {/* 凡例 */}
              <Box>
                <Typography variant="caption" fontWeight="bold" gutterBottom>
                  凡例:
                </Typography>
                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                  {Object.entries(shiftStateConfig).map(([key, config]) => (
                    <Box
                      key={key}
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{ color: config.color }}
                      >
                        {config.label}
                      </Typography>
                      <Typography variant="caption">: {config.text}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* 最近の更新（モック） */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              🔔 最近の更新
            </Typography>
            <Stack spacing={1}>
              <Typography variant="caption">
                • 2分前: 管理者が 2/15 を確定
              </Typography>
              <Typography variant="caption">
                • 5分前: 鈴木 花子 が 2/10 を希望休に変更
              </Typography>
              <Typography variant="caption">
                • 10分前: 田中 次郎 が 2/22 を出勤に変更
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </PageContent>
    </Page>
  );
}
