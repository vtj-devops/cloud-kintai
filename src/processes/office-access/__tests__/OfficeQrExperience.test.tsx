/**
 * OfficeQrExperience インテグレーションテスト
 *
 * AuthContext・AppConfigContext は renderWithProviders が提供する。
 * useOfficeQr は複雑な interval/Crypto 処理を含むためモックする。
 * qrcode.react は lazy import のためスタブ化する。
 */

// qrcode.react スタブ
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import { OfficeQrExperience } from "@processes/office-access";
import { renderWithProviders } from "@shared/test-utils";
import { screen } from "@testing-library/react";

jest.mock("qrcode.react", () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <canvas data-testid="qr-code-canvas" data-value={value} />
  ),
}));

// useOfficeQr のモック
const mockUseOfficeQr = jest.fn();

jest.mock("@features/attendance/office-qr", () => ({
  ...jest.requireActual("@features/attendance/office-qr"),
  useOfficeQr: mockUseOfficeQr,
}));

/** useOfficeQr のデフォルト戻り値 */
const defaultOfficeQrHookValue = {
  qrUrl: "https://example.com/office/qr/register?token=test",
  timeLeft: 30,
  progress: 100,
  isRegisterMode: true,
  tooltipOpen: false,
  handleModeChange: jest.fn(),
  handleManualRefresh: jest.fn(),
  handleCopyUrl: jest.fn(),
};

describe("OfficeQrExperience", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOfficeQr.mockReturnValue(defaultOfficeQrHookValue);
  });

  it("クラッシュせずにレンダリングされる", () => {
    // デフォルト: officeMode=false（FALLBACK_DERIVED）
    renderWithProviders(<OfficeQrExperience />);
    expect(
      screen.getByTestId("office-qr-disabled-alert"),
    ).toBeInTheDocument();
  });

  it("officeMode=false のとき、使用不可メッセージを表示する", () => {
    renderWithProviders(<OfficeQrExperience />, {
      appConfigContext: { derived: { officeMode: false } as never },
    });
    expect(
      screen.getByText("現在、使用することができません。"),
    ).toBeInTheDocument();
  });

  it("officeMode=true のとき、QR パネルをレンダリングする（モード切り替えボタンあり）", () => {
    renderWithProviders(<OfficeQrExperience />, {
      appConfigContext: { derived: { officeMode: true } as never },
    });
    expect(screen.getByTestId("office-qr-mode-toggle")).toBeInTheDocument();
  });

  it("officeMode=true のとき、タイマーが表示される", () => {
    renderWithProviders(<OfficeQrExperience />, {
      appConfigContext: { derived: { officeMode: true } as never },
    });
    expect(screen.getByTestId("office-qr-timer")).toBeInTheDocument();
  });

  it("管理者ユーザーの場合、管理者アラートを表示する", () => {
    renderWithProviders(<OfficeQrExperience />, {
      authContext: {
        isCognitoUserRole: (role: StaffRole) => role === StaffRole.ADMIN,
        hasRole: (role: StaffRole) => role === StaffRole.ADMIN,
        roles: [StaffRole.ADMIN],
      },
      appConfigContext: { derived: { officeMode: true } as never },
    });
    expect(
      screen.getByTestId("office-qr-admin-alert"),
    ).toBeInTheDocument();
  });

  it("スタッフユーザー（非管理者）の場合、管理者アラートを表示しない", () => {
    renderWithProviders(<OfficeQrExperience />, {
      authContext: {
        isCognitoUserRole: (role: StaffRole) => role === StaffRole.STAFF,
        hasRole: (role: StaffRole) => role === StaffRole.STAFF,
        roles: [StaffRole.STAFF],
      },
      appConfigContext: { derived: { officeMode: true } as never },
    });
    expect(
      screen.queryByTestId("office-qr-admin-alert"),
    ).not.toBeInTheDocument();
  });
});
