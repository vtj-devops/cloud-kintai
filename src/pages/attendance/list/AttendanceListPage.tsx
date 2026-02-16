import AttendanceList from "@features/attendance/list/ui/AttendanceList";
import Box from "@mui/material/Box";
import Page from "@shared/ui/page/Page";

import { PANEL_HEIGHTS } from "@/shared/config/uiDimensions";
import { dashboardInnerSurfaceSx, PageSection } from "@/shared/ui/layout";

export default function AttendanceListPage() {
  return (
    <Page title="勤怠一覧" maxWidth="xl" showDefaultHeader={false}>
      <PageSection layoutVariant="dashboard">
        <Box
          sx={{
            ...dashboardInnerSurfaceSx,
            height: 1,
            minHeight: { xs: "auto", md: PANEL_HEIGHTS.DASHBOARD_MIN },
          }}
        >
          <AttendanceList />
        </Box>
      </PageSection>
    </Page>
  );
}
