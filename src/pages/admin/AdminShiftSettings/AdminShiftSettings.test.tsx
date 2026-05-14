import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import AdminShiftSettings from "./AdminShiftSettings";

jest.mock("@/app/hooks", () => ({
  useAppDispatchV2: () => jest.fn(),
}));

jest.mock("@/features/admin-config-shift/useAdminShiftSettings", () => ({
  useAdminShiftSettings: jest.fn(() => ({
    control: {},
    fields: [],
    validationDetails: [],
    hasValidationError: false,
    savingShiftGroup: false,
    savingShiftDisplay: false,
    isDirty: false,
    isBusy: false,
    shiftDefaultMode: "normal",
    setShiftDefaultMode: jest.fn(),
    handleAddGroup: jest.fn(),
    handleRemoveGroup: jest.fn(),
    handleSaveShiftGroup: jest.fn(),
    handleSaveShiftDisplay: jest.fn(),
  })),
}));

describe("AdminShiftSettings", () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: ui,
        },
      ],
      { initialEntries: ["/"] },
    );

    return render(<RouterProvider router={router} />);
  };

  it("switches between shift group and shift display tabs", async () => {
    const user = userEvent.setup();
    const shiftGroupTab = "シフトグループ";
    const shiftDisplayTab = "シフト表示";

    renderWithRouter(<AdminShiftSettings />);

    expect(screen.getByRole("tab", { name: shiftGroupTab })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("heading", { name: shiftGroupTab }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: shiftDisplayTab }));

    expect(screen.getByRole("tab", { name: shiftDisplayTab })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("表示モード")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "共同編集モード" }),
    ).toBeEnabled();
  });
});
