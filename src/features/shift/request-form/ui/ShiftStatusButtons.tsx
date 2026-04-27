import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AppButton } from "@shared/ui/button";
import type { CSSProperties } from "react";

import { ShiftRequestDayStatus } from "../model/statusMapping";
import { STATUS_LABEL_MAP } from "./constants";

type ShiftStatusButtonsProps = {
  selected?: ShiftRequestDayStatus;
  disabled: boolean;
  isMobile: boolean;
  onSelect: (status: ShiftRequestDayStatus) => void;
};

type ButtonStyle = CSSProperties & Record<`--${string}`, string>;

export function ShiftStatusButtons({
  selected,
  disabled,
  isMobile,
  onSelect,
}: ShiftStatusButtonsProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: isMobile ? "wrap" : "nowrap",
        gap: 1,
      }}
    >
      {(
        ["work", "fixedOff", "requestedOff", "auto"] as ShiftRequestDayStatus[]
      ).map((status) => {
        const palette = {
          work: theme.palette.success,
          fixedOff: theme.palette.error,
          requestedOff: theme.palette.warning,
          auto: theme.palette.info,
        }[status];
        const isSelected = selected === status;

        const buttonStyle: ButtonStyle = isSelected
          ? {
              "--app-button-bg": palette.main,
              "--app-button-border": palette.dark,
              "--app-button-color": palette.contrastText,
              "--app-button-hover-bg": palette.dark,
              "--app-button-hover-border": palette.dark,
              "--app-button-hover-color": palette.contrastText,
              "--app-button-shadow":
                "inset 0 -2px 0 rgba(0,0,0,0.12), 0 12px 24px -18px rgba(0,0,0,0.25)",
            }
          : {
              "--app-button-bg": theme.palette.background.paper,
              "--app-button-border": palette.main,
              "--app-button-color": palette.dark,
              "--app-button-hover-bg": alpha(palette.main, 0.12),
              "--app-button-hover-border": palette.main,
              "--app-button-hover-color": palette.dark,
              "--app-button-shadow": "none",
            };

        return (
          <AppButton
            key={status}
            variant={isSelected ? "solid" : "outline"}
            tone="neutral"
            size="sm"
            disabled={disabled}
            onClick={() => onSelect(status)}
            style={buttonStyle}
          >
            {STATUS_LABEL_MAP[status]}
          </AppButton>
        );
      })}
    </Box>
  );
}
