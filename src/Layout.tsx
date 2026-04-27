/**
 * @file Layout.tsx
 * @description アプリケーション全体のレイアウトを管理するコンポーネント。認証状態に応じた遷移制御とシェル描画を担う。
 */

import { useSession } from "@app/providers/session/useSession";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import useCloseDates from "@entities/attendance/model/useCloseDates";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import { createLogger } from "@shared/lib/logger";
import { AppButton } from "@shared/ui/button";
import AppDialog from "@shared/ui/feedback/AppDialog";
import { FullPageLoading } from "@shared/ui/feedback/LoadingPrimitives";
import { AppShell } from "@shared/ui/layout";
import { Hub } from "aws-amplify/utils";
import dayjs from "dayjs";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { scheduleIdleRoutePreload } from "@/router/routePreloaders";
import NotificationViewport from "@/widgets/feedback/notification/NotificationViewport";
import Footer from "@/widgets/layout/footer/Footer";
import Header from "@/widgets/layout/header/Header";

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
    <AppDialog
      open={open}
      onClose={handleLater}
      title="集計対象月の未登録"
      description="現在日付を含む集計対象月が登録されていません。設定画面で登録を確認してください。"
      maxWidth="xs"
      actions={
        <>
          <AppButton variant="outline" tone="neutral" onClick={handleLater}>
            あとで
          </AppButton>
          <AppButton variant="solid" onClick={handleConfirm}>
            確認する
          </AppButton>
        </>
      }
    />
  );
}

/**
 * アプリケーションのレイアウトコンポーネント。
 * 認証状態や各種設定に応じたナビゲーションとレイアウト描画を行う。
 *
 * @returns レイアウト構造（ヘッダー・フッター・メイン・スナックバー等）を含むReact要素
 */
export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signOut,
    authStatus,
    cognitoUser,
    isLoading: sessionLoading,
    hasRole,
  } = useSession();
  const { config: appConfig, isConfigLoading = false } =
    useContext(AppConfigContext);
  const cognitoUserLoading = sessionLoading;

  useEffect(() => {
    if (authStatus !== "authenticated" || cognitoUserLoading) {
      return;
    }

    scheduleIdleRoutePreload({
      currentPathname: location.pathname,
      isAdminUser: hasRole(StaffRole.ADMIN) || hasRole(StaffRole.STAFF_ADMIN),
      isOperatorUser: hasRole(StaffRole.OPERATOR),
    });
  }, [authStatus, cognitoUserLoading, hasRole, location.pathname]);

  const isAdminUser = useMemo(
    () => hasRole(StaffRole.ADMIN),
    [hasRole],
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
      navigate("/login", {
        replace: true,
        state: {
          from: `${location.pathname}${location.search}${location.hash}`,
        },
      });
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
    location.hash,
    isLoginRoute,
    location.pathname,
    location.search,
    navigate,
    signOut,
  ]);

  const shouldBlockUnauthenticated =
    authStatus === "unauthenticated" && !isLoginRoute;
  const shouldBlockAppConfigBootstrap =
    authStatus === "authenticated" && isConfigLoading && !appConfig;

  const shouldBlockLayoutBootstrap =
    authStatus === "configuring" ||
    cognitoUserLoading ||
    shouldBlockUnauthenticated ||
    shouldBlockAppConfigBootstrap;

  if (shouldBlockLayoutBootstrap) {
    return <FullPageLoading message="画面を更新しています..." />;
  }

  return (
    <>
      <AppShell
        header={<Header />}
        main={<Outlet />}
        footer={<Footer />}
        slotProps={{
          root: { "data-testid": "layout-stack" },
          header: { "data-testid": "layout-header" },
          main: { "data-testid": "layout-main" },
          footer: { "data-testid": "layout-footer" },
        }}
      />
      <NotificationViewport />
      {isAdminUser && (
        <MissingCloseDateAlert
          onConfirm={() => navigate("/admin/master/job_term")}
        />
      )}
    </>
  );
}
