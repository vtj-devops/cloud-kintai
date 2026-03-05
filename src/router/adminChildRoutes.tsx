import { RouteObject } from "react-router-dom";

import AdminShiftGuard from "../pages/admin/AdminShiftGuard";
import { createLazyRoute } from "./lazyRoute";

const AdminAttendanceRoute = createLazyRoute(
  () => import("../pages/admin/AdminAttendance"),
);
const AdminAttendanceEditorRoute = createLazyRoute(
  () => import("../pages/admin/AdminAttendanceEditor"),
);
const AdminAttendanceHistoryRoute = createLazyRoute(
  () => import("../pages/admin/AdminAttendanceHistory"),
);
const AdminAttendancePrintRoute = createLazyRoute(
  () => import("../pages/admin/AdminAttendancePrint"),
);
const AbsentRoute = createLazyRoute(
  () => import("@/features/admin/configManagement/ui/Absent"),
);
const AdminConfigManagementRoute = createLazyRoute(
  () => import("@/features/admin/configManagement/ui/AdminConfigManagement"),
);
const AmPmHolidayRoute = createLazyRoute(
  () => import("@/features/admin/configManagement/ui/AmPmHoliday"),
);
const LinksRoute = createLazyRoute(
  () => import("@/features/admin/configManagement/ui/Links"),
);
const AttendanceStatisticsRoute = createLazyRoute(
  () => import("@/features/admin/configManagement/ui/AttendanceStatistics"),
);
const OfficeModeRoute = createLazyRoute(
  () => import("@/features/admin/configManagement/ui/OfficeMode"),
);
const QuickInputRoute = createLazyRoute(
  () => import("@/features/admin/configManagement/ui/QuickInput"),
);
const ReasonsRoute = createLazyRoute(
  () => import("@/features/admin/configManagement/ui/Reasons"),
);
const SpecialHolidayRoute = createLazyRoute(
  () => import("@/features/admin/configManagement/ui/SpecialHoliday"),
);
const WorkingTimeRoute = createLazyRoute(
  () => import("@/features/admin/configManagement/ui/WorkingTime"),
);
const AdminDailyReportDetailRoute = createLazyRoute(
  () =>
    import("../pages/admin/AdminDailyReportManagement/AdminDailyReportDetail"),
);
const AdminDailyReportManagementRoute = createLazyRoute(
  () =>
    import("../pages/admin/AdminDailyReportManagement/AdminDailyReportManagement"),
);
const AdminHolidayCalendarRoute = createLazyRoute(
  () =>
    import("@/features/admin/holidayCalendar/ui/HolidayCalendar/AdminHolidayCalendar"),
);
const AdminLogsRoute = createLazyRoute(
  () => import("../pages/admin/AdminLogs/AdminLogsClean"),
);
const AdminMasterLayoutRoute = createLazyRoute(
  () => import("../pages/admin/AdminMasterLayout"),
);
const AdminShiftSettingsRoute = createLazyRoute(
  () => import("../pages/admin/AdminShiftSettings/AdminShiftSettings"),
);
const AdminWorkflowCategorySettingsRoute = createLazyRoute(
  () =>
    import("@/features/admin-config-workflow/AdminWorkflowCategorySettings"),
);
const AdminStaffRoute = createLazyRoute(
  () => import("@/features/admin/staff/ui/AdminStaff"),
);
const AdminStaffAttendanceListRoute = createLazyRoute(
  () =>
    import("@/features/admin/staffAttendanceList/ui/AdminStaffAttendanceList"),
);
const AdminStaffEditorRoute = createLazyRoute(
  () => import("@/features/admin/staff/ui/editor/AdminStaffEditor"),
);
const AdminThemeRoute = createLazyRoute(
  () => import("../pages/admin/AdminTheme/AdminTheme"),
);
const AdminWorkflowRoute = createLazyRoute(
  () => import("../pages/admin/AdminWorkflow/AdminWorkflow"),
);
const AdminWorkflowDetailRoute = createLazyRoute(
  () => import("../pages/admin/AdminWorkflow/AdminWorkflowDetail"),
);
const JobTermRoute = createLazyRoute(
  () => import("@/features/admin/jobTerm/ui/JobTerm"),
);
const ShiftPlanManagementRoute = createLazyRoute(
  () => import("../pages/admin/ShiftPlanManagement/ShiftPlanManagement"),
);
const ShiftDayViewRoute = createLazyRoute(
  () => import("../pages/shift/day-view"),
  {
    wrap: (node) => <AdminShiftGuard>{node}</AdminShiftGuard>,
  },
);
const ShiftManagementRoute = createLazyRoute(
  () => import("../pages/shift/management"),
  {
    wrap: (node) => <AdminShiftGuard>{node}</AdminShiftGuard>,
  },
);
const StaffShiftListRoute = createLazyRoute(
  () => import("../pages/shift/staff"),
  {
    wrap: (node) => <AdminShiftGuard>{node}</AdminShiftGuard>,
  },
);

