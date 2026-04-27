import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import {
  createMemoryRouter,
  Link,
  RouterProvider,
  useNavigate,
} from "react-router-dom";

import { usePageLeaveGuard } from "./usePageLeaveGuard";

function GuardedPage({
  isDirty = false,
  isBusy = false,
  useBypass = false,
}: {
  isDirty?: boolean;
  isBusy?: boolean;
  useBypass?: boolean;
}) {
  const navigate = useNavigate();
  const { dialog, runWithoutGuard } = usePageLeaveGuard({ isDirty, isBusy });

  return (
    <div>
      <div>current page</div>
      <Link to="/next">go next</Link>
      <button
        type="button"
        onClick={() => {
          if (useBypass) {
            runWithoutGuard(() => navigate("/next"));
            return;
          }

          navigate("/next");
        }}
      >
        programmatic next
      </button>
      {dialog}
    </div>
  );
}

const renderWithRouter = (element: React.ReactNode) => {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element,
      },
      {
        path: "/next",
        element: <div>next page</div>,
      },
    ],
    { initialEntries: ["/"] },
  );

  return render(<RouterProvider router={router} />);
};

describe("usePageLeaveGuard", () => {
  it("does not block navigation when there are no pending changes", async () => {
    renderWithRouter(<GuardedPage />);

    fireEvent.click(screen.getByText("go next"));

    expect(await screen.findByText("next page")).toBeInTheDocument();
  });

  it("blocks SPA navigation and shows the confirmation dialog", async () => {
    renderWithRouter(<GuardedPage isDirty />);

    fireEvent.click(screen.getByText("go next"));

    expect(await screen.findByText("変更内容の確認")).toBeInTheDocument();
    expect(screen.getByText("current page")).toBeInTheDocument();

    fireEvent.click(screen.getByText("破棄して続行"));

    expect(await screen.findByText("next page")).toBeInTheDocument();
  });

  it("registers beforeunload while busy", () => {
    renderWithRouter(<GuardedPage isBusy />);

    const event = new Event("beforeunload", {
      cancelable: true,
    }) as BeforeUnloadEvent;
    Object.defineProperty(event, "returnValue", {
      configurable: true,
      writable: true,
      value: undefined,
    });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(event.returnValue).toBe("");
  });

  it("allows programmatic navigation through runWithoutGuard", async () => {
    renderWithRouter(<GuardedPage isDirty useBypass />);

    fireEvent.click(screen.getByText("programmatic next"));

    expect(await screen.findByText("next page")).toBeInTheDocument();
  });
});
