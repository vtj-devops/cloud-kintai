import {
  Alert,
  Box,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Attendance } from "@shared/api/graphql/types";
import dayjs, { type Dayjs } from "dayjs";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AttendanceDate } from "@/entities/attendance/lib/AttendanceDate";
import { AttendanceGraph } from "@/entities/attendance/ui/adminStaffAttendance/AttendanceGraph";
import { useAdminStaffAttendanceListViewModel } from "@/features/admin/staffAttendanceList/model";
import {
  ChangeRequestQuickViewDialog,
  pendingAttendanceContainerSx,
  PendingAttendanceSection,
} from "@/features/admin/staffAttendanceList/ui/components";
import DesktopCalendarView from "@/features/attendance/list/ui/DesktopCalendarView";
import MobileCalendar from "@/features/attendance/list/ui/MobileList/MobileCalendar";
import { useSplitView } from "@/features/splitView";
import { designTokenVar } from "@/shared/designSystem";
import { PageSection } from "@/shared/ui/layout";

const PAGE_PADDING_X = {
  xs: designTokenVar("spacing.lg", "16px"),
  md: designTokenVar("spacing.xxl", "32px"),
};

const PAGE_PADDING_Y = {
  xs: designTokenVar("spacing.xl", "24px"),
  md: designTokenVar("spacing.xxl", "32px"),
};

const PAGE_SECTION_GAP = designTokenVar("spacing.xl", "24px");
const SECTION_CONTENT_GAP = designTokenVar("spacing.md", "12px");

