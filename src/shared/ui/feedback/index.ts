// Re-export all public components from the feedback UI package.
// This file allows consumers to import from `@shared/ui/feedback` without
// specifying individual file paths.
//
// The components are grouped by their purpose:
//   * Progress indicators – `ProgressBar`, `Spinner`, `CenteredSpinner`
//   * Dialogs – `AppDialog`, `ConfirmDialog`, `LeaveGuardDialog`
//   * State containers – `DataStateContainer`, `PageLoader`
//   * Alerts – `AlertWithMessageList`, `InlineAlert`
//   * Skeletons – `FormSkeleton`, `TableSkeleton`
//   * Misc – `EmptyState`, `RouterFallback`, `SettingsDialog`
//
// Exporting them from a single entry point simplifies imports and keeps
// the public API stable.

export { AlertWithMessageList } from "./AlertWithMessageList";
export { default as AppDialog } from "./AppDialog";
export { CenteredSpinner } from "./CenteredSpinner";
export { default as ConfirmDialog } from "./ConfirmDialog";
export { DataStateContainer } from "./DataStateContainer";
export { EmptyState } from "./EmptyState";
export { FormSkeleton } from "./FormSkeleton";
export { InlineAlert } from "./InlineAlert";
export { default as LeaveGuardDialog } from "./LeaveGuardDialog";
export { ProgressBar, Spinner } from "./LoadingPrimitives";
export { default as PageLoader } from "./PageLoader";
export { default as RouterFallback } from "./RouterFallback";
export { default as SettingsDialog } from "./SettingsDialog";
export { TableSkeleton } from "./TableSkeleton";
export { useDialogCloseGuard } from "./useDialogCloseGuard";
export { usePageLeaveGuard } from "./usePageLeaveGuard";
