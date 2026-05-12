import useAppConfig from "@entities/app-config/model/useAppConfig";
import ShiftAccessGuard from "@pages/shift/ShiftAccessGuard";
import { ProgressBar } from "@shared/ui/feedback";
import { PageSection } from "@shared/ui/layout";
import Page from "@shared/ui/page/Page";
import { Navigate } from "react-router-dom";

import { resolveShiftRequestMode } from "../request";
import ShiftCollaborativePage from "./ShiftCollaborative";

export const shouldRedirectFromCollaborativeRoute = (
  mode: ReturnType<typeof resolveShiftRequestMode>,
): boolean => {
  return mode !== "collaborative";
};

function ShiftCollaborativeRouteContent() {
  const {
    config,
    getShiftCollaborativeEnabled,
    getShiftDefaultMode,
    isConfigLoading,
  } = useAppConfig();

  if (isConfigLoading && !config) {
    return (
      <Page title="希望シフト" width="full" showDefaultHeader={false}>
        <PageSection variant="plain" layoutVariant="detail" sx={{ gap: 0 }}>
          <ProgressBar data-testid="shift-mode-loading" />
        </PageSection>
      </Page>
    );
  }

  const selectedMode = resolveShiftRequestMode(
    getShiftDefaultMode(),
    getShiftCollaborativeEnabled(),
  );

  if (shouldRedirectFromCollaborativeRoute(selectedMode)) {
    return <Navigate to="/shift" replace />;
  }

  return <ShiftCollaborativePage />;
}

export default function ShiftCollaborativeRoutePage() {
  return (
    <ShiftAccessGuard title="希望シフト">
      <ShiftCollaborativeRouteContent />
    </ShiftAccessGuard>
  );
}
