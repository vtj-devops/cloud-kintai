import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  AppCopyIconButton,
  AppDeleteIconButton,
  AppDeleteOutlineIconButton,
  AppEditIconButton,
} from "./AppActionIconButton";

describe("AppActionIconButton", () => {
  it("AppEditIconButton は既定 aria-label=編集 で描画される", () => {
    render(<AppEditIconButton />);

    expect(screen.getByRole("button", { name: "編集" })).toBeInTheDocument();
  });

  it("AppCopyIconButton は既定 aria-label=コピー で描画される", () => {
    render(<AppCopyIconButton />);

    expect(screen.getByRole("button", { name: "コピー" })).toBeInTheDocument();
  });

  it("AppDeleteIconButton と AppDeleteOutlineIconButton は danger tone で描画される", () => {
    render(
      <>
        <AppDeleteIconButton aria-label="削除-塗り" />
        <AppDeleteOutlineIconButton aria-label="削除-枠" />
      </>,
    );

    expect(screen.getByRole("button", { name: "削除-塗り" })).toHaveAttribute(
      "data-app-icon-button-tone",
      "danger",
    );
    expect(screen.getByRole("button", { name: "削除-枠" })).toHaveAttribute(
      "data-app-icon-button-tone",
      "danger",
    );
  });

  it("onClick を透過して呼び出す", async () => {
    const user = userEvent.setup();
    const handleEdit = jest.fn();

    render(<AppEditIconButton onClick={handleEdit} />);

    await user.click(screen.getByRole("button", { name: "編集" }));

    expect(handleEdit).toHaveBeenCalledTimes(1);
  });
});
