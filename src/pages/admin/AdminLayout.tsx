import {
  PAGE_PADDING_X,
  PAGE_PADDING_Y,
} from "@features/admin/layout/adminLayoutTokens";
import { getAdminSettingsNavigationGroups } from "@features/admin/layout/model/adminSettingsNavigation";
import {
  ADMIN_SPLIT_PANEL_OPTIONS,
  buildAdminSplitPanelConfig,
} from "@features/admin/layout/model/adminSplitPanelRegistry";
import { resolveActiveMenuHref } from "@features/admin/layout/model/resolveActiveMenuHref";
import useHeaderMenu from "@features/admin/layout/model/useHeaderMenu";
import NavItemPanelMenu from "@features/admin/layout/ui/NavItemPanelMenu";
import {
  PanelContainer,
  SplitModeToggle,
  SplitViewProvider,
  useSplitView,
} from "@features/splitView";
import {
  Box,
  Button,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { designTokenVar } from "@shared/designSystem";
import { useIsMobile } from "@shared/lib/hooks/useIsMobile";
import { PageSection } from "@shared/ui/layout";
import React, { memo, Suspense, useCallback, useMemo } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const PAGE_SECTION_GAP = designTokenVar("spacing.xl", "24px");

const SplitPanelSkeleton = () => (
  <Stack spacing={1.5} sx={{ p: 2 }}>
    <Skeleton variant="text" width="38%" height={32} />
    <Skeleton variant="rounded" height={54} />
    <Skeleton variant="rounded" height={54} />
    <Skeleton variant="rounded" height={54} />
    <Skeleton variant="rounded" height={54} />
  </Stack>
);

const PAGE_CONTAINER_SX = {
  flex: 1,
  width: "100%",
  boxSizing: "border-box",
  px: PAGE_PADDING_X,
  py: PAGE_PADDING_Y,
  gap: PAGE_SECTION_GAP,
} as const;

const SURFACE_SECTION_SX = {
  gap: 0,
  flex: 1,
  overflow: "hidden",
  borderRadius: "16px",
  border: "1px solid rgba(226,232,240,0.8)",
  backgroundColor: "#ffffff",
  boxShadow: "0 28px 60px -42px rgba(15,23,42,0.35)",
} as const;

const SETTINGS_HREF = "/admin/master";
const SETTINGS_NAV_GROUPS = getAdminSettingsNavigationGroups();

const EmptyPanelState = memo(function EmptyPanelState({
  label,
}: {
  label: string;
}) {
  return (
    <Box
      sx={{
        minHeight: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
        fontSize: "0.9rem",
      }}
    >
      {label}
    </Box>
  );
});

const MemoizedOutlet = memo(function MemoizedOutlet() {
  return <Outlet />;
});

const SinglePanelContent = memo(function SinglePanelContent() {
  return <MemoizedOutlet />;
});

const AdminContextRail = memo(function AdminContextRail({
  menuItems,
  activeMenuHref,
  activeMenuItem,
  currentPath,
  onSelect,
  compact,
}: {
  menuItems: ReturnType<typeof useHeaderMenu>;
  activeMenuHref: string;
  activeMenuItem: ReturnType<typeof useHeaderMenu>[number] | null;
  currentPath: string;
  onSelect: (itemHref: string) => void;
  compact?: boolean;
}) {
  const isSettingsActive = activeMenuHref === SETTINGS_HREF;
  const [settingsExpanded, setSettingsExpanded] = React.useState(isSettingsActive);

  React.useEffect(() => {
    if (isSettingsActive) {
      setSettingsExpanded(true);
    }
  }, [isSettingsActive]);

  return (
    <Stack
      spacing={2}
      sx={{
        width: compact ? "100%" : 280,
        minWidth: compact ? "auto" : 280,
        borderRight: compact ? "none" : "1px solid rgba(226,232,240,0.85)",
        background:
          "linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,0.9) 100%)",
        p: 2,
        overflowY: "auto",
      }}
    >
      <Stack spacing={0.5}>
        <Typography
          sx={{ fontSize: "0.74rem", fontWeight: 700, color: "#0f766e" }}
        >
          CONTROL RAIL
        </Typography>
        <Typography
          sx={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}
        >
          {activeMenuItem?.primaryLabel ?? "カテゴリ"}
        </Typography>
        <Typography
          sx={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6 }}
        >
          {activeMenuItem?.ctaLabel ?? "頻出操作へすばやく遷移できます。"}
        </Typography>
      </Stack>

      <Divider flexItem />

      <Stack spacing={1}>
        {menuItems.map((item) => {
          const isActive = item.href === activeMenuHref;

          if (item.href === SETTINGS_HREF) {
            return (
              <React.Fragment key={item.href}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    "&:hover .rail-panel-menu-trigger, &:focus-within .rail-panel-menu-trigger":
                      { visibility: "visible" },
                  }}
                >
                  <Button
                    variant="text"
                    onClick={() => onSelect(item.href)}
                    sx={{
                      flex: 1,
                      justifyContent: "space-between",
                      textTransform: "none",
                      borderRadius: "10px",
                      px: 1.25,
                      py: 1,
                      color: isActive ? "#065f46" : "#1e293b",
                      backgroundColor: isActive
                        ? "rgba(16,185,129,0.14)"
                        : "transparent",
                      fontWeight: isActive ? 700 : 500,
                      "&:hover": {
                        backgroundColor: isActive
                          ? "rgba(16,185,129,0.2)"
                          : "rgba(148,163,184,0.12)",
                      },
                    }}
                  >
                    <Box component="span">{item.primaryLabel}</Box>
                    <Box
                      component="span"
                      sx={{ fontSize: "0.72rem", opacity: 0.75 }}
                    >
                      {item.secondaryLabel ?? ""}
                    </Box>
                  </Button>
                  <Box
                    component="button"
                    type="button"
                    aria-label={
                      settingsExpanded
                        ? "設定メニューを閉じる"
                        : "設定メニューを開く"
                    }
                    onClick={() => setSettingsExpanded((prev) => !prev)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 26,
                      height: 26,
                      borderRadius: "6px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#64748b",
                      fontSize: "0.75rem",
                      transition: "transform 160ms ease",
                      transform: settingsExpanded
                        ? "rotate(0deg)"
                        : "rotate(-90deg)",
                      "&:hover": {
                        backgroundColor: "rgba(148,163,184,0.15)",
                      },
                    }}
                  >
                    ▾
                  </Box>
                  <NavItemPanelMenu
                    href={item.href}
                    label={item.primaryLabel}
                    className="rail-panel-menu-trigger"
                    sx={{ visibility: "hidden" }}
                  />
                </Box>

                {settingsExpanded && (
                  <Box
                    sx={{
                      ml: 1,
                      pl: 1.25,
                      borderLeft: "2px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    {SETTINGS_NAV_GROUPS.map((group) => (
                      <Box key={group.key} sx={{ mb: 1.5 }}>
                        <Typography
                          sx={{
                            fontSize: "0.63rem",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            px: 0.5,
                            pb: 0.5,
                          }}
                        >
                          {group.title}
                        </Typography>
                        {group.items.map((subItem) => {
                          const isSubActive = currentPath === subItem.path;
                          return (
                            <Button
                              key={subItem.path}
                              variant="text"
                              onClick={() => onSelect(subItem.path)}
                              sx={{
                                display: "flex",
                                width: "100%",
                                justifyContent: "flex-start",
                                textTransform: "none",
                                borderRadius: "7px",
                                px: 1,
                                py: 0.55,
                                minHeight: 0,
                                fontSize: "0.83rem",
                                lineHeight: 1.4,
                                color: isSubActive ? "#065f46" : "#334155",
                                backgroundColor: isSubActive
                                  ? "rgba(16,185,129,0.12)"
                                  : "transparent",
                                fontWeight: isSubActive ? 700 : 400,
                                "&:hover": {
                                  backgroundColor: isSubActive
                                    ? "rgba(16,185,129,0.18)"
                                    : "rgba(148,163,184,0.1)",
                                },
                              }}
                            >
                              {subItem.title}
                            </Button>
                          );
                        })}
                      </Box>
                    ))}
                  </Box>
                )}
              </React.Fragment>
            );
          }

          return (
            <Box
              key={item.href}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                "&:hover .rail-panel-menu-trigger, &:focus-within .rail-panel-menu-trigger":
                  {
                    visibility: "visible",
                  },
              }}
            >
              <Button
                variant="text"
                onClick={() => onSelect(item.href)}
                sx={{
                  flex: 1,
                  justifyContent: "space-between",
                  textTransform: "none",
                  borderRadius: "10px",
                  px: 1.25,
                  py: 1,
                  color: isActive ? "#065f46" : "#1e293b",
                  backgroundColor: isActive
                    ? "rgba(16,185,129,0.14)"
                    : "transparent",
                  fontWeight: isActive ? 700 : 500,
                  "&:hover": {
                    backgroundColor: isActive
                      ? "rgba(16,185,129,0.2)"
                      : "rgba(148,163,184,0.12)",
                  },
                }}
              >
                <Box component="span">{item.primaryLabel}</Box>
                <Box
                  component="span"
                  sx={{ fontSize: "0.72rem", opacity: 0.75 }}
                >
                  {item.secondaryLabel ?? ""}
                </Box>
              </Button>
              <NavItemPanelMenu
                href={item.href}
                label={item.primaryLabel}
                className="rail-panel-menu-trigger"
                sx={{ visibility: "hidden" }}
              />
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
});

