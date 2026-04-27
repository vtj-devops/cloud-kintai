import { render, screen } from "@testing-library/react";

import { ShiftCellBase } from "./ShiftCell";

const renderShiftCell = (props?: Partial<React.ComponentProps<typeof ShiftCellBase>>) =>
  render(
    <table>
      <tbody>
        <tr>
          <ShiftCellBase
            staffId="staff-1"
            date="01"
            state="work"
            isLocked={false}
            isEditing={false}
            onClick={jest.fn()}
            onRegisterRef={jest.fn()}
            onMouseDown={jest.fn()}
            onMouseEnter={jest.fn()}
            isFocused={false}
            isSelected={false}
            {...props}
          />
        </tr>
      </tbody>
    </table>,
  );

describe("ShiftCell", () => {
  it("自分が編集ロック中のとき専用の背景と枠線を表示する", () => {
    renderShiftCell({
      isEditing: true,
      editLockOwner: "self",
      editorName: "自分",
    });

    const cell = screen.getByRole("cell");

    expect(cell).toHaveStyle({
      backgroundColor: "rgba(33, 150, 243, 0.14)",
      border: "2px solid #2196f3",
    });
    expect(screen.getByText("編集中（ロック取得中）")).toBeInTheDocument();
  });

  it("他ユーザーが編集中のとき既存の編集中表示を維持する", () => {
    renderShiftCell({
      isEditing: true,
      editLockOwner: "other",
      editorName: "田中",
      editorColor: "#4caf50",
    });

    const cell = screen.getByRole("cell");

    expect(cell).toHaveStyle({
      backgroundColor: "rgba(76, 175, 80, 0.1)",
      border: "2px solid #4caf50",
    });
    expect(screen.getByText("田中が編集中")).toBeInTheDocument();
  });

  it("確定ロック時は確定ロック表示を優先する", () => {
    renderShiftCell({
      isLocked: true,
      isEditing: true,
      editLockOwner: "self",
      editorName: "自分",
    });

    const cell = screen.getByRole("cell");

    expect(cell).toHaveStyle({
      backgroundColor: "rgba(148, 163, 184, 0.12)",
      border: "2px solid rgba(100, 116, 139, 0.5)",
    });
    expect(screen.getByText("確定済み")).toBeInTheDocument();
    expect(screen.queryByText("編集中（ロック取得中）")).not.toBeInTheDocument();
  });
});
