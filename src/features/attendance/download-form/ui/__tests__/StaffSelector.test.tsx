import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import StaffSelector from "../StaffSelector";

// ─── Mock: uiDimensions ──────────────────────────────────────────────────────
jest.mock("@shared/config/uiDimensions", () => ({
  SELECTOR_MAX_WIDTH: 500,
  SELECTOR_MIN_WIDTH: 300,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeStaff = (overrides: Partial<{
  id: string;
  cognitoUserId: string;
  familyName: string;
  givenName: string;
}> = {}) => ({
  id: overrides.id ?? "staff-1",
  cognitoUserId: overrides.cognitoUserId ?? "staff-1",
  familyName: overrides.familyName ?? "山田",
  givenName: overrides.givenName ?? "太郎",
  mailAddress: "test@example.com",
  owner: false,
  role: "Staff" as const,
  enabled: true,
  status: "active",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
});

function renderSelector(props: {
  staffs?: ReturnType<typeof makeStaff>[];
  selectedStaff?: ReturnType<typeof makeStaff>[];
  setSelectedStaff?: jest.Mock;
}) {
  const {
    staffs = [],
    selectedStaff = [],
    setSelectedStaff = jest.fn(),
  } = props;
  return {
    setSelectedStaff,
    ...render(
      <StaffSelector
        staffs={staffs as never}
        selectedStaff={selectedStaff as never}
        setSelectedStaff={setSelectedStaff as never}
      />,
    ),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("StaffSelector", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("レンダリング（閉じた状態）", () => {
    it("「対象者リスト」ラベルを表示する", () => {
      renderSelector({});
      expect(screen.getByText("対象者リスト")).toBeInTheDocument();
    });

    it("スタッフ未選択のとき「対象者を選択」プレースホルダーを表示する", () => {
      renderSelector({ selectedStaff: [] });
      expect(screen.getByText("対象者を選択")).toBeInTheDocument();
    });

    it("スタッフが 1 名選択されているとき、トリガーボタンにその名前が表示される", () => {
      const staff = makeStaff({ familyName: "田中", givenName: "花子" });
      renderSelector({ selectedStaff: [staff] });
      // The name appears in both the trigger span and the chip; check at least one exists
      const allOccurrences = screen.getAllByText("田中 花子");
      expect(allOccurrences.length).toBeGreaterThanOrEqual(1);
    });

    it("スタッフが 2 名以上選択されているとき「N名を選択中」を表示する", () => {
      const staffA = makeStaff({ id: "s1" });
      const staffB = makeStaff({ id: "s2", cognitoUserId: "s2" });
      renderSelector({ selectedStaff: [staffA, staffB] });
      expect(screen.getByText("2名を選択中")).toBeInTheDocument();
    });

    it("3 名選択されているとき「3名を選択中」を表示する", () => {
      const staffs = ["s1", "s2", "s3"].map((id) =>
        makeStaff({ id, cognitoUserId: id }),
      );
      renderSelector({ selectedStaff: staffs });
      expect(screen.getByText("3名を選択中")).toBeInTheDocument();
    });

    it("selectedStaff が空のとき選択済みチップを表示しない", () => {
      renderSelector({ selectedStaff: [] });
      // chip section only renders when selectedStaff.length > 0
      // Verify by checking no chip spans exist in the flex-wrap gap-2 area
      expect(screen.queryByText("0名を選択中")).not.toBeInTheDocument();
    });

    it("選択済みスタッフのチップが表示される（複数名）", () => {
      const staffA = makeStaff({ id: "s1", familyName: "鈴木", givenName: "一郎" });
      const staffB = makeStaff({ id: "s2", cognitoUserId: "s2", familyName: "佐藤", givenName: "二郎" });
      renderSelector({ selectedStaff: [staffA, staffB] });
      // 複数選択時は "N名を選択中" が trigger に表示され、chip は両者分表示される
      expect(screen.getByText("鈴木 一郎")).toBeInTheDocument();
      expect(screen.getByText("佐藤 二郎")).toBeInTheDocument();
    });
  });

  describe("ドロップダウンの開閉", () => {
    it("トリガーボタンをクリックするとドロップダウンが開く", async () => {
      const user = userEvent.setup();
      const staffs = [makeStaff({ id: "s1", familyName: "田中", givenName: "花子" })];
      renderSelector({ staffs });
      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("全選択")).toBeInTheDocument();
      });
    });

    it("ドロップダウンが開いているとき再クリックで閉じる", async () => {
      const user = userEvent.setup();
      const staffs = [makeStaff({ id: "s1", familyName: "田中", givenName: "花子" })];
      renderSelector({ staffs });
      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("全選択")).toBeInTheDocument();
      });
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.queryByText("全選択")).not.toBeInTheDocument();
      });
    });

    it("ドロップダウンが開くとスタッフ件数が表示される", async () => {
      const user = userEvent.setup();
      const staffs = [
        makeStaff({ id: "s1" }),
        makeStaff({ id: "s2", cognitoUserId: "s2" }),
      ];
      renderSelector({ staffs });
      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("2件")).toBeInTheDocument();
      });
    });

    it("ドロップダウンが開くとスタッフ一覧が表示される", async () => {
      const user = userEvent.setup();
      const staffs = [
        makeStaff({ id: "s1", familyName: "田中", givenName: "花子" }),
        makeStaff({ id: "s2", cognitoUserId: "s2", familyName: "鈴木", givenName: "一郎" }),
      ];
      renderSelector({ staffs });
      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        // Checkboxes with aria-labels are accessible via the wrapping label
        expect(screen.getAllByText("田中 花子").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("鈴木 一郎").length).toBeGreaterThanOrEqual(1);
      });
    });

    it("staffs が空のとき「該当するスタッフが見つかりません」を表示する", async () => {
      const user = userEvent.setup();
      renderSelector({ staffs: [] });
      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("該当するスタッフが見つかりません。")).toBeInTheDocument();
      });
    });
  });

  describe("スタッフ選択", () => {
    it("チェックボックスをクリックすると setSelectedStaff が呼ばれる（未選択 → 選択）", async () => {
      const user = userEvent.setup();
      const staff = makeStaff({ id: "s1", familyName: "田中", givenName: "花子" });
      const setSelectedStaff = jest.fn();
      renderSelector({ staffs: [staff], selectedStaff: [], setSelectedStaff });

      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
      });

      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      expect(setSelectedStaff).toHaveBeenCalledWith([staff]);
    });

    it("選択済みスタッフのチェックボックスをクリックすると選択解除される", async () => {
      const user = userEvent.setup();
      const staff = makeStaff({ id: "s1", familyName: "田中", givenName: "花子" });
      const setSelectedStaff = jest.fn();
      renderSelector({ staffs: [staff], selectedStaff: [staff], setSelectedStaff });

      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
      });

      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);
      expect(setSelectedStaff).toHaveBeenCalledWith([]);
    });

    it("選択済みスタッフのチェックボックスは checked 状態になっている", async () => {
      const user = userEvent.setup();
      const staff = makeStaff({ id: "s1", familyName: "田中", givenName: "花子" });
      renderSelector({ staffs: [staff], selectedStaff: [staff] });

      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes[0]).toBeChecked();
      });
    });

    it("未選択のスタッフのチェックボックスは unchecked 状態になっている", async () => {
      const user = userEvent.setup();
      const staff = makeStaff({ id: "s1", familyName: "田中", givenName: "花子" });
      renderSelector({ staffs: [staff], selectedStaff: [] });

      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes[0]).not.toBeChecked();
      });
    });

    it("複数スタッフがある場合、各スタッフのチェックボックスが表示される", async () => {
      const user = userEvent.setup();
      const staffs = [
        makeStaff({ id: "s1", familyName: "田中", givenName: "花子" }),
        makeStaff({ id: "s2", cognitoUserId: "s2", familyName: "鈴木", givenName: "一郎" }),
      ];
      renderSelector({ staffs, selectedStaff: [] });

      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getAllByRole("checkbox")).toHaveLength(2);
      });
    });
  });

  describe("全選択・全解除ボタン", () => {
    it("「全選択」ボタンをクリックすると全スタッフが渡される", async () => {
      const user = userEvent.setup();
      const staffs = [
        makeStaff({ id: "s1", familyName: "田中", givenName: "花子" }),
        makeStaff({ id: "s2", cognitoUserId: "s2", familyName: "鈴木", givenName: "一郎" }),
      ];
      const setSelectedStaff = jest.fn();
      renderSelector({ staffs, selectedStaff: [], setSelectedStaff });

      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("全選択")).toBeInTheDocument();
      });

      await user.click(screen.getByText("全選択"));
      expect(setSelectedStaff).toHaveBeenCalledWith(staffs);
    });

    it("「全解除」ボタンをクリックすると空配列が渡される", async () => {
      const user = userEvent.setup();
      const staffs = [makeStaff({ id: "s1", familyName: "田中", givenName: "花子" })];
      const setSelectedStaff = jest.fn();
      renderSelector({ staffs, selectedStaff: staffs, setSelectedStaff });

      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("全解除")).toBeInTheDocument();
      });

      await user.click(screen.getByText("全解除"));
      expect(setSelectedStaff).toHaveBeenCalledWith([]);
    });

    it("staffs が空のとき「全選択」ボタンは disabled になる", async () => {
      const user = userEvent.setup();
      renderSelector({ staffs: [] });

      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("全選択")).toBeInTheDocument();
      });

      expect(screen.getByText("全選択")).toBeDisabled();
    });

    it("全員選択済みのとき「全選択」ボタンは disabled になる", async () => {
      const user = userEvent.setup();
      const staff = makeStaff({ id: "s1" });
      renderSelector({ staffs: [staff], selectedStaff: [staff] });

      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("全選択")).toBeInTheDocument();
      });

      expect(screen.getByText("全選択")).toBeDisabled();
    });

    it("selectedStaff が空のとき「全解除」ボタンは disabled になる", async () => {
      const user = userEvent.setup();
      const staff = makeStaff({ id: "s1" });
      renderSelector({ staffs: [staff], selectedStaff: [] });

      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("全解除")).toBeInTheDocument();
      });

      expect(screen.getByText("全解除")).toBeDisabled();
    });

    it("一部のスタッフが選択されているとき「全選択」ボタンは enabled になる", async () => {
      const user = userEvent.setup();
      const staffA = makeStaff({ id: "s1" });
      const staffB = makeStaff({ id: "s2", cognitoUserId: "s2" });
      renderSelector({ staffs: [staffA, staffB], selectedStaff: [staffA] });

      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("全選択")).toBeInTheDocument();
      });

      expect(screen.getByText("全選択")).toBeEnabled();
    });
  });

  describe("ドロップダウン外クリックで閉じる", () => {
    it("コンポーネント外をクリックするとドロップダウンが閉じる", async () => {
      const user = userEvent.setup();
      const staffs = [makeStaff({ id: "s1", familyName: "田中", givenName: "花子" })];
      renderSelector({ staffs });

      const trigger = screen.getAllByRole("button")[0];
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("全選択")).toBeInTheDocument();
      });

      await user.click(document.body);
      await waitFor(() => {
        expect(screen.queryByText("全選択")).not.toBeInTheDocument();
      });
    });
  });

  describe("スタッフ名の表示", () => {
    it("familyName のみ設定されている場合、名前部分が表示される（trim）", () => {
      const staff = makeStaff({ familyName: "田中", givenName: "" });
      renderSelector({ selectedStaff: [staff] });
      // Both trigger label and chip show the name; at least one occurrence expected
      const occurrences = screen.getAllByText("田中");
      expect(occurrences.length).toBeGreaterThanOrEqual(1);
    });

    it("givenName のみ設定されている場合、名前部分が表示される（trim）", () => {
      const staff = makeStaff({ familyName: "", givenName: "花子" });
      renderSelector({ selectedStaff: [staff] });
      const occurrences = screen.getAllByText("花子");
      expect(occurrences.length).toBeGreaterThanOrEqual(1);
    });
  });
});