const SplitLayoutPanels = memo(function SplitLayoutPanels({
  splitPanelTitle,
  splitPanelPosition,
  selectedScreen,
  onClosePanel,
  onScreenChange,
  SplitPanelComponent,
}: {
  splitPanelTitle?: string;
  splitPanelPosition: "left" | "right";
  selectedScreen: string;
  onClosePanel: () => void;
  onScreenChange: (screenValue: string) => void;
  SplitPanelComponent?: React.ComponentType<{ panelId: string }>;
}) {
  const renderSplitPanelContent = () => (
    <PanelContainer
      title={splitPanelTitle || "画面を選択"}
      onClose={onClosePanel}
      screenOptions={ADMIN_SPLIT_PANEL_OPTIONS}
      selectedScreen={selectedScreen}
      onScreenChange={onScreenChange}
      contentSx={selectedScreen === "daily-report" ? { pt: 0 } : undefined}
    >
      {SplitPanelComponent ? (
        <Suspense fallback={<SplitPanelSkeleton />}>
          <SplitPanelComponent panelId={selectedScreen} />
        </Suspense>
      ) : (
        <EmptyPanelState label="パネルが選択されていません" />
      )}
    </PanelContainer>
  );

  const renderMainPanelContent = () => (
    <PanelContainer onClose={undefined}>
      <MemoizedOutlet />
    </PanelContainer>
  );

  return (
    <Group orientation="horizontal">
      <Panel defaultSize={50} minSize={30}>
        {splitPanelPosition === "left"
          ? renderSplitPanelContent()
          : renderMainPanelContent()}
      </Panel>
      <Separator
        style={{
          width: "8px",
          backgroundColor: "#e2e8f0",
          cursor: "col-resize",
        }}
      />
      <Panel defaultSize={50} minSize={30}>
        {splitPanelPosition === "left"
          ? renderMainPanelContent()
          : renderSplitPanelContent()}
      </Panel>
    </Group>
  );
});

