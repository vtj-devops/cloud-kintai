import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { useDialogCloseGuard } from "./useDialogCloseGuard";

function GuardedDialog({
  isDirty = false,
  isBusy = false,
}: {
  isDirty?: boolean;
  isBusy?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const { dialog, requestClose, closeWithoutGuard } = useDialogCloseGuard({
    isDirty,
    isBusy,
    onClose: () => setOpen(false),
  });

  if (!open) {
    return <div>closed</div>;
  }

  return (
    <div>
      <div>dialog body</div>
      <button type="button" onClick={requestClose}>
        request close
      </button>
      <button type="button" onClick={closeWithoutGuard}>
        close without guard
      </button>
      {dialog}
    </div>
  );
}

describe("useDialogCloseGuard", () => {
  it("closes immediately when there are no pending changes", () => {
    render(<GuardedDialog />);

    fireEvent.click(screen.getByText("request close"));

    expect(screen.getByText("closed")).toBeInTheDocument();
  });

  it("shows the confirmation dialog before closing", () => {
    render(<GuardedDialog isDirty />);

    fireEvent.click(screen.getByText("request close"));

    expect(screen.getByText("変更内容の確認")).toBeInTheDocument();
    expect(screen.getByText("dialog body")).toBeInTheDocument();

    fireEvent.click(screen.getByText("破棄して続行"));

    expect(screen.getByText("closed")).toBeInTheDocument();
  });

  it("bypasses the guard when closeWithoutGuard is used", () => {
    render(<GuardedDialog isBusy />);

    fireEvent.click(screen.getByText("close without guard"));

    expect(screen.getByText("closed")).toBeInTheDocument();
  });
});
