import { AppButton } from "@shared/ui/button";

export default function WorkflowCreateButton({
  isCompact,
  onClick,
}: {
  isCompact: boolean;
  onClick: () => void;
}) {
  return (
    <AppButton
      size="sm"
      onClick={onClick}
      className={[
        "workflow-create-button",
        isCompact ? "workflow-create-button--compact" : "",
      ].join(" ")}
      startIcon={<span className="workflow-create-button__icon">+</span>}
    >
      {isCompact ? "新規" : "新規作成"}
    </AppButton>
  );
}
