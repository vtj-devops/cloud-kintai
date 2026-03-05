/**
 * @file Layout.tsx
 * @description アプリケーション全体のレイアウトを管理するコンポーネント。認証状態や各種設定・カレンダー情報の取得、コンテキストの提供を行う。
 */

import { useAuthenticator } from "@aws-amplify/ui-react";
import useAppConfig from "@entities/app-config/model/useAppConfig";
import useCloseDates from "@entities/attendance/model/useCloseDates";
import {
  useBulkCreateCompanyHolidayCalendarsMutation,
  useBulkCreateEventCalendarsMutation,
  useBulkCreateHolidayCalendarsMutation,
  useCreateCompanyHolidayCalendarMutation,
  useCreateEventCalendarMutation,
  useCreateHolidayCalendarMutation,
  useDeleteCompanyHolidayCalendarMutation,
  useDeleteEventCalendarMutation,
  useDeleteHolidayCalendarMutation,
  useGetCompanyHolidayCalendarsQuery,
  useGetEventCalendarsQuery,
  useGetHolidayCalendarsQuery,
  useUpdateCompanyHolidayCalendarMutation,
  useUpdateEventCalendarMutation,
  useUpdateHolidayCalendarMutation,
} from "@entities/calendar/api/calendarApi";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { Hub } from "aws-amplify/utils";
import dayjs from "dayjs";
import {
  ComponentProps,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { SplitViewProvider } from "@/features/splitView/context/SplitViewProvider";
import { createLogger } from "@/shared/lib/logger";
import { createAppTheme } from "@/shared/lib/theme";
import { AppShell } from "@/shared/ui/layout";
import SnackbarGroup from "@/widgets/feedback/snackbar/SnackbarGroup";
import Footer from "@/widgets/layout/footer/Footer";
import Header from "@/widgets/layout/header/Header";

import { AppConfigContext } from "./context/AppConfigContext";
import { AppContext } from "./context/AppContext";
import { AuthContext } from "./context/AuthContext";
import { ThemeContextProvider } from "./context/ThemeContext";
import useCognitoUser from "./hooks/useCognitoUser";
import { useDuplicateAttendanceWarning } from "./hooks/useDuplicateAttendanceWarning";

const logger = createLogger("Layout");

type MissingCloseDateAlertProps = {
  onConfirm: () => void;
};

function MissingCloseDateAlert({ onConfirm }: MissingCloseDateAlertProps) {
  const {
    closeDates,
    loading: closeDatesLoading,
    error: closeDatesError,
  } = useCloseDates();
  const [dismissed, setDismissed] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // ローディング完了を追跡
  useEffect(() => {
    if (!closeDatesLoading && !hasLoaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasLoaded(true);
    }
  }, [closeDatesLoading, hasLoaded]);

  const isCurrentDateCovered = useMemo(() => {
    const today = dayjs().startOf("day").valueOf();
    return closeDates.some((item) => {
      const start = dayjs(item.startDate).startOf("day").valueOf();
      const end = dayjs(item.endDate).startOf("day").valueOf();
      return today >= start && today <= end;
    });
  }, [closeDates]);

  // 派生状態として計算：データロード完了後、エラーがなく、却下されておらず、日付がカバーされていない場合のみ表示
  const open = useMemo(() => {
    if (!hasLoaded || closeDatesLoading || closeDatesError || dismissed)
      return false;
    return !isCurrentDateCovered;
  }, [
    hasLoaded,
    closeDatesLoading,
    closeDatesError,
    dismissed,
    isCurrentDateCovered,
  ]);

  const handleLater = useCallback(() => {
    setDismissed(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setDismissed(true);
    onConfirm();
  }, [onConfirm]);

  return (
    <Dialog open={open} onClose={handleLater} maxWidth="xs" fullWidth>
      <DialogTitle>集計対象月の未登録</DialogTitle>
      <DialogContent>
        <DialogContentText>
          現在日付を含む集計対象月が登録されていません。設定画面で登録を確認してください。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleLater}>あとで</Button>
        <Button variant="contained" onClick={handleConfirm}>
          確認する
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type AuthContextValue = ComponentProps<typeof AuthContext.Provider>["value"];
type AppConfigContextValue = ComponentProps<
  typeof AppConfigContext.Provider
>["value"];
type AppContextValue = ComponentProps<typeof AppContext.Provider>["value"];

type AppProvidersProps = {
  children: ReactNode;
  auth: AuthContextValue;
  config: AppConfigContextValue;
  app: AppContextValue;
};

function AppProviders({ children, auth, config, app }: AppProvidersProps) {
  return (
    <AuthContext.Provider value={auth}>
      <AppConfigContext.Provider value={config}>
        <AppContext.Provider value={app}>
          <SplitViewProvider>{children}</SplitViewProvider>
        </AppContext.Provider>
      </AppConfigContext.Provider>
    </AuthContext.Provider>
  );
}

/**
 * アプリケーションのレイアウトコンポーネント。
 * 認証状態や各種設定・カレンダー情報の取得、各種コンテキストの提供を行う。
 *
 * @returns レイアウト構造（ヘッダー・フッター・メイン・スナックバー等）を含むReact要素
 */
export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, authStatus } = useAuthenticator();
  const {
    cognitoUser,
    isCognitoUserRole,
    loading: cognitoUserLoading,
  } = useCognitoUser();

  // 重複勤怠データの警告をリッスン
  useDuplicateAttendanceWarning();

  const {
    fetchConfig,
    saveConfig,
    getStartTime,
    getEndTime,
    getConfigId,
    getLinks,
    getReasons,
    getOfficeMode,
    getQuickInputStartTimes,
    getQuickInputEndTimes,
    getShiftGroups,
    getLunchRestStartTime,
    getLunchRestEndTime,
    loading: appConfigLoading,
    getStandardWorkHours,
    getHourlyPaidHolidayEnabled,
    getAmHolidayStartTime,
    getAmHolidayEndTime,
    getPmHolidayStartTime,
    getPmHolidayEndTime,
    getAmPmHolidayEnabled,
    getSpecialHolidayEnabled,
    getAbsentEnabled,
    getWorkflowCategoryOrder,
    getAttendanceStatisticsEnabled,
    getThemeColor,
    getThemeTokens,
  } = useAppConfig();
  const isAuthenticated = authStatus === "authenticated";
  const { data: holidayCalendars = [], isLoading: holidayCalendarLoading } =
    useGetHolidayCalendarsQuery(undefined, { skip: !isAuthenticated });
  const {
    data: companyHolidayCalendars = [],
    isLoading: companyHolidayCalendarLoading,
  } = useGetCompanyHolidayCalendarsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: eventCalendars = [], isLoading: eventCalendarLoading } =
    useGetEventCalendarsQuery(undefined, { skip: !isAuthenticated });

  const [createHolidayCalendarMutation] = useCreateHolidayCalendarMutation();
  const [bulkCreateHolidayCalendarsMutation] =
    useBulkCreateHolidayCalendarsMutation();
  const [updateHolidayCalendarMutation] = useUpdateHolidayCalendarMutation();
  const [deleteHolidayCalendarMutation] = useDeleteHolidayCalendarMutation();

  const [createCompanyHolidayCalendarMutation] =
    useCreateCompanyHolidayCalendarMutation();
  const [bulkCreateCompanyHolidayCalendarsMutation] =
    useBulkCreateCompanyHolidayCalendarsMutation();
  const [updateCompanyHolidayCalendarMutation] =
    useUpdateCompanyHolidayCalendarMutation();
  const [deleteCompanyHolidayCalendarMutation] =
    useDeleteCompanyHolidayCalendarMutation();

  const [createEventCalendarMutation] = useCreateEventCalendarMutation();
  const [bulkCreateEventCalendarsMutation] =
    useBulkCreateEventCalendarsMutation();
  const [updateEventCalendarMutation] = useUpdateEventCalendarMutation();
  const [deleteEventCalendarMutation] = useDeleteEventCalendarMutation();

  const createHolidayCalendar = useCallback(
    async (input: Parameters<typeof createHolidayCalendarMutation>[0]) => {
      const result = await createHolidayCalendarMutation(input).unwrap();
      return result;
    },
    [createHolidayCalendarMutation],
  );

  const bulkCreateHolidayCalendar = useCallback(
    async (
      inputs: Parameters<typeof bulkCreateHolidayCalendarsMutation>[0],
    ) => {
      const result = await bulkCreateHolidayCalendarsMutation(inputs).unwrap();
      return result;
    },
    [bulkCreateHolidayCalendarsMutation],
  );

  const updateHolidayCalendar = useCallback(
    async (input: Parameters<typeof updateHolidayCalendarMutation>[0]) => {
      const result = await updateHolidayCalendarMutation(input).unwrap();
      return result;
    },
    [updateHolidayCalendarMutation],
  );

  const deleteHolidayCalendar = useCallback(
    async (input: Parameters<typeof deleteHolidayCalendarMutation>[0]) => {
      await deleteHolidayCalendarMutation(input).unwrap();
    },
    [deleteHolidayCalendarMutation],
  );

  const createCompanyHolidayCalendar = useCallback(
    async (
      input: Parameters<typeof createCompanyHolidayCalendarMutation>[0],
    ) => {
      const result = await createCompanyHolidayCalendarMutation(input).unwrap();
      return result;
    },
    [createCompanyHolidayCalendarMutation],
  );

  const bulkCreateCompanyHolidayCalendar = useCallback(
    async (
      inputs: Parameters<typeof bulkCreateCompanyHolidayCalendarsMutation>[0],
    ) => {
      const result =
        await bulkCreateCompanyHolidayCalendarsMutation(inputs).unwrap();
      return result;
    },
    [bulkCreateCompanyHolidayCalendarsMutation],
  );

  const updateCompanyHolidayCalendar = useCallback(
    async (
      input: Parameters<typeof updateCompanyHolidayCalendarMutation>[0],
    ) => {
      const result = await updateCompanyHolidayCalendarMutation(input).unwrap();
      return result;
    },
    [updateCompanyHolidayCalendarMutation],
  );

  const deleteCompanyHolidayCalendar = useCallback(
    async (
      input: Parameters<typeof deleteCompanyHolidayCalendarMutation>[0],
    ) => {
      const result = await deleteCompanyHolidayCalendarMutation(input).unwrap();
      return result;
    },
    [deleteCompanyHolidayCalendarMutation],
  );

  const createEventCalendar = useCallback(
    async (input: Parameters<typeof createEventCalendarMutation>[0]) => {
      const result = await createEventCalendarMutation(input).unwrap();
      return result;
    },
    [createEventCalendarMutation],
  );

  const bulkCreateEventCalendar = useCallback(
    async (inputs: Parameters<typeof bulkCreateEventCalendarsMutation>[0]) => {
      const result = await bulkCreateEventCalendarsMutation(inputs).unwrap();
      return result;
    },
    [bulkCreateEventCalendarsMutation],
  );

  const updateEventCalendar = useCallback(
    async (input: Parameters<typeof updateEventCalendarMutation>[0]) => {
      const result = await updateEventCalendarMutation(input).unwrap();
      return result;
    },
    [updateEventCalendarMutation],
  );

  const deleteEventCalendar = useCallback(
    async (input: Parameters<typeof deleteEventCalendarMutation>[0]) => {
      await deleteEventCalendarMutation(input).unwrap();
    },
    [deleteEventCalendarMutation],
  );

  const isAdminUser = useMemo(
    () => isCognitoUserRole(StaffRole.ADMIN),
    [isCognitoUserRole],
  );

  const isLoginRoute = location.pathname === "/login";

  // Handle authentication errors, especially token expiration
  useEffect(() => {
    const handleTokenRefreshFailure = async () => {
      try {
        await signOut();
      } catch (error) {
        logger.error("Failed to sign out after token refresh failure", error);
      } finally {
        navigate("/login");
      }
    };

    const hubListenerCancelToken = Hub.listen("auth", (data) => {
      const { payload } = data;

      if (payload.event === "tokenRefresh_failure") {
        logger.error("Token refresh failed", payload.data);
        void handleTokenRefreshFailure();
      }
    });

    return () => {
      hubListenerCancelToken();
    };
  }, [signOut, navigate]);

  useEffect(() => {
    if (isLoginRoute) {
      return;
    }

    if (authStatus === "configuring") {
      return;
    }

    if (authStatus === "unauthenticated") {
      navigate("/login");
      return;
    }

    if (authStatus !== "authenticated") {
      return;
    }

    if (cognitoUserLoading || !cognitoUser) {
      return;
    }

    if (cognitoUser.emailVerified) {
      return;
    }

    alert(
      "メール認証が完了していません。ログイン時にメール認証を行なってください。",
    );

    try {
      void signOut();
    } catch (error) {
      logger.error("Failed to sign out:", error);
    }
  }, [
    authStatus,
    cognitoUser,
    cognitoUserLoading,
    isLoginRoute,
    navigate,
    signOut,
  ]);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const authContextValue = useMemo(
    () => ({
      signOut,
      signIn: () => navigate("/login"),
      isCognitoUserRole,
      user,
      authStatus,
      cognitoUser,
    }),
    [signOut, navigate, isCognitoUserRole, user, authStatus, cognitoUser],
  );

  const appConfigContextValue = useMemo(
    () => ({
      fetchConfig,
      saveConfig,
      getStartTime,
      getEndTime,
      getStandardWorkHours,
      getConfigId,
      getLinks,
      getReasons,
      getOfficeMode,
      getQuickInputStartTimes,
      getQuickInputEndTimes,
      getShiftGroups,
      getLunchRestStartTime,
      getLunchRestEndTime,
      getHourlyPaidHolidayEnabled,
      getAmHolidayStartTime,
      getAmHolidayEndTime,
      getPmHolidayStartTime,
      getPmHolidayEndTime,
      getAmPmHolidayEnabled,
      getSpecialHolidayEnabled,
      getAbsentEnabled,
      getWorkflowCategoryOrder,
      getAttendanceStatisticsEnabled,
      getThemeColor,
      getThemeTokens,
    }),
    [
      fetchConfig,
      saveConfig,
      getStartTime,
      getEndTime,
      getStandardWorkHours,
      getConfigId,
      getLinks,
      getReasons,
      getOfficeMode,
      getQuickInputStartTimes,
      getQuickInputEndTimes,
      getShiftGroups,
      getLunchRestStartTime,
      getLunchRestEndTime,
      getHourlyPaidHolidayEnabled,
      getAmHolidayStartTime,
      getAmHolidayEndTime,
      getPmHolidayStartTime,
      getPmHolidayEndTime,
      getAmPmHolidayEnabled,
      getSpecialHolidayEnabled,
      getAbsentEnabled,
      getWorkflowCategoryOrder,
      getAttendanceStatisticsEnabled,
      getThemeColor,
      getThemeTokens,
    ],
  );

  const appContextValue = useMemo(
    () => ({
      holidayCalendars,
      companyHolidayCalendars,
      eventCalendars,
      createHolidayCalendar,
      bulkCreateHolidayCalendar,
      updateHolidayCalendar,
      deleteHolidayCalendar,
      createCompanyHolidayCalendar,
      bulkCreateCompanyHolidayCalendar,
      updateCompanyHolidayCalendar,
      deleteCompanyHolidayCalendar,
      createEventCalendar,
      bulkCreateEventCalendar,
      updateEventCalendar,
      deleteEventCalendar,
    }),
    [
      holidayCalendars,
      companyHolidayCalendars,
      eventCalendars,
      createHolidayCalendar,
      bulkCreateHolidayCalendar,
      updateHolidayCalendar,
      deleteHolidayCalendar,
      createCompanyHolidayCalendar,
      bulkCreateCompanyHolidayCalendar,
      updateCompanyHolidayCalendar,
      deleteCompanyHolidayCalendar,
      createEventCalendar,
      bulkCreateEventCalendar,
      updateEventCalendar,
      deleteEventCalendar,
    ],
  );

  const configuredThemeColor = useMemo(
    () => (typeof getThemeColor === "function" ? getThemeColor() : undefined),
    [getThemeColor],
  );

  const appTheme = useMemo(
    () => createAppTheme(configuredThemeColor),
    [configuredThemeColor],
  );

  const shouldBlockUnauthenticated =
    authStatus === "unauthenticated" && !isLoginRoute;

  if (
    authStatus === "configuring" ||
    cognitoUserLoading ||
    appConfigLoading ||
    holidayCalendarLoading ||
    companyHolidayCalendarLoading ||
    eventCalendarLoading ||
    shouldBlockUnauthenticated
  ) {
    return (
      <ThemeContextProvider>
        <ThemeProvider theme={appTheme}>
          <LinearProgress data-testid="layout-linear-progress" />
        </ThemeProvider>
      </ThemeContextProvider>
    );
  }

  return (
    <ThemeContextProvider>
      <ThemeProvider theme={appTheme}>
        <AppProviders
          auth={authContextValue}
          config={appConfigContextValue}
          app={appContextValue}
        >
          <AppShell
            header={<Header />}
            main={<Outlet />}
            footer={<Footer />}
            snackbar={<SnackbarGroup />}
            slotProps={{
              root: { "data-testid": "layout-stack" },
              header: { "data-testid": "layout-header" },
              main: { "data-testid": "layout-main" },
              footer: { "data-testid": "layout-footer" },
              snackbar: { "data-testid": "layout-snackbar" },
            }}
          />
          {isAdminUser && (
            <MissingCloseDateAlert
              onConfirm={() => navigate("/admin/master/job_term")}
            />
          )}
        </AppProviders>
      </ThemeProvider>
    </ThemeContextProvider>
  );
}
