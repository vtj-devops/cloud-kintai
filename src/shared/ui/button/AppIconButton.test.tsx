import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AppIconButton from "./AppIconButton";

describe("AppIconButton", () => {
  it("aria-label付きのbuttonとして描画される", async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(
      <AppIconButton aria-label="編集" onClick={handleClick}>
        E
      </AppIconButton>,
    );

    const button = screen.getByRole("button", { name: "編集" });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("active状態とsize属性を保持する", () => {
    render(
      <AppIconButton aria-label="履歴" tone="primary" size="sm" active>
        H
      </AppIconButton>,
    );

    const button = screen.getByRole("button", { name: "履歴" });
    expect(button).toHaveAttribute("data-app-icon-button-tone", "primary");
    expect(button).toHaveAttribute("data-app-icon-button-size", "sm");
    expect(button).toHaveAttribute("data-app-icon-button-active", "true");
  });

  it("loading時は無効化しスピナーを表示する", () => {
    render(
      <AppIconButton aria-label="同期" loading>
        S
      </AppIconButton>,
    );

    const button = screen.getByRole("button", { name: "同期" });
    expect(button).toBeDisabled();
    expect(button.querySelector(".app-icon-button__spinner")).toBeInTheDocument();
  });

  it("tooltipが指定された場合、role=tooltipの要素を含む", () => {
    render(
      <AppIconButton aria-label="削除" tooltip="削除する">
        D
      </AppIconButton>,
    );

    expect(screen.getByRole("tooltip")).toHaveTextContent("削除する");
  });

  it("tooltipが未指定の場合、role=tooltipの要素を含まない", () => {
    render(<AppIconButton aria-label="削除">D</AppIconButton>);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
