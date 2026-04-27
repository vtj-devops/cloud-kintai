import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InlineAlert } from "./InlineAlert";

describe("InlineAlert", () => {
  it.each(["info", "warning", "error", "success"] as const)(
    "renders %s tone",
    (tone) => {
      render(<InlineAlert tone={tone}>メッセージ</InlineAlert>);
      expect(screen.getByText("メッセージ")).toBeInTheDocument();
    },
  );

  it("renders title when provided", () => {
    render(
      <InlineAlert tone="info" title="見出し">
        本文
      </InlineAlert>,
    );
    expect(screen.getByText("見出し")).toBeInTheDocument();
    expect(screen.getByText("本文")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(
      <InlineAlert tone="info" icon={<span data-testid="icon" />}>
        本文
      </InlineAlert>,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = jest.fn();
    render(
      <InlineAlert tone="info" onClose={onClose}>
        本文
      </InlineAlert>,
    );
    await userEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render close button when onClose is not provided", () => {
    render(<InlineAlert tone="info">本文</InlineAlert>);
    expect(
      screen.queryByRole("button", { name: "閉じる" }),
    ).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <InlineAlert tone="info" className="custom-class">
        本文
      </InlineAlert>,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