export const adminChildRoutes: RouteObject[] = [
  {
    path: "staff",
    children: [
      {
        index: true,
        lazy: AdminStaffRoute,
      },
      {
        path: ":staffId",
        children: [
          {
            index: true,
            lazy: AdminStaffRoute,
          },
          {
            path: "attendance",
            lazy: AdminStaffAttendanceListRoute,
          },
          {
            path: "edit",
            lazy: AdminStaffEditorRoute,
          },
        ],
      },
    ],
  },
  {
    path: "attendances",
    children: [
      {
        index: true,
        lazy: AdminAttendanceRoute,
      },
      {
        path: ":targetWorkDate",
        lazy: AdminAttendanceRoute,
      },
      {
        path: "edit/:targetWorkDate/:staffId",
        lazy: AdminAttendanceEditorRoute,
      },
      {
        path: "history/:targetWorkDate/:staffId",
        lazy: AdminAttendanceHistoryRoute,
      },
      {
        path: "print",
        lazy: AdminAttendancePrintRoute,
      },
    ],
  },
  {
    path: "shift",
    lazy: ShiftManagementRoute,
  },
  {
    path: "shift/day/:date",
    lazy: ShiftDayViewRoute,
  },
  {
    path: "shift/:staffId",
    lazy: StaffShiftListRoute,
  },
  {
    path: "shift-plan",
    lazy: ShiftPlanManagementRoute,
  },
  {
    path: "master",
    lazy: AdminMasterLayoutRoute,
    children: [
      {
        index: true,
        lazy: JobTermRoute,
      },
      {
        path: "job_term",
        lazy: JobTermRoute,
      },
      {
        path: "holiday_calendar",
        lazy: AdminHolidayCalendarRoute,
      },
      {
        path: "theme",
        lazy: AdminThemeRoute,
      },
      {
        path: "shift",
        lazy: AdminShiftSettingsRoute,
      },
      {
        path: "workflow",
        lazy: AdminWorkflowCategorySettingsRoute,
      },
      {
        path: "feature_management",
        lazy: AdminConfigManagementRoute,
      },
      {
        path: "feature_management/working_time",
        lazy: WorkingTimeRoute,
      },
      {
        path: "feature_management/am_pm_holiday",
        lazy: AmPmHolidayRoute,
      },
      {
        path: "feature_management/office_mode",
        lazy: OfficeModeRoute,
      },
      {
        path: "feature_management/attendance_statistics",
        lazy: AttendanceStatisticsRoute,
      },
      {
        path: "feature_management/links",
        lazy: LinksRoute,
      },
      {
        path: "feature_management/reasons",
        lazy: ReasonsRoute,
      },
      {
        path: "feature_management/quick_input",
        lazy: QuickInputRoute,
      },
      {
        path: "feature_management/special_holiday",
        lazy: SpecialHolidayRoute,
      },
      {
        path: "feature_management/absent",
        lazy: AbsentRoute,
      },
    ],
  },
  {
    path: "workflow",
    children: [
      {
        index: true,
        lazy: AdminWorkflowRoute,
      },
      {
        path: ":id",
        lazy: AdminWorkflowDetailRoute,
      },
    ],
  },
  {
    path: "logs",
    lazy: AdminLogsRoute,
  },
  {
    path: "daily-report",
    children: [
      {
        index: true,
        lazy: AdminDailyReportManagementRoute,
      },
      {
        path: ":id",
        lazy: AdminDailyReportDetailRoute,
      },
    ],
  },
];
