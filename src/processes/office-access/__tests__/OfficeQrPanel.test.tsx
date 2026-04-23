/**
 * OfficeQrPanel ユニットテスト
 *
 * 純粋な UI コンポーネント。Props を渡すだけでテスト可能。
 * qrcode.react は Suspense 経由の lazy import のためスタブ化する。
 */
import { OfficeQrPanel } from "@features/attendance/office-qr";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// QR コードライブラリをスタブ化（lazy import される）
jest.mock("qrcode.react", () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <canvas data-testid="qr-code-canvas" data-value={value} />
  ),
}));

/** テスト用のデフォルト Props */
const defaultProps = {
  showAdminAlert: false,
  isOfficeModeEnabled: true,
  isRegisterMode: true,
  timeLeft: 25,
  progress: 83,
  qrUrl: "https://example.com/office/qr/register?token=abc",
  tooltipOpen: false,
  onModeChange: jest.fn(),
  onCopyUrl: jest.fn(),
  onManualRefresh: jest.fn(),
};

describe("OfficeQrPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isOfficeModeEnabled=false のとき", () => {
    it("使用不可アラートを表示する", () => {
      render(
        <OfficeQrPanel {...defaultProps} isOfficeModeEnabled={false} />,
      );
      expect(
        screen.getByTestId("office-qr-disabled-alert"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("現在、使用することができません。"),
      ).toBeInTheDocument();
    });

    it("モード切り替えボタンを表示しない", () => {
      render(
        <OfficeQrPanel {...defaultProps} isOfficeModeEnabled={false} />,
      );
      expect(
        screen.queryByTestId("office-qr-mode-toggle"),
      ).not.toBeInTheDocument();
    });
  });

  describe("isOfficeModeEnabled=true のとき", () => {
    it("出勤モードボタンを表示する（isRegisterMode=true）", () => {
      render(<OfficeQrPanel {...defaultProps} isRegisterMode={true} />);
      expect(screen.getByTestId("office-qr-mode-toggle")).toHaveTextContent(
        "出勤モード",
      );
    });

    it("退勤モードボタンを表示する（isRegisterMode=false）", () => {
      render(<OfficeQrPanel {...defaultProps} isRegisterMode={false} />);
      expect(screen.getByTestId("office-qr-mode-toggle")).toHaveTextContent(
        "退勤モード",
      );
    });

    it("タイマーと進捗バーを表示する", () => {
      render(<OfficeQrPanel {...defaultProps} timeLeft={25} />);
      expect(screen.getByTestId("office-qr-timer")).toHaveTextContent(
        "00:25",
      );
      expect(screen.getByTestId("office-qr-progress")).toBeInTheDocument();
    });

    it("URL コピーボタンと手動更新ボタンを表示する", () => {
      render(<OfficeQrPanel {...defaultProps} />);
      expect(
        screen.getByTestId("office-qr-copy-button"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("office-qr-refresh-button"),
      ).toBeInTheDocument();
    });

    it("モードトグルボタンをクリックすると onModeChange が呼ばれる", async () => {
      const onModeChange = jest.fn();
      render(<OfficeQrPanel {...defaultProps} onModeChange={onModeChange} />);
      await userEvent.click(screen.getByTestId("office-qr-mode-toggle"));
      expect(onModeChange).toHaveBeenCalledTimes(1);
    });

    it("手動更新ボタンをクリックすると onManualRefresh が呼ばれる", async () => {
      const onManualRefresh = jest.fn();
      render(
        <OfficeQrPanel {...defaultProps} onManualRefresh={onManualRefresh} />,
      );
      await userEvent.click(screen.getByTestId("office-qr-refresh-button"));
      expect(onManualRefresh).toHaveBeenCalledTimes(1);
    });

    it("URL コピーボタンをクリックすると onCopyUrl が呼ばれる", async () => {
      const onCopyUrl = jest.fn();
      render(<OfficeQrPanel {...defaultProps} onCopyUrl={onCopyUrl} />);
      await userEvent.click(screen.getByTestId("office-qr-copy-button"));
      expect(onCopyUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe("管理者アラート", () => {
    it("showAdminAlert=true のとき、管理者アラートを表示する", () => {
      render(<OfficeQrPanel {...defaultProps} showAdminAlert={true} />);
      expect(
        screen.getByTestId("office-qr-admin-alert"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/管理者権限で表示されています/),
      ).toBeInTheDocument();
    });

    it("showAdminAlert=false のとき、管理者アラートを表示しない", () => {
      render(<OfficeQrPanel {...defaultProps} showAdminAlert={false} />);
      expect(
        screen.queryByTestId("office-qr-admin-alert"),
      ).not.toBeInTheDocument();
    });
  });
});
