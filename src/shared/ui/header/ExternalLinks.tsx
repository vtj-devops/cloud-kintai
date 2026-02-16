import AppsIcon from "@mui/icons-material/Apps";
import {
  Box,
  IconButton,
  Link,
  Paper,
  Popper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { useTheme } from "@mui/material/styles";
import { MouseEvent, useMemo, useState } from "react";

import { predefinedIcons } from "@/shared/config/icons";
import { designTokenVar } from "@/shared/designSystem";

export type ExternalLinkItem = {
  label: string;
  url: string;
  enabled: boolean;
  icon: string;
  isPersonal?: boolean;
};

export interface ExternalLinksProps {
  links: ExternalLinkItem[];
  staffName: string;
}

const ACTION_ICON_COLOR = designTokenVar(
  "component.headerActions.iconColor",
  "#FFFFFF"
);
const ACTION_ICON_SIZE = designTokenVar(
  "component.headerActions.iconSize",
  "40px"
);
const ACTION_ICON_SIZE_SM = designTokenVar(
  "component.headerActions.iconSizeSm",
  "30px"
);
const ACTION_ICON_HOVER_BG = designTokenVar(
  "component.headerActions.iconHoverBackground",
  "rgba(255, 255, 255, 0.16)"
);
const POPPER_WIDTH = designTokenVar("component.headerActions.popoverWidth", "420px");
const POPPER_MIN_WIDTH = designTokenVar(
  "component.headerActions.popoverMinWidth",
  "280px"
);
const POPPER_MAX_HEIGHT = designTokenVar(
  "component.headerActions.popoverMaxHeight",
  "560px"
);
const POPPER_PADDING = designTokenVar(
  "component.headerActions.popoverPadding",
  "16px"
);
const POPPER_GAP = designTokenVar("component.headerActions.popoverGap", "16px");
const POPPER_RADIUS = designTokenVar("component.headerActions.popoverRadius", "16px");
const POPPER_SURFACE = designTokenVar(
  "component.headerActions.popoverSurface",
  "#F8FCFA"
);
const POPPER_SURFACE_ALT = designTokenVar(
  "component.headerActions.popoverSurfaceAlt",
  "#F1F8F4"
);
const POPPER_SHADOW = designTokenVar(
  "component.headerActions.popoverShadow",
  "0 14px 28px rgba(18, 36, 29, 0.18)"
);
const GRID_GAP = designTokenVar("component.headerActions.gridGap", "8px");
const GRID_ITEM_PADDING = designTokenVar(
  "component.headerActions.gridItemPadding",
  "8px"
);
const GRID_HOVER_BACKGROUND = designTokenVar(
  "component.headerActions.gridHoverBackground",
  "#E4F2E9"
);
const GRID_ITEM_RADIUS = designTokenVar("radius.sm", "8px");
const GRID_ICON_SURFACE = designTokenVar(
  "component.headerActions.iconSurface",
  "#E8F5EC"
);
const GRID_ITEM_BORDER = designTokenVar(
  "component.headerActions.gridItemBorder",
  "1px solid #D4E7DA"
);
const EMPTY_STATE_COLOR = designTokenVar(
  "component.headerActions.emptyStateColor",
  "#7D9288"
);
const SECTION_TITLE_FONT_WEIGHT = designTokenVar(
  "component.headerActions.sectionTitle.fontWeight",
  "700"
);
const SECTION_TITLE_LETTER_SPACING = designTokenVar(
  "component.headerActions.sectionTitle.letterSpacing",
  "0.5px"
);
const SECTION_TITLE_MARGIN_BOTTOM = designTokenVar(
  "component.headerActions.sectionTitle.marginBottom",
  "8px"
);
const SECTION_DIVIDER = designTokenVar(
  "component.headerActions.sectionDivider",
  "#D4E7DA"
);
const INTERACTION_TRANSITION_DURATION = designTokenVar(
  "component.headerActions.interaction.transitionDuration",
  "160ms"
);
const INTERACTION_TRANSITION_EASING = designTokenVar(
  "component.headerActions.interaction.transitionEasing",
  "ease"
);

const ExternalLinks = ({ links, staffName }: ExternalLinksProps) => {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobileSize = useMediaQuery(theme.breakpoints.down("md"));

  const open = Boolean(anchor);
  const id = open ? "external-links-popup" : undefined;

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : event.currentTarget);
  };

  const handleClickAway = () => {
    setAnchor(null);
  };

  const { companyLinks, personalLinks } = useMemo(() => {
    const company: ExternalLinkItem[] = [];
    const personal: ExternalLinkItem[] = [];

    links.forEach((link) => {
      if (link.isPersonal) {
        personal.push(link);
      } else {
        company.push(link);
      }
    });

    return { companyLinks: company, personalLinks: personal };
  }, [links]);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box>
        <IconButton
          onClick={handleClick}
          sx={{
            color: ACTION_ICON_COLOR,
            width: { xs: ACTION_ICON_SIZE_SM, sm: ACTION_ICON_SIZE },
            p: { xs: "3px", sm: "8px" },
            height: { xs: ACTION_ICON_SIZE_SM, sm: ACTION_ICON_SIZE },
            borderRadius: "50%",
            transition: `background-color ${INTERACTION_TRANSITION_DURATION} ${INTERACTION_TRANSITION_EASING}`,
            "&:hover": {
              backgroundColor: ACTION_ICON_HOVER_BG,
            },
          }}
        >
          <AppsIcon sx={{ fontSize: { xs: 22, sm: 28 } }} />
        </IconButton>
        <Popper
          id={id}
          open={open}
          anchorEl={anchor}
          placement={isMobileSize ? "bottom-end" : "bottom"}
          sx={{ zIndex: 1300 }}
        >
          <Paper
            elevation={3}
            sx={{
              width: {
                xs: `min(calc(100vw - 16px), ${POPPER_WIDTH})`,
                sm: POPPER_WIDTH,
              },
              minWidth: POPPER_MIN_WIDTH,
              maxHeight: POPPER_MAX_HEIGHT,
              m: { xs: 1, sm: 2 },
              p: POPPER_PADDING,
              borderRadius: POPPER_RADIUS,
              border: "1px solid rgba(20, 76, 44, 0.14)",
              boxShadow: POPPER_SHADOW,
              background: `linear-gradient(180deg, ${POPPER_SURFACE_ALT} 0%, ${POPPER_SURFACE} 100%)`,
              display: "flex",
              flexDirection: "column",
              gap: POPPER_GAP,
              overflow: "hidden",
            }}
          >
            <Box sx={{ overflowY: "auto", pr: { xs: 0.5, sm: 1 } }}>
              <Stack sx={{ gap: POPPER_GAP }}>
                {companyLinks.length > 0 && (
                  <LinksSection
                    title="共通"
                    links={companyLinks}
                    staffName={staffName}
                  />
                )}
                {personalLinks.length > 0 && (
                  <LinksSection
                    title="プライベート"
                    links={personalLinks}
                    staffName={staffName}
                  />
                )}
                {companyLinks.length === 0 && personalLinks.length === 0 && (
                  <Typography
                    variant="body2"
                    sx={{ color: EMPTY_STATE_COLOR }}
                    textAlign="center"
                  >
                    表示できるリンクがありません
                  </Typography>
                )}
              </Stack>
            </Box>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

