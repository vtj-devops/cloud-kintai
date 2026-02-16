import { Box, Stack } from "@mui/material";
import Link from "@shared/ui/link/Link";
import { CSSProperties } from "react";

import { designTokenVar } from "@/shared/designSystem";

export type DesktopMenuItem = {
  label: string;
  href: string;
};

export interface DesktopMenuProps {
  pathName: string;
  menuItems: DesktopMenuItem[];
  adminLink?: DesktopMenuItem | null;
  showAdminMenu: boolean;
}

const DesktopMenu = ({
  pathName,
  menuItems,
  adminLink,
  showAdminMenu,
}: DesktopMenuProps) => {
  const MENU_GAP = designTokenVar("component.headerMenu.gap", "8px");
  const MENU_ITEM_HEIGHT = designTokenVar(
    "component.headerMenu.itemHeight",
    "32px"
  );
  const MENU_ITEM_PADDING_X = designTokenVar(
    "component.headerMenu.paddingX",
    "8px"
  );
  const MENU_ITEM_PADDING_Y = designTokenVar(
    "component.headerMenu.paddingY",
    "4px"
  );
  const MENU_ITEM_RADIUS = designTokenVar(
    "component.headerMenu.borderRadius",
    "8px"
  );
  const MENU_ITEM_FONT_WEIGHT = designTokenVar(
    "component.headerMenu.fontWeight",
    "500"
  );
  const MENU_ITEM_COLOR = designTokenVar(
    "component.headerMenu.color",
    "#FFFFFF"
  );
  const MENU_ITEM_ACTIVE_COLOR = designTokenVar(
    "component.headerMenu.activeColor",
    "#0FA85E"
  );
  const MENU_ITEM_ACTIVE_BACKGROUND = designTokenVar(
    "component.headerMenu.activeBackground",
    "#FFFFFF"
  );
  const MENU_ITEM_HOVER_BACKGROUND = designTokenVar(
    "component.headerMenu.hoverBackground",
    "rgba(255, 255, 255, 0.16)"
  );
  const MENU_ITEM_TRANSITION = designTokenVar(
    "component.headerMenu.transitionMs",
    "160ms"
  );
  const menuVars: CSSProperties & Record<`--${string}`, string> = {
    "--menu-gap": MENU_GAP,
    "--menu-item-height": MENU_ITEM_HEIGHT,
    "--menu-item-px": MENU_ITEM_PADDING_X,
    "--menu-item-py": MENU_ITEM_PADDING_Y,
    "--menu-item-radius": MENU_ITEM_RADIUS,
    "--menu-item-font-weight": MENU_ITEM_FONT_WEIGHT,
    "--menu-item-color": MENU_ITEM_COLOR,
    "--menu-item-active-color": MENU_ITEM_ACTIVE_COLOR,
    "--menu-item-active-bg": MENU_ITEM_ACTIVE_BACKGROUND,
    "--menu-item-hover-bg": MENU_ITEM_HOVER_BACKGROUND,
    "--menu-item-transition": MENU_ITEM_TRANSITION,
  };

  const buildLinkClassName = (isActive: boolean) =>
    `flex min-h-[var(--menu-item-height)] items-center rounded-[var(--menu-item-radius)] px-[var(--menu-item-px)] py-[var(--menu-item-py)] font-[var(--menu-item-font-weight)] whitespace-nowrap leading-[1.2] no-underline transition-[color,background-color] [transition-duration:var(--menu-item-transition)] ease-in-out hover:no-underline focus-visible:no-underline ${
      isActive
        ? "bg-[var(--menu-item-active-bg)] text-[color:var(--menu-item-active-color)] hover:bg-[var(--menu-item-active-bg)] hover:text-[color:var(--menu-item-active-color)] focus-visible:bg-[var(--menu-item-active-bg)] focus-visible:text-[color:var(--menu-item-active-color)]"
        : "bg-transparent text-[color:var(--menu-item-color)] hover:bg-[var(--menu-item-hover-bg)] hover:text-[color:var(--menu-item-color)] focus-visible:bg-[var(--menu-item-hover-bg)] focus-visible:text-[color:var(--menu-item-color)]"
    }`;

  return (
    <Box className="hidden w-full items-center lg:flex" style={menuVars}>
      <Stack direction="row" className="w-auto gap-[var(--menu-gap)]">
        {menuItems.map((menu) => (
          <Box key={menu.href}>
            <Link
              label={menu.label}
              href={menu.href}
              className={buildLinkClassName(pathName === menu.href)}
            />
          </Box>
        ))}

        {showAdminMenu && adminLink && (
          <Box>
            <Link
              label={adminLink.label}
              href={adminLink.href}
              className={buildLinkClassName(pathName === adminLink.href)}
            />
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default DesktopMenu;
