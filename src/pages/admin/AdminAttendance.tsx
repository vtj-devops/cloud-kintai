import { Stack } from "@mui/material";

import AttendanceDailyList from "@/features/attendance/daily-list/ui/AttendanceDailyList";
import DownloadForm from "@/features/attendance/download-form/ui/DownloadForm";
import { designTokenVar } from "@/shared/designSystem";
import { PageSection } from "@/shared/ui/layout";

const PAGE_PADDING_X = {
  xs: designTokenVar("spacing.sm", "8px"),
  md: designTokenVar("spacing.xxl", "32px"),
};

const PAGE_PADDING_Y = {
  xs: designTokenVar("spacing.xl", "24px"),
  md: designTokenVar("spacing.xxl", "32px"),
};

const PAGE_SECTION_GAP = designTokenVar("spacing.lg", "16px");

export default function AdminAttendance() {
  return (
    <Stack
      component="section"
      sx={{
        flex: 1,
        width: "100%",
        boxSizing: "border-box",
        px: PAGE_PADDING_X,
        py: PAGE_PADDING_Y,
        gap: PAGE_SECTION_GAP,
      }}
    >
      <PageSection variant="surface" layoutVariant="dashboard" sx={{ gap: 0 }}>
        <DownloadForm />
      </PageSection>
      <PageSection variant="surface" layoutVariant="dashboard" sx={{ gap: 0 }}>
        <AttendanceDailyList />
      </PageSection>
    </Stack>
  );
}