interface LinksSectionProps {
  title: string;
  links: ExternalLinkItem[];
  staffName: string;
}

const LinksSection = ({ title, links, staffName }: LinksSectionProps) => {
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          gap: 1,
          mb: SECTION_TITLE_MARGIN_BOTTOM,
          pb: 0.75,
          borderBottom: `1px solid ${SECTION_DIVIDER}`,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "success.main",
            flexShrink: 0,
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: SECTION_TITLE_FONT_WEIGHT,
            letterSpacing: SECTION_TITLE_LETTER_SPACING,
          }}
        >
          {title}
        </Typography>
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(3, minmax(0, 1fr))",
            sm: "repeat(4, minmax(0, 1fr))",
          },
          columnGap: GRID_GAP,
          rowGap: GRID_GAP,
        }}
      >
        {links.map((link, index) => (
          <LinkGridItem
            key={`${link.url}-${index}`}
            url={link.url}
            title={link.label}
            iconType={link.icon}
            staffName={staffName}
          />
        ))}
      </Box>
    </Box>
  );
};

interface LinkGridItemProps {
  url: string;
  title: string;
  iconType: string;
  staffName: string;
}

const iconMap = new Map(
  predefinedIcons.map((icon) => [icon.value, icon.component])
);

const LinkGridItem = ({
  url,
  title,
  iconType,
  staffName,
}: LinkGridItemProps) => {
  const iconComponent = iconMap.get(iconType) || iconMap.get("LinkIcons");
  const processedUrl = url.replace("{staffName}", staffName);
  return (
    <Link
      href={processedUrl}
      target="_blank"
      rel="noopener noreferrer"
      color="inherit"
      underline="none"
      sx={{ display: "block" }}
    >
      <Stack
        direction="column"
        alignItems="flex-start"
        sx={{
          gap: 1,
          padding: GRID_ITEM_PADDING,
          borderRadius: GRID_ITEM_RADIUS,
          minHeight: { xs: 72, sm: 78 },
          border: GRID_ITEM_BORDER,
          backgroundColor: "rgba(255,255,255,0.66)",
          transition: `background-color ${INTERACTION_TRANSITION_DURATION} ${INTERACTION_TRANSITION_EASING}, transform ${INTERACTION_TRANSITION_DURATION} ${INTERACTION_TRANSITION_EASING}, border-color ${INTERACTION_TRANSITION_DURATION} ${INTERACTION_TRANSITION_EASING}`,
          "&:hover": {
            backgroundColor: GRID_HOVER_BACKGROUND,
            borderColor: "rgba(20, 76, 44, 0.28)",
            transform: "translateY(-1px)",
          },
        }}
      >
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: "8px",
            bgcolor: GRID_ICON_SURFACE,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "success.dark",
            "& svg": { fontSize: 15 },
          }}
        >
          {iconComponent}
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: "text.primary",
            lineHeight: 1.2,
            fontSize: "0.7rem",
            wordBreak: "break-word",
          }}
        >
          {title}
        </Typography>
      </Stack>
    </Link>
  );
};

export default ExternalLinks;
