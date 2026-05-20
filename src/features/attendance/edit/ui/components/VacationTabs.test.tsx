import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { type AppTabAppearance } from "@shared/ui/tabs";

import { VacationTabs } from "./VacationTabs";

const items = [
  {
    label: "タブ1",
    content: <div>パネル1</div>,
  },
  {
    label: "タブ2",
    content: <div>パネル2</div>,
  },
  {
    label: "タブ3",
    content: <div>パネル3</div>,
    disabled: true,
  },
];

function TestHarness({
  appearance = "underline",
}: {
  appearance?: AppTabAppearance;
}) {
  const [value, setValue] = useState(0);

  return (
    <VacationTabs
      value={value}
      onChange={setValue}
      items={items}
      appearance={appearance}
      tabsProps={{ "aria-label": "test-tabs" }}
    />
  );
}

describe("VacationTabs", () => {
  it("デフォルトでは下線付きタブスタイルを表示する", () => {
    render(<TestHarness />);

    const activeTab = screen.getByRole("tab", { name: "タブ1" });

    expect(activeTab).toHaveAttribute("aria-selected", "true");
    expect(activeTab).toHaveClass("after:bg-emerald-600");
    expect(activeTab).toHaveClass("font-semibold");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("パネル1");
  });

  it("chip 指定時はピル型スタイルで表示する", () => {
    render(<TestHarness appearance="chip" />);

    const activeTab = screen.getByRole("tab", { name: "タブ1" });

    expect(activeTab).toHaveClass("rounded-full");
    expect(activeTab).toHaveClass("bg-emerald-500");
    expect(activeTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("パネル1");
  });

  it("タブをクリックすると対応するパネルに切り替わる", () => {
    render(<TestHarness />);

    const firstTab = screen.getByRole("tab", { name: "タブ1" });
    const secondTab = screen.getByRole("tab", { name: "タブ2" });

    expect(firstTab).toHaveClass("after:bg-emerald-600");
    expect(firstTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("パネル1");

    fireEvent.click(secondTab);

    expect(secondTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("パネル2");
  });

  it("矢印キーで次の有効タブへ移動する", () => {
    render(<TestHarness />);

    const firstTab = screen.getByRole("tab", { name: "タブ1" });
    const secondTab = screen.getByRole("tab", { name: "タブ2" });

    fireEvent.keyDown(firstTab, { key: "ArrowRight" });

    expect(secondTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("パネル2");
  });
});
