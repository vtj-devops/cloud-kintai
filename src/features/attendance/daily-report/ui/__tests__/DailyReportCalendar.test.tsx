import { fireEvent,render, screen } from "@testing-library/react";
import dayjs from "dayjs";

import { DailyReportCalendar } from "../DailyReportCalendar";

// SCSS import
jest.mock("../DailyReportCalendar.scss", () => ({}));

const BASE_DATE = dayjs("2024-01-15");

// matchMedia mock (desktop = not mobile by default)
function setupMatchMedia(isMobile = false) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: isMobile ? query.includes("max-width") : false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

beforeEach(() => {
  setupMatchMedia(false);
});

describe("DailyReportCalendar", () => {
  describe("基本表示", () => {
    it("カレンダーを aria-label 付きで表示する", () => {
      render(
        <DailyReportCalendar
          value={BASE_DATE}
          reportedDateSet={new Set()}
          onChange={jest.fn()}
        />,
      );
      expect(
        screen.getByRole("group", { name: "日報カレンダー" }),
      ).toBeInTheDocument();
    });

    it("曜日ラベルを全て表示する", () => {
      render(
        <DailyReportCalendar
          value={BASE_DATE}
          reportedDateSet={new Set()}
          onChange={jest.fn()}
        />,
      );
      for (const label of ["日", "月", "火", "水", "木", "金", "土"]) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    });

    it("前月・翌月ナビゲーションボタンを表示する", () => {
      render(
        <DailyReportCalendar
          value={BASE_DATE}
          reportedDateSet={new Set()}
          onChange={jest.fn()}
        />,
      );
      expect(screen.getByLabelText("前月")).toBeInTheDocument();
      expect(screen.getByLabelText("翌月")).toBeInTheDocument();
    });
  });

  describe("デスクトップ表示（月ビュー）", () => {

    it("YYYY年MM月形式でヘッダーを表示する", () => {
      render(
        <DailyReportCalendar
          value={BASE_DATE}
          reportedDateSet={new Set()}
          onChange={jest.fn()}
        />,
      );
      expect(screen.getByText("2024年01月")).toBeInTheDocument();
    });

    it("選択日の aria-pressed が true になる", () => {
      render(
        <DailyReportCalendar
          value={BASE_DATE}
          reportedDateSet={new Set()}
          onChange={jest.fn()}
        />,
      );
      const buttons = screen.getAllByRole("button", { name: /^15$/ });
      const selected = buttons.find(
        (b) => b.getAttribute("aria-pressed") === "true",
      );
      expect(selected).toBeInTheDocument();
    });

    it("日をクリックすると onChange が呼ばれる", () => {
      const onChange = jest.fn();
      render(
        <DailyReportCalendar
          value={BASE_DATE}
          reportedDateSet={new Set()}
          onChange={onChange}
        />,
      );
      const buttons = screen.getAllByRole("button", { name: /^10$/ });
      fireEvent.click(buttons[0]);
      expect(onChange).toHaveBeenCalled();
    });

    it("翌月ボタンをクリックすると翌月が表示される", () => {
      render(
        <DailyReportCalendar
          value={BASE_DATE}
          reportedDateSet={new Set()}
          onChange={jest.fn()}
        />,
      );
      fireEvent.click(screen.getByLabelText("翌月"));
      expect(screen.getByText("2024年02月")).toBeInTheDocument();
    });

    it("前月ボタンをクリックすると前月が表示される", () => {
      render(
        <DailyReportCalendar
          value={BASE_DATE}
          reportedDateSet={new Set()}
          onChange={jest.fn()}
        />,
      );
      fireEvent.click(screen.getByLabelText("前月"));
      expect(screen.getByText("2023年12月")).toBeInTheDocument();
    });

    it("reportedDateSet に含まれる日は dr-calendar-day--reported クラスを持つ", () => {
      const reported = new Set(["2024-01-10"]);
      render(
        <DailyReportCalendar
          value={BASE_DATE}
          reportedDateSet={reported}
          onChange={jest.fn()}
        />,
      );
      const buttons = screen.getAllByRole("button");
      const reportedBtn = buttons.find(
        (b) =>
          b.className.includes("dr-calendar-day--reported") &&
          b.textContent === "10",
      );
      expect(reportedBtn).toBeInTheDocument();
    });
  });

  describe("日付クリック後のリセット", () => {
    it("日をクリックした後に monthOffset がリセットされる（翌月→選択で当月に戻る）", () => {
      const onChange = jest.fn();
      render(
        <DailyReportCalendar
          value={BASE_DATE}
          reportedDateSet={new Set()}
          onChange={onChange}
        />,
      );
      // 翌月へ
      fireEvent.click(screen.getByLabelText("翌月"));
      expect(screen.getByText("2024年02月")).toBeInTheDocument();
      // 2月の1日をクリック
      const dayButtons = screen.getAllByRole("button", { name: /^1$/ });
      fireEvent.click(dayButtons[0]);
      expect(onChange).toHaveBeenCalled();
    });
  });
});
