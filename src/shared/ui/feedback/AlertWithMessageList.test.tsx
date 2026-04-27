import { render, screen } from "@testing-library/react";

import { AlertWithMessageList } from "./AlertWithMessageList";

describe("AlertWithMessageList", () => {
  it("returns null when messages is empty", () => {
    const { container } = render(<AlertWithMessageList messages={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders messages", () => {
    render(<AlertWithMessageList messages={["エラー1", "エラー2"]} />);
    expect(screen.getByText("エラー1")).toBeInTheDocument();
    expect(screen.getByText("エラー2")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(<AlertWithMessageList messages={["エラー"]} title="入力内容に誤りがあります。" />);
    expect(screen.getByText("入力内容に誤りがあります。")).toBeInTheDocument();
  });

  it("does not render title element when title is omitted", () => {
    render(<AlertWithMessageList messages={["エラー"]} />);
    expect(screen.queryByText("入力内容に誤りがあります。")).not.toBeInTheDocument();
  });

  it("has role=alert by default", () => {
    render(<AlertWithMessageList messages={["エラー"]} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("applies error tone classes by default", () => {
    render(<AlertWithMessageList messages={["エラー"]} />);
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("rose");
  });

  it("applies warning tone classes when tone=warning", () => {
    render(<AlertWithMessageList messages={["警告"]} tone="warning" />);
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("amber");
  });

  it("merges className prop", () => {
    render(<AlertWithMessageList messages={["エラー"]} className="mb-2" />);
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("mb-2");
  });
});