const TripleLayoutPanels = memo(function TripleLayoutPanels({
  middlePanelTitle,
  rightPanelTitle,
  middleSelectedScreen,
  rightSelectedScreen,
  onCloseMiddlePanel,
  onCloseRightPanel,
  onMiddleScreenChange,
  onRightScreenChange,
  MiddlePanelComponent,
  RightPanelComponent,
}: {
  middlePanelTitle?: string;
  rightPanelTitle?: string;
  middleSelectedScreen: string;
  rightSelectedScreen: string;
  onCloseMiddlePanel: () => void;
  onCloseRightPanel: () => void;
  onMiddleScreenChange: (screenValue: string) => void;
  onRightScreenChange: (screenValue: string) => void;
  MiddlePanelComponent?: React.ComponentType<{ panelId: string }>;
  RightPanelComponent?: React.ComponentType<{ panelId: string }>;
}) {
  return (
    <Group orientation="horizontal">
      <Panel defaultSize={35} minSize={22}>
        <PanelContainer onClose={undefined}>
          <MemoizedOutlet />
        </PanelContainer>
      </Panel>
      <Separator
        style={{
          width: "8px",
          backgroundColor: "#e2e8f0",
          cursor: "col-resize",
        }}
      />
      <Panel defaultSize={32} minSize={22}>
        <PanelContainer
          title={middlePanelTitle || "中央パネル"}
          onClose={onCloseMiddlePanel}
          screenOptions={ADMIN_SPLIT_PANEL_OPTIONS}
          selectedScreen={middleSelectedScreen}
          onScreenChange={onMiddleScreenChange}
        >
          {MiddlePanelComponent ? (
            <Suspense fallback={<SplitPanelSkeleton />}>
              <MiddlePanelComponent panelId={middleSelectedScreen} />
            </Suspense>
          ) : (
            <EmptyPanelState label="中央パネルの画面を選択してください" />
          )}
        </PanelContainer>
      </Panel>
      <Separator
        style={{
          width: "8px",
          backgroundColor: "#e2e8f0",
          cursor: "col-resize",
        }}
      />
      <Panel defaultSize={33} minSize={22}>
        <PanelContainer
          title={rightPanelTitle || "右パネル"}
          onClose={onCloseRightPanel}
          screenOptions={ADMIN_SPLIT_PANEL_OPTIONS}
          selectedScreen={rightSelectedScreen}
          onScreenChange={onRightScreenChange}
        >
          {RightPanelComponent ? (
            <Suspense fallback={<SplitPanelSkeleton />}>
              <RightPanelComponent panelId={rightSelectedScreen} />
            </Suspense>
          ) : (
            <EmptyPanelState label="右パネルの画面を選択してください" />
          )}
        </PanelContainer>
      </Panel>
    </Group>
  );
});

