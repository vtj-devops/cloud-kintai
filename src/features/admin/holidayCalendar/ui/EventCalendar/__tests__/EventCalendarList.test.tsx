import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EventCalendarList from "../EventCalendarList";

const mockDispatch = jest.fn();
jest.mock("@app/hooks", () => ({
  useAppDispatchV2: () => mockDispatch,
}));

const mockGetQuery = jest.fn();
const mockCreateMutation = jest.fn();
const mockUpdateMutation = jest.fn();
const mockDeleteMutation = jest.fn();
const mockBulkCreateMutation = jest.fn();

jest.mock("@entities/calendar/api/calendarApi", () => ({
  useGetEventCalendarsQuery: () => mockGetQuery(),
  useCreateEventCalendarMutation: () => [mockCreateMutation],
  useUpdateEventCalendarMutation: () => [mockUpdateMutation],
  useDeleteEventCalendarMutation: () => [mockDeleteMutation],
  useBulkCreateEventCalendarsMutation: () => [mockBulkCreateMutation],
}));

jest.mock("@shared/api/graphql/concurrency", () => ({
  buildVersionOrUpdatedAtCondition: jest.fn().mockReturnValue({}),
  getNextVersion: jest.fn().mockReturnValue(2),
}));

const pushNotificationMock = jest.fn(
  (payload: { tone: string; message: string }) => ({
    type: "notification/push",
    payload,
  }),
);

jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: (...args: Parameters<typeof pushNotificationMock>) =>
    pushNotificationMock(...args),
}));

jest.mock("@/errors", () => ({
  E00001: "データ取得中に問題が発生しました(エラーコード: E00001)",
}));

jest.mock("../AddEventCalendar", () => ({
  AddEventCalendar: () => <button>イベントを追加</button>,
}));

jest.mock("../CSVFilePicker", () => ({
  CSVFilePicker: () => <button>CSVからまとめて追加</button>,
}));

jest.mock("../EventCalendarCopy", () => ({
  __esModule: true,
  default: () => <button aria-label="コピー">コピー</button>,
}));

jest.mock("../EventCalendarEdit", () => ({
  __esModule: true,
  default: () => <button aria-label="編集">編集</button>,
}));

jest.mock(
  "@features/admin/holidayCalendar/ui/components/EventCalendarDelete",
  () => ({
    __esModule: true,
    default: () => <button aria-label="削除">削除</button>,
  }),
);

jest.mock("@shared/ui/button", () => ({
  AppButton: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

jest.mock("@features/admin/holidayCalendar/ui/components/EventDateTableCell", () => ({
  __esModule: true,
  default: ({ eventCalendar }: { eventCalendar: { eventDate: string } }) => (
    <td>{eventCalendar.eventDate.replace(/-/g, "/")}</td>
  ),
}));

jest.mock("@features/admin/holidayCalendar/ui/components/EventNameTableCell", () => ({
  __esModule: true,
  default: ({ eventCalendar }: { eventCalendar: { name: string } }) => (
    <td>{eventCalendar.name}</td>
  ),
}));

jest.mock("@features/admin/holidayCalendar/ui/components/CreatedAtTableCell", () => ({
  __esModule: true,
  default: ({ holidayCalendar }: { holidayCalendar: { createdAt: string } }) => (
    <td>{holidayCalendar.createdAt}</td>
  ),
}));

const makeEvent = (overrides: {
  id?: string;
  eventDate?: string;
  name?: string;
  createdAt?: string;
}) => ({
  id: overrides.id ?? "e-1",
  eventDate: overrides.eventDate ?? "2024-01-01",
  name: overrides.name ?? "キックオフ",
  description: null,
  createdAt: overrides.createdAt ?? "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  version: 1,
  owner: "owner-1",
});

const sampleEvents = [
  makeEvent({ id: "e-1", eventDate: "2024-01-01", name: "キックオフ" }),
  makeEvent({ id: "e-2", eventDate: "2024-02-02", name: "定例会" }),
  makeEvent({ id: "e-3", eventDate: "2024-03-03", name: "研修" }),
];

function setupDefaultMocks() {
  mockGetQuery.mockReturnValue({
    data: sampleEvents,
    isLoading: false,
    isFetching: false,
    error: undefined,
  });
  mockCreateMutation.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
  mockUpdateMutation.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
  mockDeleteMutation.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
  mockBulkCreateMutation.mockReturnValue({
    unwrap: jest.fn().mockResolvedValue([]),
  });
}

describe("EventCalendarList", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupDefaultMocks();
  });

  it("ローディング中は ProgressBar が表示される", () => {
    mockGetQuery.mockReturnValue({
      data: [],
      isLoading: true,
      isFetching: false,
      error: undefined,
    });

    render(<EventCalendarList />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("ロード後にテーブルとフィルターが表示される", () => {
    render(<EventCalendarList />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByLabelText("年")).toBeInTheDocument();
    expect(screen.getByLabelText("月")).toBeInTheDocument();
    expect(screen.getByLabelText("イベント名で検索")).toBeInTheDocument();
  });

  it("イベント名・アクションボタンが表示される", () => {
    render(<EventCalendarList />);

    expect(screen.getByText("キックオフ")).toBeInTheDocument();
    expect(screen.getByText("定例会")).toBeInTheDocument();
    expect(screen.getByText("研修")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "編集" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "コピー" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "削除" })).toHaveLength(3);
  });

  it("イベント名検索で部分一致フィルタリングできる", async () => {
    const user = userEvent.setup();
    render(<EventCalendarList />);

    await user.type(screen.getByLabelText("イベント名で検索"), "定例");

    await waitFor(() => {
      expect(screen.getByText("定例会")).toBeInTheDocument();
      expect(screen.queryByText("キックオフ")).not.toBeInTheDocument();
      expect(screen.queryByText("研修")).not.toBeInTheDocument();
    });
  });

  it("クリアでフィルターが初期化される", async () => {
    const user = userEvent.setup();
    render(<EventCalendarList />);

    await user.type(screen.getByLabelText("イベント名で検索"), "定例");
    await user.click(screen.getByRole("button", { name: "クリア" }));

    await waitFor(() => {
      expect(screen.getByText("キックオフ")).toBeInTheDocument();
      expect(screen.getByText("定例会")).toBeInTheDocument();
      expect(screen.getByText("研修")).toBeInTheDocument();
    });
  });

  it("ページネーション表示が出る", () => {
    render(<EventCalendarList />);

    expect(screen.getByLabelText("表示件数")).toBeInTheDocument();
    expect(screen.getByText("1-3 / 3 件")).toBeInTheDocument();
  });

  it("データ取得エラー時に通知を dispatch する", async () => {
    mockGetQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: new Error("Fetch failed"),
    });

    render(<EventCalendarList />);

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "error",
          message: expect.stringContaining("E00001"),
        }),
      );
    });
  });
});
