import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import AppIconButton, { type AppIconButtonProps } from "./AppIconButton";

type BaseActionIconButtonProps = Omit<
  AppIconButtonProps,
  "children" | "aria-label" | "tone"
> & {
  "aria-label"?: string;
};

export type AppDeleteIconButtonProps = BaseActionIconButtonProps;
export function AppDeleteIconButton({
  "aria-label": ariaLabel = "削除",
  ...props
}: AppDeleteIconButtonProps) {
  return (
    <AppIconButton {...props} aria-label={ariaLabel} tone="danger">
      <DeleteIcon fontSize="small" />
    </AppIconButton>
  );
}

export type AppEditIconButtonProps = BaseActionIconButtonProps;
export function AppEditIconButton({
  "aria-label": ariaLabel = "編集",
  ...props
}: AppEditIconButtonProps) {
  return (
    <AppIconButton {...props} aria-label={ariaLabel}>
      <EditIcon fontSize="small" />
    </AppIconButton>
  );
}

export type AppCopyIconButtonProps = BaseActionIconButtonProps;
export function AppCopyIconButton({
  "aria-label": ariaLabel = "コピー",
  ...props
}: AppCopyIconButtonProps) {
  return (
    <AppIconButton {...props} aria-label={ariaLabel}>
      <ContentCopyIcon fontSize="small" />
    </AppIconButton>
  );
}