function AdminLayoutContent() {
  const menuItems = useHeaderMenu();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    state,
    setMode,
    enableSplitMode,
    enableTripleMode,
    disableSplitMode,
    setLeftPanel,
    setRightPanel,
  } = useSplitView();
  const isMobile = useIsMobile();
  const [isMobileRailOpen, setIsMobileRailOpen] = React.useState(false);

  const handleSelect = useCallback(
    (itemHref: string) => {
      if (location.pathname === itemHref) return;
      navigate(itemHref);
      setIsMobileRailOpen(false);
    },
    [location.pathname, navigate],
  );

  const activeMenuHref = useMemo(() => {
    return resolveActiveMenuHref({ currentPath: location.pathname, menuItems });
  }, [location.pathname, menuItems]);

  const activeMenuItem = useMemo(
    () => menuItems.find((item) => item.href === activeMenuHref) ?? null,
    [activeMenuHref, menuItems],
  );

  const ensureRightPanel = useCallback(() => {
    if (state.rightPanel) {
      return;
    }

    const fallbackValue = ADMIN_SPLIT_PANEL_OPTIONS[0]?.value;
    if (!fallbackValue) {
      return;
    }

    const fallback = buildAdminSplitPanelConfig(fallbackValue);
    if (fallback) {
      setRightPanel(fallback);
    }
  }, [setRightPanel, state.rightPanel]);

  const ensureMiddlePanel = useCallback(() => {
    if (state.leftPanel) {
      return;
    }

    const fallbackValue = ADMIN_SPLIT_PANEL_OPTIONS[1]?.value;
    if (!fallbackValue) {
      return;
    }

    const fallback = buildAdminSplitPanelConfig(fallbackValue);
    if (fallback) {
      setLeftPanel(fallback);
    }
  }, [setLeftPanel, state.leftPanel]);

  const handleToggleSplitMode = useCallback(() => {
    if (isMobile) {
      if (state.mode === "single") {
        ensureRightPanel();
        enableSplitMode();
      } else {
        disableSplitMode();
        setLeftPanel(null);
        setRightPanel(null);
      }
      return;
    }

    if (state.mode === "single") {
      ensureRightPanel();
      enableSplitMode();
      return;
    }

    if (state.mode === "split") {
      ensureRightPanel();
      ensureMiddlePanel();
      enableTripleMode();
      return;
    }

    disableSplitMode();
    setLeftPanel(null);
    setRightPanel(null);
  }, [
    isMobile,
    state.mode,
    ensureRightPanel,
    enableSplitMode,
    ensureMiddlePanel,
    enableTripleMode,
    disableSplitMode,
    setLeftPanel,
    setRightPanel,
  ]);

  const handleCloseMiddlePanel = useCallback(() => {
    setLeftPanel(null);
    if (state.mode === "triple") {
      setMode("split");
    }
  }, [setLeftPanel, state.mode, setMode]);

  const handleCloseRightPanel = useCallback(() => {
    if (state.mode === "triple") {
      if (state.leftPanel) {
        setRightPanel(state.leftPanel);
      }
      setLeftPanel(null);
      setMode("split");
      return;
    }

    disableSplitMode();
    setRightPanel(null);
  }, [
    state.mode,
    state.leftPanel,
    setRightPanel,
    setLeftPanel,
    setMode,
    disableSplitMode,
  ]);

  const handleMiddleScreenChange = useCallback(
    (screenValue: string) => {
      const panel = buildAdminSplitPanelConfig(screenValue);
      if (!panel) {
        return;
      }
      setLeftPanel(panel);
    },
    [setLeftPanel],
  );

  const handleRightScreenChange = useCallback(
    (screenValue: string) => {
      const panel = buildAdminSplitPanelConfig(screenValue);
      if (!panel) {
        return;
      }
      setRightPanel(panel);
    },
    [setRightPanel],
  );

  const selectedMiddleScreen = useMemo(
    () => state.leftPanel?.id ?? "",
    [state.leftPanel],
  );
  const selectedRightScreen = useMemo(
    () => state.rightPanel?.id ?? "",
    [state.rightPanel],
  );

  const isSplitMode = state.mode === "split";
  const isTripleMode = state.mode === "triple";
  const MiddlePanelComponent = state.leftPanel?.component;
  const RightPanelComponent = state.rightPanel?.component;
  const splitPanelPosition = useMemo<"left" | "right">(() => {
    if (state.leftPanel && !state.rightPanel) {
      return "left";
    }

    return "right";
  }, [state.leftPanel, state.rightPanel]);
  const splitPanelConfig = useMemo(() => {
    if (splitPanelPosition === "left") {
      return state.leftPanel;
    }

    return state.rightPanel;
  }, [splitPanelPosition, state.leftPanel, state.rightPanel]);

  const handleToggleMobileRail = useCallback(() => {
    setIsMobileRailOpen((prev) => !prev);
  }, []);

  React.useEffect(() => {
    if (!isMobile) {
      setIsMobileRailOpen(false);
    }
  }, [isMobile]);

  React.useEffect(() => {
    if (isTripleMode) {
      ensureRightPanel();
      ensureMiddlePanel();
    }
  }, [isTripleMode, ensureRightPanel, ensureMiddlePanel]);

  React.useEffect(() => {
    if (!isSplitMode) {
      return;
    }

    if (!state.leftPanel && !state.rightPanel) {
      ensureRightPanel();
    }
  }, [ensureRightPanel, isSplitMode, state.leftPanel, state.rightPanel]);

  React.useEffect(() => {
    if (isMobile && state.mode === "triple") {
      setMode("split");
      setLeftPanel(null);
    }
  }, [isMobile, state.mode, setMode, setLeftPanel]);

  return (
    <Stack component="section" sx={PAGE_CONTAINER_SX}>
      <PageSection
        variant="surface"
        layoutVariant="dashboard"
        sx={SURFACE_SECTION_SX}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1,
            p: 1.5,
            borderBottom: "1px solid rgba(226,232,240,0.85)",
          }}
        >
          {isMobile && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleToggleMobileRail}
              sx={{ textTransform: "none", borderRadius: "999px" }}
            >
              {isMobileRailOpen ? "ナビを閉じる" : "ナビを開く"}
            </Button>
          )}
          <SplitModeToggle mode={state.mode} onToggle={handleToggleSplitMode} />
        </Box>

        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{ width: "100%", flex: 1 }}
        >
          {!isMobile && (
            <AdminContextRail
              menuItems={menuItems}
              activeMenuHref={activeMenuHref}
              activeMenuItem={activeMenuItem}
              currentPath={location.pathname}
              onSelect={handleSelect}
            />
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {isMobile && isMobileRailOpen && (
              <Box sx={{ borderBottom: "1px solid rgba(226,232,240,0.85)" }}>
                <AdminContextRail
                  compact
                  menuItems={menuItems}
                  activeMenuHref={activeMenuHref}
                  activeMenuItem={activeMenuItem}
                  currentPath={location.pathname}
                  onSelect={handleSelect}
                />
              </Box>
            )}

            {isTripleMode ? (
              <TripleLayoutPanels
                middlePanelTitle={state.leftPanel?.title}
                rightPanelTitle={state.rightPanel?.title}
                middleSelectedScreen={selectedMiddleScreen}
                rightSelectedScreen={selectedRightScreen}
                onCloseMiddlePanel={handleCloseMiddlePanel}
                onCloseRightPanel={handleCloseRightPanel}
                onMiddleScreenChange={handleMiddleScreenChange}
                onRightScreenChange={handleRightScreenChange}
                MiddlePanelComponent={MiddlePanelComponent}
                RightPanelComponent={RightPanelComponent}
              />
            ) : isSplitMode ? (
              <SplitLayoutPanels
                splitPanelTitle={splitPanelConfig?.title}
                splitPanelPosition={splitPanelPosition}
                selectedScreen={splitPanelConfig?.id ?? ""}
                onClosePanel={handleCloseRightPanel}
                onScreenChange={
                  splitPanelPosition === "left"
                    ? handleMiddleScreenChange
                    : handleRightScreenChange
                }
                SplitPanelComponent={splitPanelConfig?.component}
              />
            ) : (
              <SinglePanelContent />
            )}
          </Box>
        </Stack>
      </PageSection>
    </Stack>
  );
}

export default function AdminLayout() {
  return (
    <SplitViewProvider>
      <AdminLayoutContent />
    </SplitViewProvider>
  );
}
