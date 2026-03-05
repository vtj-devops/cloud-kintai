import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ShiftSuggestionsPanelBase } from "./ShiftSuggestionsPanel";

describe("ShiftSuggestionsPanel", () => {
  const createViolation = () => ({
    ruleId: "min-workers",
    severity: "error" as const,
    message: "出勤者が不足しています",
    affectedCells: [{ staffId: "staff-1", date: "2026-02-26" }],
    suggestedActions: [
      {
        id: "assign-1",
        description: "staff-1を出勤にする",
        changes: [
          {
            staffId: "staff-1",
            date: "2026-02-26",
            newState: "work" as const,
          },
        ],
        impact: "出勤者数を1名増やします",
      },
    ],
  });

  it("最小化時にパネル本体をDOMから削除し、展開ボタンのみ表示する", async () => {
    const user = userEvent.setup();
    render(
      <ShiftSuggestionsPanelBase
        violations={[createViolation()]}
        isAnalyzing={false}
        onApplyAction={jest.fn()}
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.getByText("シフト提案")).toBeInTheDocument();
    expect(screen.getByText("出勤者が不足しています")).toBeInTheDocument();

    const toggleButton = screen.getByLabelText("表示モードを切り替え");

    await user.click(toggleButton);
    await user.click(toggleButton);

    expect(screen.queryByText("シフト提案")).not.toBeInTheDocument();
    expect(
      screen.queryByText("出勤者が不足しています"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("シフト提案パネルを展開")).toBeInTheDocument();

    await user.click(screen.getByLabelText("シフト提案パネルを展開"));

    expect(screen.getByText("シフト提案")).toBeInTheDocument();
  });
});
