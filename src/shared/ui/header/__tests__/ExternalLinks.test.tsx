import { fireEvent,render, screen } from "@testing-library/react";

import ExternalLinks, { type ExternalLinkItem } from "../ExternalLinks";

jest.mock("@shared/config/icons", () => ({
  predefinedIcons: [
    { value: "LinkIcons", label: "リンク", component: <span>LinkIcon</span> },
    { value: "train", label: "交通費", component: <span>TrainIcon</span> },
  ],
}));

jest.mock("@shared/designSystem", () => ({
  designTokenVar: (_: string, fallback: string) => fallback,
}));

const makeLink = (overrides: Partial<ExternalLinkItem> = {}): ExternalLinkItem => ({
  label: "テストリンク",
  url: "https://example.com",
  enabled: true,
  icon: "LinkIcons",
  ...overrides,
});

describe("ExternalLinks", () => {
  it("ボタンが表示される", () => {
    render(<ExternalLinks links={[]} staffName="山田太郎" />);
    expect(screen.getByLabelText("external links")).toBeInTheDocument();
  });

  it("初期状態ではポップオーバーが非表示", () => {
    render(<ExternalLinks links={[makeLink()]} staffName="山田太郎" />);
    expect(screen.queryByText("テストリンク")).not.toBeInTheDocument();
  });

  it("ボタンクリックでポップオーバーが開く", () => {
    render(<ExternalLinks links={[makeLink()]} staffName="山田太郎" />);
    fireEvent.click(screen.getByLabelText("external links"));
    expect(screen.getByText("テストリンク")).toBeInTheDocument();
  });

  it("再度クリックするとポップオーバーが閉じる", () => {
    render(<ExternalLinks links={[makeLink()]} staffName="山田太郎" />);
    const btn = screen.getByLabelText("external links");
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.queryByText("テストリンク")).not.toBeInTheDocument();
  });

  it("Escapeキーでポップオーバーが閉じる", () => {
    render(<ExternalLinks links={[makeLink()]} staffName="山田太郎" />);
    fireEvent.click(screen.getByLabelText("external links"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("テストリンク")).not.toBeInTheDocument();
  });

  it("外側クリックでポップオーバーが閉じる", () => {
    render(
      <div>
        <ExternalLinks links={[makeLink()]} staffName="山田太郎" />
        <button data-testid="outside">外側</button>
      </div>
    );
    fireEvent.click(screen.getByLabelText("external links"));
    expect(screen.getByText("テストリンク")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("テストリンク")).not.toBeInTheDocument();
  });

  it("共通リンクセクション「共通」が表示される", () => {
    render(
      <ExternalLinks links={[makeLink({ isPersonal: false })]} staffName="山田太郎" />
    );
    fireEvent.click(screen.getByLabelText("external links"));
    expect(screen.getByText("共通")).toBeInTheDocument();
  });

  it("個人リンクセクション「プライベート」が表示される", () => {
    render(
      <ExternalLinks links={[makeLink({ isPersonal: true })]} staffName="山田太郎" />
    );
    fireEvent.click(screen.getByLabelText("external links"));
    expect(screen.getByText("プライベート")).toBeInTheDocument();
  });

  it("リンクが空の場合は「表示できるリンクがありません」が表示される", () => {
    render(<ExternalLinks links={[]} staffName="山田太郎" />);
    fireEvent.click(screen.getByLabelText("external links"));
    expect(screen.getByText("表示できるリンクがありません")).toBeInTheDocument();
  });

  it("URLに{staffName}が含まれる場合、スタッフ名に置換される", () => {
    render(
      <ExternalLinks
        links={[makeLink({ url: "https://example.com/{staffName}" })]}
        staffName="山田太郎"
      />
    );
    fireEvent.click(screen.getByLabelText("external links"));
    const link = screen.getByRole("link", { name: /テストリンク/ });
    expect(link).toHaveAttribute("href", "https://example.com/山田太郎");
  });

  it("リンクはtarget=_blankで開く", () => {
    render(<ExternalLinks links={[makeLink()]} staffName="山田太郎" />);
    fireEvent.click(screen.getByLabelText("external links"));
    const link = screen.getByRole("link", { name: /テストリンク/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("未知のiconTypeはLinkIconsにフォールバックする", () => {
    render(
      <ExternalLinks
        links={[makeLink({ icon: "unknown-icon" })]}
        staffName="山田太郎"
      />
    );
    fireEvent.click(screen.getByLabelText("external links"));
    expect(screen.getByText("テストリンク")).toBeInTheDocument();
  });
});
