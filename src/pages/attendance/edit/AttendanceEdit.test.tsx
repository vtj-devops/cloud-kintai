import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { render, screen, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import type { ContextType } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import AttendanceEdit from "./AttendanceEdit";

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => jest.fn(),
    useParams: () => ({ targetWorkDate: "2026-03-31" }),
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
  };
});

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  useStaffs: () => ({
    staffs: [
      {
        cognitoUserId: "user-1",
      },
    ],
    loading: false,
    error: null,
  }),
}));

jest.mock("@entities/attendance/api/attendanceApi", () => ({
  useCreateAttendanceMutation: () => [jest.fn()],
  useUpdateAttendanceMutation: () => [jest.fn()],
  useGetAttendanceByStaffAndDateQuery: () => ({
    data: null,
    isLoading: false,
    isFetching: false,
    isUninitialized: false,
    error: null,
  }),
}));

jest.mock("@shared/lib/useAppNotification", () => ({
  useAppNotification: () => ({
    notify: jest.fn(),
  }),
}));

jest.mock("./useAttendanceEditFormSync", () => ({
  useAttendanceEditFormSync: () => ({
    isOnBreak: false,
  }),
}));

jest.mock("@features/attendance/edit/ui/AttendanceEditForm", () => ({
  AttendanceEditForm: function MockAttendanceEditForm() {
    return (
      <>
        <div data-testid="attendance-mobile-editor">mobile-editor</div>
        <div data-testid="attendance-desktop-editor">desktop-editor</div>
      </>
    );
  },
}));

jest.mock("./AttendanceEditErrorAlert", () => ({
  AttendanceEditErrorAlert: () => <div>error-alert</div>,
}));

jest.mock("./sendChangeRequestMail", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("AttendanceEdit layout", () => {
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

  it("renders inside the content width preset", async () => {
    const { container } = renderWithRouter(
      <AuthContext.Provider
        value={{
          signOut: jest.fn(),
          signIn: jest.fn(),
          isCognitoUserRole: () => false,
          authStatus: "authenticated",
          cognitoUser: { id: "user-1" } as never,
        }}
      >
        <AppConfigContext.Provider
          value={{
            getHourlyPaidHolidayEnabled: () => false,
            getStartTime: () => dayjs("09:00", "HH:mm"),
            getEndTime: () => dayjs("18:00", "HH:mm"),
            getLunchRestStartTime: () => dayjs("12:00", "HH:mm"),
            getLunchRestEndTime: () => dayjs("13:00", "HH:mm"),
            fetchConfig: jest.fn(),
            saveConfig: jest.fn(),
          } as unknown as ContextType<typeof AppConfigContext>}
        >
          <AttendanceEdit />
        </AppConfigContext.Provider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText("desktop-editor")).toBeInTheDocument();
    });
    expect(
      container.querySelector('div[style*="component-page-widths-content"]'),
    ).toBeTruthy();
  });
});
