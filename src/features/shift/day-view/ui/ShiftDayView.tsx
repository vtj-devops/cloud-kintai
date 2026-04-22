import { AuthContext } from "@app/providers/auth/AuthContext";
import { useLazyListRecentAttendancesQuery } from "@entities/attendance/api/attendanceApi";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import {
  Box,
  Chip,
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import type { Attendance, Rest } from "@shared/api/graphql/types";
import CommonBreadcrumbs from "@shared/ui/breadcrumbs/CommonBreadcrumbs";
import dayjs from "dayjs";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// 日付ごとの時間軸ビュー（デモ用のモック表示）
export default function ShiftDayView() {
  const { date } = useParams<{ date?: string }>();
  const navigate = useNavigate();
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { loading, error, staffs } = useStaffs({ isAuthenticated });
  const [triggerListAttendances] = useLazyListRecentAttendancesQuery();

  const target = useMemo(() => (date ? dayjs(date) : dayjs()), [date]);
  const dateKey = target.format("YYYY-MM-DD");
  const prevKey = target.subtract(1, "day").format("YYYY-MM-DD");
  const nextKey = target.add(1, "day").format("YYYY-MM-DD");
  const formattedDate = target.format("YYYY/MM/DD");

  const shiftStaffs = useMemo(
    () => staffs.filter((s) => s.workType === "shift"),
    [staffs]
  );

  // 出勤データがあればそれを利用し、なければ既存のモックを利用する
  const [attendanceMap, setAttendanceMap] = useState<
    Map<string, Attendance | null>
  >(new Map());

  useEffect(() => {
    let mounted = true;

    async function load() {
      const map = new Map<string, Attendance | null>();

      await Promise.all(
        shiftStaffs.map(async (s) => {
          try {
            const response = await triggerListAttendances({
              staffId: String(s.id),
            }).unwrap();

            const attendances = response.attendances ?? [];
            const matched =
              attendances.find((a) => a.workDate === dateKey) ?? null;
            map.set(s.id, matched);
          } catch {
            map.set(s.id, null);
          }
        })
      );

      if (mounted) {
        setAttendanceMap(map);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [shiftStaffs, dateKey, triggerListAttendances]);

  // モック: 各スタッフに対して安定した開始時刻・勤務時間・休憩を割り当てる（attendance が無い場合のフォールバック）
  const mockTimeRanges = useMemo(() => {
    const map = new Map<string, { start: number; end: number }>();
    shiftStaffs.forEach((s, idx) => {
      const attendance = attendanceMap.get(s.id);
      if (attendance && attendance.startTime && attendance.endTime) {
        // startTime/endTime は ISO 文字列の想定。時刻のみで扱うため hour を取り出す
        const start = dayjs(attendance.startTime).hour();
        const end = dayjs(attendance.endTime).hour();
        map.set(s.id, { start, end: Math.max(start + 1, end) });
        return;
      }

      // フォールバック: 9..13 開始、7..9 時間、18 時でクリップ
      const start = 9 + ((idx * 2) % 5); // 9..13
      const duration = 7 + (idx % 3); // 7..9 時間
      const end = Math.min(18, start + duration);
      map.set(s.id, { start, end });
    });
    return map;
  }, [shiftStaffs, attendanceMap]);

  // 休憩情報: attendance.rests があればそれを利用、無ければ簡易的な昼休みを割当
  const mockBreaks = useMemo(() => {
    const map = new Map<string, Array<{ start: number; end: number }>>();
    shiftStaffs.forEach((s, idx) => {
      const breaks: Array<{ start: number; end: number }> = [];
      const attendance = attendanceMap.get(s.id);
      if (
        attendance &&
        Array.isArray(attendance.rests) &&
        attendance.rests.length > 0
      ) {
        attendance.rests.filter(isRestWithTimes).forEach((rest) => {
          const rs = dayjs(rest.startTime).hour();
          const re = dayjs(rest.endTime).hour();
          breaks.push({ start: rs, end: Math.max(rs + 1, re) });
        });
      } else {
        // フォールバック: 基本の昼休み（勤務時間内に収まる場合のみ追加）
        const range = mockTimeRanges.get(s.id);
        if (range && range.start <= 12 && range.end >= 13) {
          breaks.push({ start: 12, end: 13 });
        }
        // まれに午後休憩
        if (idx % 4 === 2 && range && range.start <= 15 && range.end >= 16) {
          breaks.push({ start: 15, end: 16 });
        }
      }

      map.set(s.id, breaks);
    });
    return map;
  }, [shiftStaffs, mockTimeRanges, attendanceMap]);

  // 合計表示を x.xh のフォーマットにするユーティリティ
  const formatHours = (v: number | null | undefined) => {
    if (v === null || v === undefined) return "ー";
    return `${(Math.round(v * 10) / 10).toFixed(1)}h`;
  };

  // 表示ヘッダー: 24時間（0..23）を表示
  const hours = Array.from({ length: 24 }).map((_, i) => i);

  return (
    <Container sx={{ py: 3 }}>
      <Box sx={{ mb: 1 }}>
        <CommonBreadcrumbs
          items={[
            { label: "TOP", href: "/" },
            { label: "シフト管理", href: "/admin/shift" },
          ]}
          current={`シフト一覧(時間)`}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Chip
            label="前日"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/shift/day/${prevKey}`);
            }}
            clickable
          />

          <Typography
            sx={{ minWidth: 120, textAlign: "center", fontWeight: 500 }}
          >
            {formattedDate}
          </Typography>

          <Chip
            label="翌日"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/shift/day/${nextKey}`);
            }}
            clickable
          />
        </Box>
      </Box>

      {loading && <Typography>読み込み中...</Typography>}
      {error && (
        <Typography color="error">
          スタッフの取得中にエラーが発生しました
        </Typography>
      )}

      {!loading && !error && (
        <Box
          sx={{
            overflowX: "auto",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Table size="small" sx={{ minWidth: 160 + hours.length * 28 + 120 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    minWidth: 160,
                    bgcolor: "background.paper",
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                  }}
                >
                  スタッフ
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ minWidth: 80, bgcolor: "background.paper" }}
                >
                  勤務合計
                </TableCell>

                <TableCell
                  align="center"
                  sx={{ minWidth: 80, bgcolor: "background.paper" }}
                >
                  休憩合計
                </TableCell>
                {hours.map((h, i) => (
                  <TableCell
                    key={h}
                    align="center"
                    sx={(theme) => ({
                      width: 28,
                      p: 0,
                      borderLeft:
                        i === 0
                          ? "none"
                          : `1px dotted ${theme.palette.divider}`,
                    })}
                  >
                    <Box sx={{ fontSize: 12 }}>{h}</Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {shiftStaffs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={25}>
                    <Typography sx={{ py: 2 }}>
                      シフト勤務のスタッフは見つかりませんでした。
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {shiftStaffs.map((s) => {
                const range = mockTimeRanges.get(s.id);
                const breaksForStaff = mockBreaks.get(s.id) || [];
                const breaksDuration = breaksForStaff.reduce(
                  (acc, b) => acc + Math.max(0, b.end - b.start),
                  0
                );
                const workTotal = range
                  ? Math.max(0, range.end - range.start - breaksDuration)
                  : null;

                return (
                  <TableRow key={s.id} hover>
                    <TableCell
                      sx={{
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        bgcolor: "background.paper",
                        minWidth: 160,
                      }}
                    >
                      <Typography variant="body2">{`${s.familyName} ${s.givenName}`}</Typography>
                    </TableCell>

                    <TableCell align="center" sx={{ minWidth: 80 }}>
                      {formatHours(workTotal)}
                    </TableCell>

                    <TableCell align="center" sx={{ minWidth: 80 }}>
                      {formatHours(breaksDuration)}
                    </TableCell>

                    {hours.map((h, i) => {
                      const working = range
                        ? h >= range.start && h < range.end
                        : false;
                      const inBreak = breaksForStaff.some(
                        (b) => h >= b.start && h < b.end
                      );

                      // ツールチップ用にそのスタッフの勤務/休憩の区間を組み立てる
                      const segments: string[] = [];
                      if (range) {
                        // 集合的に勤務 - 休憩 を示すためにシンプルに前半/休憩/後半を作る
                        const b = breaksForStaff[0];
                        if (b && b.start > range.start) {
                          segments.push(
                            `${range.start}:00 - ${b.start}:00 (勤務)`
                          );
                          segments.push(`${b.start}:00 - ${b.end}:00 (休憩)`);
                          if (b.end < range.end) {
                            segments.push(
                              `${b.end}:00 - ${range.end}:00 (勤務)`
                            );
                          }
                        } else if (
                          b &&
                          b.start <= range.start &&
                          b.end < range.end
                        ) {
                          // 休憩が勤務開始直後など特殊ケース
                          segments.push(`${b.end}:00 - ${range.end}:00 (勤務)`);
                        } else {
                          segments.push(
                            `${range.start}:00 - ${range.end}:00 (勤務)`
                          );
                        }
                        // 追加の休憩があれば追記
                        if (breaksForStaff.length > 1) {
                          breaksForStaff.slice(1).forEach((bb) => {
                            segments.push(
                              `${bb.start}:00 - ${bb.end}:00 (休憩)`
                            );
                          });
                        }
                      }

                      const title =
                        segments.length > 0 ? segments.join(" / ") : "休み";

                      return (
                        <TableCell
                          key={h}
                          sx={(theme) => ({
                            p: 0,
                            width: 28,
                            height: 40,
                            borderLeft:
                              i === 0
                                ? "none"
                                : `1px dotted ${theme.palette.divider}`,
                          })}
                          align="center"
                        >
                          {working && !inBreak ? (
                            <Tooltip title={title}>
                              <Box
                                sx={{
                                  bgcolor: "primary.main",
                                  color: "primary.contrastText",
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              />
                            </Tooltip>
                          ) : inBreak ? (
                            <Tooltip title={title}>
                              <Box
                                sx={{
                                  bgcolor: "info.light",
                                  color: "text.primary",
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              />
                            </Tooltip>
                          ) : null}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
    </Container>
  );
}

const isRestWithTimes = (
  rest: Rest | null | undefined
): rest is Rest & { startTime: string; endTime: string } =>
  Boolean(rest?.startTime && rest?.endTime);
