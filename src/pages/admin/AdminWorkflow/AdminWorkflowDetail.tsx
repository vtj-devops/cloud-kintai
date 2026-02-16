import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import useWorkflows from "@entities/workflow/model/useWorkflows";
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { GetWorkflowQuery, WorkflowStatus } from "@shared/api/graphql/types";
import Page from "@shared/ui/page/Page";
import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAppDispatchV2 } from "@/app/hooks";
import { AppConfigContext } from "@/context/AppConfigContext";
import { AuthContext } from "@/context/AuthContext";
import {
  useCreateAttendanceMutation,
  useLazyGetAttendanceByStaffAndDateQuery,
  useUpdateAttendanceMutation,
} from "@/entities/attendance/api/attendanceApi";
import { getWorkflowCategoryLabel } from "@/entities/workflow/lib/workflowLabels";
import WorkflowMetadataPanel from "@/features/workflow/detail-panel/ui/WorkflowMetadataPanel";
import { createLogger } from "@/shared/lib/logger";
import { setSnackbarError, setSnackbarSuccess } from "@/shared/lib/store/snackbarSlice";

import WorkflowCommentSection from "./components/WorkflowCommentSection";
import { useWorkflowApprovalActions } from "./hooks/useWorkflowApprovalActions";
import { useWorkflowDetailData } from "./hooks/useWorkflowDetailData";
import { useWorkflowDetailViewModel } from "./hooks/useWorkflowDetailViewModel";

const logger = createLogger("AdminWorkflowDetail");

export default function AdminWorkflowDetail() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { id } = useParams() as { id?: string };
  const navigate = useNavigate();
  const { cognitoUser, authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs } = useStaffs({ isAuthenticated });
  const {
    getStartTime,
    getEndTime,
    getLunchRestStartTime,
    getLunchRestEndTime,
  } = useContext(AppConfigContext);
  const { update: updateWorkflow } = useWorkflows({ isAuthenticated });
  const [createAttendance] = useCreateAttendanceMutation();
  const [getAttendanceByStaffAndDate] =
    useLazyGetAttendanceByStaffAndDateQuery();
  const [updateAttendance] = useUpdateAttendanceMutation();

  const { workflow, setWorkflow, loading, error } = useWorkflowDetailData(id);
  const dispatch = useAppDispatchV2();

  const { staffName, applicationDate, approvalSteps } = useWorkflowDetailViewModel({
    workflow,
    staffs,
  });

  const { handleApprove, handleReject } = useWorkflowApprovalActions({
    workflow,
    cognitoUser,
    staffs,
    updateWorkflow: (input) =>
      updateWorkflow(input) as Promise<NonNullable<GetWorkflowQuery["getWorkflow"]>>,
    setWorkflow,
    notifySuccess: (message) => dispatch(setSnackbarSuccess(message)),
    notifyError: (message) => dispatch(setSnackbarError(message)),
    getStartTime,
    getEndTime,
    getLunchRestStartTime,
    getLunchRestEndTime,
    getAttendanceByStaffAndDate,
    createAttendance,
    updateAttendance,
  });

  return (
    <Page
      title="申請内容（管理者）"
      breadcrumbs={[
        { label: "TOP", href: "/" },
        { label: "ワークフロー管理", href: "/admin/workflow" },
      ]}
      maxWidth="lg"
    >
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: 1,
            mb: 2,
          }}
        >
          <Box>
            <Button
              size="small"
              sx={{ mr: { sm: 1 }, width: { xs: 1, sm: "auto" } }}
              onClick={() => navigate(-1)}
            >
              一覧に戻る
            </Button>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" } }}>
            <Button
              size={isMobile ? "medium" : "small"}
              variant="contained"
              color="success"
              sx={{ width: { xs: 1, sm: "auto" } }}
              onClick={handleApprove}
              disabled={
                !workflow?.id ||
                workflow?.status === WorkflowStatus.APPROVED ||
                workflow?.status === WorkflowStatus.CANCELLED
              }
            >
              承認
            </Button>

            <Button
              size={isMobile ? "medium" : "small"}
              variant="contained"
              color="error"
              sx={{ width: { xs: 1, sm: "auto" } }}
              onClick={handleReject}
              disabled={
                !workflow?.id ||
                workflow?.status === WorkflowStatus.REJECTED ||
                workflow?.status === WorkflowStatus.CANCELLED
              }
            >
              却下
            </Button>

            {/* 取り下げボタンは管理者画面では不要のため削除 */}
          </Box>
        </Box>

        {loading && <Typography>読み込み中...</Typography>}
        {error && <Typography color="error">{error}</Typography>}

        {!loading && !error && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <WorkflowMetadataPanel
                workflowId={workflow?.id ?? undefined}
                fallbackId={id}
                category={workflow?.category ?? null}
                categoryLabel={getWorkflowCategoryLabel(workflow)}
                staffName={staffName}
                applicationDate={applicationDate}
                status={workflow?.status ?? null}
                overTimeDetails={workflow?.overTimeDetails ?? null}
                approvalSteps={approvalSteps}
              />
            </Grid>

            <Grid item xs={12} md={5}>
              <WorkflowCommentSection
                workflow={workflow}
                staffs={staffs}
                cognitoUser={cognitoUser}
                updateWorkflow={(input) =>
                  updateWorkflow(input) as Promise<
                    NonNullable<GetWorkflowQuery["getWorkflow"]>
                  >
                }
                onWorkflowUpdated={setWorkflow}
                onSuccess={(message) => dispatch(setSnackbarSuccess(message))}
                onError={(message) => {
                  logger.error("Failed to send comment:", message);
                  dispatch(setSnackbarError(message));
                }}
              />
            </Grid>
          </Grid>
        )}
      </Paper>
    </Page>
  );
}
