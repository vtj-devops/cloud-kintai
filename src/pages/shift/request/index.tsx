import type { ShiftDisplayMode } from "@entities/app-config/model/useAppConfig";
import useAppConfig from "@entities/app-config/model/useAppConfig";
import { ShiftRequestForm } from "@features/shift/request-form";
import ShiftCollaborativePage from "@pages/shift/collaborative/ShiftCollaborative";
import ShiftAccessGuard from "@pages/shift/ShiftAccessGuard";
import { ProgressBar } from "@shared/ui/feedback";
import { PageSection } from "@shared/ui/layout";
import Page from "@shared/ui/page/Page";

export const resolveShiftRequestMode = (
  defaultMode: ShiftDisplayMode,
  shiftCollaborativeEnabled: boolean,
): ShiftDisplayMode => {
  if (!shiftCollaborativeEnabled) {
    return "normal";
  }

  return defaultMode;
};

function ShiftRequestContent() {
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

  if (selectedMode === "collaborative") {
    return <ShiftCollaborativePage />;
  }

  return (
    <Page title="希望シフト" width="full" showDefaultHeader={false}>
      <PageSection variant="plain" layoutVariant="detail" sx={{ gap: 0 }}>
        <ShiftRequestForm />
      </PageSection>
    </Page>
  );
}

export default function ShiftRequestPage() {
  return (
    <ShiftAccessGuard title="希望シフト">
      <ShiftRequestContent />
    </ShiftAccessGuard>
  );
}
