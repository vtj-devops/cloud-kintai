import Page from "@shared/ui/page/Page";
import { useNavigate, useParams } from "react-router-dom";

import WorkflowDetailPanel from "./components/WorkflowDetailPanel";

export default function AdminWorkflowDetail() {
  const { id } = useParams() as { id?: string };
  const navigate = useNavigate();

  return (
    <Page
      title="申請内容（管理者）"
      breadcrumbs={[
        { label: "TOP", href: "/" },
        { label: "ワークフロー管理", href: "/admin/workflow" },
      ]}
      maxWidth="lg"
    >
      <WorkflowDetailPanel
        workflowId={id}
        showBackButton
        onBack={() => navigate(-1)}
      />
    </Page>
  );
}
