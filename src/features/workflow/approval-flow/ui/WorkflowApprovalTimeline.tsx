import WorkflowStatusChip from "@entities/workflow/ui/WorkflowStatusChip";
import { SubsectionTitle } from "@shared/ui/typography";

import type { WorkflowApprovalStepView } from "../types";

type Props = {
  title?: string;
  steps: WorkflowApprovalStepView[];
};

export default function WorkflowApprovalTimeline({
  title = "承認フロー",
  steps,
}: Props) {
  return (
    <section className="rounded-[20px] border border-slate-200/80 bg-slate-50/75 p-4">
      <SubsectionTitle className="mb-3 text-slate-950">{title}</SubsectionTitle>
      <div className="flex flex-col gap-4">
        {steps.map((step, idx) => {
          const isApplicant = step.role === "申請者";
          const active =
            step.state === "承認済み"
              ? "done"
              : step.state === "未承認"
                ? "pending"
                : "";
          const badgeBackground = isApplicant
            ? "#A5B3AC"
            : active === "done"
              ? "#1EAA6A"
              : "#0FA85E";

          return (
            <div
              key={step.id}
              className="flex flex-wrap items-center gap-3 rounded-[18px] border border-slate-200/80 bg-white px-4 py-3 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.35)] sm:flex-nowrap sm:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center font-bold"
                  style={{
                    borderRadius: "10px",
                    backgroundColor: badgeBackground,
                    color: "#FFFFFF",
                  }}
                >
                  {idx === 0 ? "申" : idx}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold">{step.name}</div>
                  <div className="text-xs text-slate-500">
                    {step.role} {step.date ? `・${step.date}` : ""}
                  </div>
                </div>
              </div>
              {!isApplicant && (
                <div className="sm:ml-auto">
                  <WorkflowStatusChip status={step.state} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
