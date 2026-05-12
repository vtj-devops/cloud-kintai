import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { AppButton } from "@shared/ui/button";

import { useWorkflowDetailContext } from "../model/WorkflowDetailContext";
import styles from "./WorkflowDetailActions.module.scss";

export default function WorkflowDetailActions() {
  const { permissions, onBack, onWithdraw, onEdit } =
    useWorkflowDetailContext();
  const { withdrawDisabled, withdrawTooltip, editDisabled, editTooltip } =
    permissions;
  return (
    <div className={styles.actions}>
      <div>
        <AppButton
          variant="outline"
          tone="secondary"
          size="sm"
          onClick={onBack}
          startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 18 }} />}
        >
          一覧に戻る
        </AppButton>
      </div>
      <div className={styles.actionsRight}>
        <AppButton
          tone="danger"
          size="sm"
          onClick={onWithdraw}
          disabled={withdrawDisabled}
          title={withdrawTooltip}
        >
          取り下げ
        </AppButton>
        <AppButton
          size="sm"
          onClick={onEdit}
          disabled={editDisabled}
          title={editTooltip}
        >
          編集
        </AppButton>
      </div>
    </div>
  );
}
