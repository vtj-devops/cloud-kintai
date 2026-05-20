import type { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { createMockStaff, renderWithProviders } from "@shared/test-utils";
import type { RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";

type DownloadRenderOptions = {
  readonly router?: boolean;
  readonly hourlyPaidHolidayEnabled?: boolean;
  readonly specialHolidayEnabled?: boolean;
};

export function createDownloadTestStaff(
  overrides: Partial<StaffType> = {},
): StaffType {
  return createMockStaff({
    id: "staff-1",
    cognitoUserId: "staff-1",
    familyName: "山田",
    givenName: "太郎",
    sortKey: "yamada",
    status: "active",
    ...overrides,
  });
}

export function renderDownloadTestUI(
  ui: ReactElement,
  options: DownloadRenderOptions = {},
): RenderResult {
  const {
    router = false,
    hourlyPaidHolidayEnabled = false,
    specialHolidayEnabled = false,
  } = options;

  return renderWithProviders(ui, {
    router,
    appConfigContext: {
      getHourlyPaidHolidayEnabled: jest
        .fn()
        .mockReturnValue(hourlyPaidHolidayEnabled),
      getSpecialHolidayEnabled: jest
        .fn()
        .mockReturnValue(specialHolidayEnabled),
    },
  });
}

export function setupDownloadAnchorMocks() {
  const mockAnchorClick = jest.fn();
  const mockAnchorRemove = jest.fn();
  let capturedAnchorDownload = "";

  const originalCreateElement = document.createElement.bind(document);
  const anchor = {
    set download(value: string) {
      capturedAnchorDownload = value;
    },
    get download() {
      return capturedAnchorDownload;
    },
    href: "",
    click: mockAnchorClick,
    remove: mockAnchorRemove,
  };

  const createElementSpy = jest
    .spyOn(document, "createElement")
    .mockImplementation((tagName: string) => {
      if (tagName === "a") {
        return anchor as unknown as HTMLElement;
      }
      return originalCreateElement(tagName);
    });

  return {
    mockAnchorClick,
    mockAnchorRemove,
    get capturedAnchorDownload() {
      return capturedAnchorDownload;
    },
    restore: () => createElementSpy.mockRestore(),
  };
}
