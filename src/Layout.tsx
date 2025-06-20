import { useAuthenticator } from "@aws-amplify/ui-react";
import { Box, LinearProgress, Stack } from "@mui/material";

import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useCallback, useMemo } from "react";

import { AuthContext } from "./context/AuthContext";
import SnackbarGroup from "./components/ snackbar/SnackbarGroup";
import Footer from "./components/footer/Footer";
import Header from "./components/header/Header";
import useCognitoUser from "./hooks/useCognitoUser";
import useAppConfig from "./hooks/useAppConfig/useAppConfig";
import { AppConfigContext } from "./context/AppConfigContext";
import useHolidayCalendar from "./hooks/useHolidayCalendars/useHolidayCalendars";
import useCompanyHolidayCalendar from "./hooks/useCompanyHolidayCalendars/useCompanyHolidayCalendars";
import { AppContext } from "./context/AppContext";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation(); // useLocationを使用
  const { user, signOut, authStatus } = useAuthenticator();
  const {
    cognitoUser,
    isCognitoUserRole,
    loading: cognitoUserLoading,
  } = useCognitoUser();
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
    getLunchRestStartTime,
    getLunchRestEndTime,
    loading: appConfigLoading,
  } = useAppConfig();
  const {
    fetchAllHolidayCalendars,
    createHolidayCalendar,
    bulkCreateHolidayCalendar,
    updateHolidayCalendar,
    deleteHolidayCalendar,
    holidayCalendars,
    loading: holidayCalendarLoading,
  } = useHolidayCalendar();
  const {
    fetchAllCompanyHolidayCalendars,
    companyHolidayCalendars,
    loading: companyHolidayCalendarLoading,
    createCompanyHolidayCalendar,
    bulkCreateCompanyHolidayCalendar,
    updateCompanyHolidayCalendar,
    deleteCompanyHolidayCalendar,
  } = useCompanyHolidayCalendar();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname === "/login") return;

    if (authStatus === "unauthenticated") {
      navigate("/login");
      return;
    }

    if (authStatus !== "authenticated") {
      fetchAllHolidayCalendars();
      fetchAllCompanyHolidayCalendars();
      return;
    }

    const isMailVerified = user?.attributes?.email_verified ? true : false;
    if (isMailVerified) return;

    alert(
      "メール認証が完了していません。ログイン時にメール認証を行なってください。"
    );

    try {
      void signOut();
    } catch (error) {
      console.error(error);
    }
  }, [authStatus, user, window.location.href]);

  const setCookie = useCallback(
    (name: string, value: string, minutes: number) => {
      const expires = new Date(Date.now() + minutes * 60 * 1000).toUTCString();
      document.cookie = `${name}=${value}; expires=${expires}; path=/`;
    },
    []
  );

  const getCookie = useCallback((name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
  }, []);

  const fetchConfigWithCookie = useCallback(() => {
    const cookieName = "configLastFetchTime";
    const lastFetchTime = getCookie(cookieName);

    if (lastFetchTime) {
      return;
    }

    setCookie(cookieName, "config_fetched", 2);
    fetchConfig();
  }, [getCookie, setCookie, fetchConfig]);

  const fetchHolidayCalendarsWithCookie = useCallback(() => {
    const cookieName = "holidayCalendarsLastFetchTime";
    const lastFetchTime = getCookie(cookieName);

    if (lastFetchTime) {
      return;
    }

    setCookie(cookieName, "holiday_calendars_fetched", 2);
    fetchAllHolidayCalendars();
  }, [getCookie, setCookie, fetchAllHolidayCalendars]);

  const fetchCompanyHolidayCalendarsWithCookie = useCallback(() => {
    const cookieName = "companyHolidayCalendarsLastFetchTime";
    const lastFetchTime = getCookie(cookieName);

    if (lastFetchTime) {
      return;
    }

    setCookie(cookieName, "company_holiday_calendars_fetched", 2);
    fetchAllCompanyHolidayCalendars();
  }, [getCookie, setCookie, fetchAllCompanyHolidayCalendars]);

  useEffect(() => {
    fetchConfigWithCookie();
    fetchHolidayCalendarsWithCookie();
    fetchCompanyHolidayCalendarsWithCookie();
  }, [
    fetchConfigWithCookie,
    fetchHolidayCalendarsWithCookie,
    fetchCompanyHolidayCalendarsWithCookie,
  ]);

  const authContextValue = useMemo(
    () => ({
      signOut,
      signIn: () => navigate("/login"),
      isCognitoUserRole,
      user,
      authStatus,
      cognitoUser,
    }),
    [signOut, navigate, isCognitoUserRole, user, authStatus, cognitoUser]
  );

  const appConfigContextValue = useMemo(
    () => ({
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
      getLunchRestStartTime,
      getLunchRestEndTime,
    }),
    [
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
      getLunchRestStartTime,
      getLunchRestEndTime,
    ]
  );

  const appContextValue = useMemo(
    () => ({
      holidayCalendars,
      companyHolidayCalendars,
      createHolidayCalendar,
      bulkCreateHolidayCalendar,
      updateHolidayCalendar,
      deleteHolidayCalendar,
      createCompanyHolidayCalendar,
      bulkCreateCompanyHolidayCalendar,
      updateCompanyHolidayCalendar,
      deleteCompanyHolidayCalendar,
    }),
    [
      holidayCalendars,
      companyHolidayCalendars,
      createHolidayCalendar,
      bulkCreateHolidayCalendar,
      updateHolidayCalendar,
      deleteHolidayCalendar,
      createCompanyHolidayCalendar,
      bulkCreateCompanyHolidayCalendar,
      updateCompanyHolidayCalendar,
      deleteCompanyHolidayCalendar,
    ]
  );

  if (
    cognitoUserLoading ||
    appConfigLoading ||
    holidayCalendarLoading ||
    companyHolidayCalendarLoading
  ) {
    return <LinearProgress />;
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <AppConfigContext.Provider value={appConfigContextValue}>
        <AppContext.Provider value={appContextValue}>
          <Stack sx={{ height: "100vh" }}>
            <Box>
              <Header />
            </Box>
            <Box sx={{ flexGrow: 2 }}>
              <Outlet />
            </Box>
            <Box>
              <Footer />
            </Box>
            <SnackbarGroup />
          </Stack>
        </AppContext.Provider>
      </AppConfigContext.Provider>
    </AuthContext.Provider>
  );
}