export default function AdminStaffAttendanceList() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const { enableSplitMode, setRightPanel } = useSplitView();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));

  const {
    staff,
    holidayCalendars,
    companyHolidayCalendars,
    calendarLoading,
    closeDates,
    closeDatesLoading,
    closeDatesError,
    attendances,
    duplicateAttendances,
    attendanceLoading,
    attendancesError,
    pendingAttendances,
    changeRequestControls,
    pendingAttendanceControls,
    getTableRowVariant,
    getBadgeContent,
  } = useAdminStaffAttendanceListViewModel(staffId, currentMonth);

  const monthlyAttendances = useMemo(() => {
    return attendances
      .filter((attendance: Attendance) =>
        attendance.workDate
          ? dayjs(attendance.workDate).isSame(currentMonth, "month")
          : false,
      )
      .toSorted((a: Attendance, b: Attendance) => {
        const aValue = a.workDate ? dayjs(a.workDate).valueOf() : 0;
        const bValue = b.workDate ? dayjs(b.workDate).valueOf() : 0;
        return aValue - bValue;
      });
  }, [attendances, currentMonth]);

  const {
    quickViewAttendance,
    quickViewChangeRequest,
    quickViewOpen,
    handleCloseQuickView,
  } = changeRequestControls;

  const handleEdit = useCallback(
    (attendance: Attendance) => {
      if (!staffId) return;
      const workDate = dayjs(attendance.workDate).format(
        AttendanceDate.QueryParamFormat,
      );
      navigate(`/admin/attendances/edit/${workDate}/${staffId}`);
    },
    [navigate, staffId],
  );

  const handleOpenInRightPanel = useCallback(
    (attendance: Attendance | undefined, _date: Dayjs) => {
      if (!staffId || !attendance) return;
      const workDate = dayjs(attendance.workDate).format(
        AttendanceDate.QueryParamFormat,
      );
      enableSplitMode();
      setRightPanel({
        id: `attendance-${workDate}`,
        title: `勤怠編集 - ${dayjs(attendance.workDate).format("YYYY/MM/DD")}`,
        route: `/admin/attendances/edit/${workDate}/${staffId}`,
      });
    },
    [staffId, enableSplitMode, setRightPanel],
  );

  const buildCalendarNavigatePath = useCallback(
    (formattedWorkDate: string) => {
      if (!staffId) {
        return "/admin/attendances";
      }
      return `/admin/attendances/edit/${formattedWorkDate}/${staffId}`;
    },
    [staffId],
  );

  const renderStandaloneSection = (content: ReactNode) => (
    <Stack
      component="section"
      sx={{
        flex: 1,
        width: "100%",
        boxSizing: "border-box",
        px: PAGE_PADDING_X,
        py: PAGE_PADDING_Y,
      }}
    >
      <PageSection variant="surface" layoutVariant="dashboard">
        {content}
      </PageSection>
    </Stack>
  );

  const isCalendarCompact = isMobile;

  // エラーがある場合は、エラーメッセージが既にsnackbarで表示されているため、
  // データが存在する場合は表示を続ける
  if (attendancesError && attendances.length === 0) {
    // データが全く取得できなかった場合のみエラーUIを表示
    return renderStandaloneSection(
      <Typography>
        勤怠データの読み込みに失敗しました。エラーメッセージをご確認ください。
      </Typography>,
    );
  }

  // staffIdがない場合のみエラーとする（staffがnullでもattendancesがあれば表示）
  if (!staffId) {
    return renderStandaloneSection(
      <Typography>データ取得中に何らかの問題が発生しました</Typography>,
    );
  }

  if (attendanceLoading || calendarLoading) {
    return renderStandaloneSection(<LinearProgress />);
  }

  return (
    <>
      <Stack
        component="section"
        sx={{
          flex: 1,
          width: "100%",
          boxSizing: "border-box",
          px: PAGE_PADDING_X,
          py: PAGE_PADDING_Y,
          gap: PAGE_SECTION_GAP,
        }}
      >
        {duplicateAttendances.length > 0 && (
          <PageSection
            variant="surface"
            layoutVariant="dashboard"
            sx={{ gap: SECTION_CONTENT_GAP }}
          >
            <Alert severity="warning">
              重複データが検出されたスタッフです。データ統合を実施してください。
            </Alert>
            <Table size="small" aria-label="duplicate-attendance-table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "30%" }}>対象日</TableCell>
                  <TableCell sx={{ width: "20%" }}>重複件数</TableCell>
                  <TableCell>レコードID一覧</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {duplicateAttendances.map((duplicate) => (
                  <TableRow
                    key={`${duplicate.workDate}-${duplicate.ids.join("-")}`}
                  >
                    <TableCell>
                      {duplicate.workDate
                        ? dayjs(duplicate.workDate).format("YYYY/MM/DD")
                        : "-"}
                    </TableCell>
                    <TableCell>{duplicate.ids.length}</TableCell>
                    <TableCell>{duplicate.ids.join(", ") || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </PageSection>
        )}

        {pendingAttendances.length > 0 && (
          <PageSection
            variant="surface"
            layoutVariant="dashboard"
            sx={{ gap: SECTION_CONTENT_GAP }}
          >
            <Box sx={pendingAttendanceContainerSx}>
              <PendingAttendanceSection
                attendances={pendingAttendances}
                staff={staff}
                holidayCalendars={holidayCalendars}
                companyHolidayCalendars={companyHolidayCalendars}
                changeRequestControls={pendingAttendanceControls}
                onEdit={handleEdit}
                getBadgeContent={getBadgeContent}
                getRowVariant={getTableRowVariant}
              />
            </Box>
          </PageSection>
        )}

        <PageSection variant="surface" layoutVariant="dashboard">
          <Box sx={{ width: "100%" }}>
            {isCalendarCompact ? (
              <MobileCalendar
                attendances={attendances}
                staff={staff}
                holidayCalendars={holidayCalendars}
                companyHolidayCalendars={companyHolidayCalendars}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                closeDates={closeDates}
                buildNavigatePath={buildCalendarNavigatePath}
              />
            ) : (
              <DesktopCalendarView
                attendances={attendances}
                staff={staff}
                holidayCalendars={holidayCalendars}
                companyHolidayCalendars={companyHolidayCalendars}
                navigate={navigate}
                buildNavigatePath={buildCalendarNavigatePath}
                closeDates={closeDates}
                closeDatesLoading={closeDatesLoading}
                closeDatesError={closeDatesError}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                onOpenInRightPanel={handleOpenInRightPanel}
              />
            )}
          </Box>
        </PageSection>

        <PageSection
          variant="surface"
          layoutVariant="dashboard"
          sx={{ gap: SECTION_CONTENT_GAP }}
        >
          <AttendanceGraph
            attendances={monthlyAttendances}
            month={currentMonth}
          />
        </PageSection>
      </Stack>
      <ChangeRequestQuickViewDialog
        open={quickViewOpen}
        attendance={quickViewAttendance}
        changeRequest={quickViewChangeRequest}
        onClose={handleCloseQuickView}
      />
    </>
  );
}
