import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AttendanceStatistics from "@features/attendance/statistics/ui/AttendanceStatistics";
import { PANEL_HEIGHTS } from "@shared/config/uiDimensions";
import {
  DashboardInnerSurface,
  PageContent,
  PageSection,
} from "@shared/ui/layout";
import Page from "@shared/ui/page/Page";
import { useContext } from "react";
import { Navigate } from "react-router-dom";

export default function AttendanceStatisticsPage() {
  const { getAttendanceStatisticsEnabled } = useContext(AppConfigContext);
  const isEnabled = getAttendanceStatisticsEnabled();

  if (!isEnabled) {
    return <Navigate to="/attendance/list" replace />;
  }

  return (
    <Page title="稼働統計" width="full" showDefaultHeader={false}>
      <PageContent width="content">
        <PageSection layoutVariant="dashboard">
          <DashboardInnerSurface
            className="sm:p-6"
            style={{ minHeight: PANEL_HEIGHTS.STATISTICS_MIN }}
          >
            <AttendanceStatistics />
          </DashboardInnerSurface>
        </PageSection>
      </PageContent>
    </Page>
  );
}
