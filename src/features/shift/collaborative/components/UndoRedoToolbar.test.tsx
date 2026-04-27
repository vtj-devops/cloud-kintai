import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UndoRedoToolbar } from "./UndoRedoToolbar";

describe("UndoRedoToolbar", () => {
  it("syncとhelpの操作を呼び出す", async () => {
    const user = userEvent.setup();
    const onSync = jest.fn();
    const onShowHelp = jest.fn();

    render(
      <UndoRedoToolbar
        onPrint={jest.fn()}
        onSync={onSync}
        onShowHelp={onShowHelp}
        onShowSuggestions={jest.fn()}
        suggestionsBadgeCount={2}
      />,
    );

    await user.click(screen.getByRole("button", { name: "sync" }));
    await user.click(screen.getByRole("button", { name: "show help" }));

    expect(onSync).toHaveBeenCalledTimes(1);
    expect(onShowHelp).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "show suggestions" }),
    ).toBeInTheDocument();
  });
});
