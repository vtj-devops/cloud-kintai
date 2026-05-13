import { render, screen } from "@testing-library/react";

import ActionCardButton from "./ActionCardButton";
import {
  buildActionCardVars,
  TIME_RECORDER_BUTTON_PALETTES,
} from "./buttonStyles";

const style = buildActionCardVars(TIME_RECORDER_BUTTON_PALETTES.clockIn);

describe("ActionCardButton", () => {
  it("icon未指定時はアイコン領域を描画しない", () => {
    const { container } = render(
      <ActionCardButton
        testId="action-card"
        style={style}
        label="勤務開始"
      />,
    );

    expect(container.querySelector(".action-card-icon")).not.toBeInTheDocument();
  });

  it("shape=circle で円形属性を適用する", () => {
    render(
      <ActionCardButton
        testId="action-card"
        style={style}
        shape="circle"
        layout="center"
        label="勤務開始"
      />,
    );

    const button = screen.getByTestId("action-card");
    expect(button).toHaveAttribute("data-action-card-shape", "circle");
  });

  it("size=slim で縮小サイズ属性を適用する", () => {
    render(
      <ActionCardButton
        testId="action-card"
        style={style}
        size="slim"
        layout="center"
        label="休憩開始"
      />,
    );

    const button = screen.getByTestId("action-card");
    expect(button).toHaveAttribute("data-action-card-size", "slim");
  });
});
