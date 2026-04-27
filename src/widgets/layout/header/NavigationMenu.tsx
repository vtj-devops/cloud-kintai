import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { isShiftWorkType } from "@entities/staff/lib/workTypeOptions";
import {
  StaffRole,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import DescriptionIcon from "@mui/icons-material/Description";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ViewListIcon from "@mui/icons-material/ViewList";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import DesktopMenuView, {
  DesktopMenuItem,
} from "@shared/ui/header/DesktopMenu";
import MobileMenuView, { MobileMenuItem } from "@shared/ui/header/MobileMenu";
import { useCallback, useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { preloadRoute } from "@/router/routePreloaders";
import { useMobileDrawer } from "@/widgets/layout/header/useMobileDrawer";

const iconByHref: Record<string, JSX.Element> = {
  "/register": <AccessTimeIcon />,
  "/attendance/list": <ViewListIcon />,
  "/attendance/stats": <QueryStatsIcon />,
  "/attendance/report": <DescriptionIcon />,
  "/shift": <ScheduleIcon />,
  "/workflow": <WorkspacesIcon />,
  "/admin": <AdminPanelSettingsIcon />,
  "/profile": <AccountCircleIcon />,
  "/office/qr": <AccessTimeIcon />,
};

export default function NavigationMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, closeDrawer, openDrawer } = useMobileDrawer();
  const { isCognitoUserRole, cognitoUser, authStatus } =
    useContext(AuthContext);
  const { getOfficeMode, getAttendanceStatisticsEnabled } =
    useContext(AppConfigContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs } = useStaffs({ isAuthenticated });

  const pathName = location.pathname === "/" ? "/register" : location.pathname;

  const currentStaff = (() => {
    if (!cognitoUser?.id) {
      return null;
    }

    return staffs.find((staff) => staff.cognitoUserId === cognitoUser.id) ?? null;
  })();

  const canAccessShiftMenu = isShiftWorkType(currentStaff?.workType);

  const menuList = useMemo<DesktopMenuItem[]>(
    () => [
      { label: "勤怠打刻", href: "/register" },
      { label: "勤怠一覧", href: "/attendance/list" },
      { label: "稼働統計", href: "/attendance/stats" },
      { label: "日報", href: "/attendance/report" },
      { label: "シフト", href: "/shift" },
      { label: "ワークフロー", href: "/workflow" },
    ],
    [],
  );

  const adminLink = useMemo<DesktopMenuItem>(
    () => ({ label: "管理", href: "/admin" }),
    [],
  );

  const officeMode = getOfficeMode();
  const attendanceStatisticsEnabled = getAttendanceStatisticsEnabled();
  const operatorMenuList: DesktopMenuItem[] = officeMode
    ? [{ label: "QR表示", href: "/office/qr" }]
    : [];

  const isMailVerified = Boolean(cognitoUser?.emailVerified);

  const isAdminUser = useMemo(
    () =>
      isCognitoUserRole(StaffRole.ADMIN) ||
      isCognitoUserRole(StaffRole.STAFF_ADMIN),
    [isCognitoUserRole],
  );

  const desktopMenuItems = useMemo(() => {
    const filteredMenuList = menuList.filter((menu) => {
      if (menu.href === "/attendance/stats") {
        return attendanceStatisticsEnabled;
      }
      if (menu.href === "/shift") {
        return canAccessShiftMenu;
      }
      return true;
    });

    if (!isMailVerified) return [];

    if (isAdminUser) {
      return [...filteredMenuList, ...operatorMenuList];
    }

    if (isCognitoUserRole(StaffRole.STAFF)) {
      return filteredMenuList;
    }

    if (isCognitoUserRole(StaffRole.OPERATOR)) {
      return operatorMenuList;
    }

    return [];
  }, [
    attendanceStatisticsEnabled,
    canAccessShiftMenu,
    isAdminUser,
    isCognitoUserRole,
    isMailVerified,
    menuList,
    operatorMenuList,
  ]);

  const mobileMenuItems = useMemo<MobileMenuItem[]>(
    () => [
      ...desktopMenuItems.map((menu) => ({
        label: menu.label,
        icon: iconByHref[menu.href] ?? <ViewListIcon />,
        onClick: () => navigate(menu.href),
      })),
      ...(isAdminUser
        ? [
            {
              label: adminLink.label,
              icon: iconByHref[adminLink.href] ?? <AdminPanelSettingsIcon />,
              onClick: () => navigate(adminLink.href),
            },
          ]
        : []),
      ...(cognitoUser
        ? [
            {
              label: "個人設定",
              icon: iconByHref["/profile"] ?? <AccountCircleIcon />,
              onClick: () => navigate("/profile"),
            },
          ]
        : []),
    ],
    [
      adminLink.href,
      adminLink.label,
      cognitoUser,
      desktopMenuItems,
      isAdminUser,
      navigate,
    ],
  );

  const mobilePreloadTargets = useMemo(() => {
    const hrefs = desktopMenuItems.map((menu) => menu.href);

    if (isAdminUser) {
      hrefs.push(adminLink.href);
    }

    if (cognitoUser) {
      hrefs.push("/profile");
    }

    const uniqueHrefs = [...new Set(hrefs)];
    const currentIndex = uniqueHrefs.findIndex((href) => {
      if (href === pathName) {
        return true;
      }

      return pathName.startsWith(`${href}/`);
    });

    const prioritizedHrefs =
      currentIndex >= 0
        ? [
            ...uniqueHrefs.slice(currentIndex + 1),
            ...uniqueHrefs.slice(0, currentIndex),
          ]
        : uniqueHrefs;

    return prioritizedHrefs.filter((href) => href !== pathName).slice(0, 2);
  }, [adminLink.href, cognitoUser, desktopMenuItems, isAdminUser, pathName]);

  const handleOpenMobileMenu = useCallback(() => {
    mobilePreloadTargets.forEach((href) => {
      preloadRoute(href);
    });
    openDrawer();
  }, [mobilePreloadTargets, openDrawer]);

  if (pathName === "/login") return null;

  return (
    <>
      <DesktopMenuView
        pathName={pathName}
        menuItems={desktopMenuItems}
        adminLink={adminLink}
        showAdminMenu={isAdminUser}
        onItemPreload={preloadRoute}
      />
      <MobileMenuView
        menuItems={mobileMenuItems}
        isOpen={isOpen}
        onOpen={handleOpenMobileMenu}
        onClose={closeDrawer}
      />
    </>
  );
}
