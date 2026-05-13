import type { TimeRecorderAnnouncement } from "@features/attendance/time-recorder/lib/timeRecorderAnnouncement";

import AdminPendingApprovalSummary from "@/widgets/layout/header/AdminPendingApprovalSummary";

import ElapsedDurationCards from "./ElapsedDurationCards";
import RegisterAnnouncementPanel from "./RegisterAnnouncementPanel";
import RegisterAttendanceSummaryCard from "./RegisterAttendanceSummaryCard";
import type { TimeRecorderElapsedWorkInfo } from "./TimeRecorder";

type RegisterDashboardProps = {
  configId: string | null;
  announcement: TimeRecorderAnnouncement;
  elapsedWorkInfo: TimeRecorderElapsedWorkInfo;
  attendanceErrorCount: number;
};

export default function RegisterDashboard({
  configId,
  announcement,
  elapsedWorkInfo,
  attendanceErrorCount,
}: RegisterDashboardProps) {
  return (
    <aside data-testid="register-dashboard-slot" className="register-dashboard">
      <div className="register-dashboard__stack">
        {/* アナウンスパネルは常に最上位に表示すること */}
        <RegisterAnnouncementPanel
          configId={configId}
          announcement={announcement}
        />
        <AdminPendingApprovalSummary layoutMode="two-columns" />
        <ElapsedDurationCards elapsedWorkInfo={elapsedWorkInfo} />
        <RegisterAttendanceSummaryCard
          attendanceErrorCount={attendanceErrorCount}
          attendanceErrorListPath="/attendance/list"
        />
      </div>
    </aside>
  );
}
