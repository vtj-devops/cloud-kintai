import type { ShiftDisplayMode } from "@entities/app-config/model/useAppConfig";
import useAppConfig from "@entities/app-config/model/useAppConfig";
import { ShiftManagementBoard } from "@features/shift/management";
import { Stack, Typography } from "@mui/material";
import ShiftCollaborativePage from "@pages/shift/collaborative/ShiftCollaborative";
import { ProgressBar } from "@shared/ui/feedback";
import { PageSection } from "@shared/ui/layout";
import Page from "@shared/ui/page/Page";

export const resolveShiftManagementMode = (
  defaultMode: ShiftDisplayMode,
): ShiftDisplayMode => {
  return defaultMode;
};

export default function ShiftManagementPage() {
  const { config, getShiftDefaultMode, isConfigLoading } = useAppConfig();

  if (isConfigLoading && !config) {
    return (
      <Page title="シフト管理" width="full" showDefaultHeader={false}>
        <PageSection variant="plain" layoutVariant="detail" sx={{ gap: 0 }}>
          <ProgressBar data-testid="shift-management-mode-loading" />
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ py: 6 }}
            spacing={1}
          >
            <Typography variant="body2" color="text.secondary">
              シフト画面を読み込み中です...
            </Typography>
          </Stack>
        </PageSection>
      </Page>
    );
  }

  const selectedMode = resolveShiftManagementMode(getShiftDefaultMode());

  return selectedMode === "collaborative" ? (
    <ShiftCollaborativePage />
  ) : (
    <ShiftManagementBoard />
  );
}
