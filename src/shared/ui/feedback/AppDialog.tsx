import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { type ReactNode } from "react";

import { ProgressBar } from "./LoadingPrimitives";

type AppDialogProps = {
  open: boolean;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  onClose: () => void;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  loading?: boolean;
};

export default function AppDialog({
  open,
  title,
  description,
  actions,
  children,
  onClose,
  maxWidth = "sm",
  fullWidth = true,
  loading = false,
}: AppDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth}>
      {title && <DialogTitle>{title}</DialogTitle>}
      {loading && <ProgressBar />}
      <DialogContent>
        {description && (
          <DialogContentText sx={{ mb: children ? 2 : 0 }}>
            {description}
          </DialogContentText>
        )}
        {children}
      </DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
}
