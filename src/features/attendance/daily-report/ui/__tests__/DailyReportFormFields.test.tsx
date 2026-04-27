import { fireEvent,render, screen } from "@testing-library/react";

import { DailyReportFormFields } from "../DailyReportFormFields";

const defaultForm = {
  date: "2024-01-15",
  author: "テストユーザー",
  title: "今日の業務",
  content: "タスク完了",
};

describe("DailyReportFormFields", () => {
  describe("フォームフィールドの表示", () => {
    it("タイトル入力フィールドを表示する", () => {
      const onChange = jest.fn();
      render(<DailyReportFormFields form={defaultForm} onChange={onChange} />);
      const titleInput = screen.getByRole("textbox", { name: "タイトル" });
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).toHaveValue("今日の業務");
    });

    it("内容テキストエリアを表示する", () => {
      const onChange = jest.fn();
      render(<DailyReportFormFields form={defaultForm} onChange={onChange} />);
      const textarea = screen.getByPlaceholderText(
        "例) サマリ/実施タスク/課題などをまとめて記入",
      );
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue("タスク完了");
    });

    it("全画面入力ボタンを表示する", () => {
      const onChange = jest.fn();
      render(<DailyReportFormFields form={defaultForm} onChange={onChange} />);
      expect(screen.getByLabelText("全画面で入力")).toBeInTheDocument();
    });
  });

  describe("onChange コールバック", () => {
    it("タイトル変更時に onChange('title', value) を呼ぶ", () => {
      const onChange = jest.fn();
      render(<DailyReportFormFields form={defaultForm} onChange={onChange} />);
      const titleInput = screen.getByRole("textbox", { name: "タイトル" });
      fireEvent.change(titleInput, { target: { value: "新しいタイトル" } });
      expect(onChange).toHaveBeenCalledWith("title", "新しいタイトル");
    });

    it("内容変更時に onChange('content', value) を呼ぶ", () => {
      const onChange = jest.fn();
      render(<DailyReportFormFields form={defaultForm} onChange={onChange} />);
      const textarea = screen.getByPlaceholderText(
        "例) サマリ/実施タスク/課題などをまとめて記入",
      );
      fireEvent.change(textarea, { target: { value: "新しい内容" } });
      expect(onChange).toHaveBeenCalledWith("content", "新しい内容");
    });
  });

  describe("モバイル全画面入力", () => {
    it("全画面ボタンをクリックするとオーバーレイが表示される", () => {
      const onChange = jest.fn();
      render(<DailyReportFormFields form={defaultForm} onChange={onChange} />);
      fireEvent.click(screen.getByLabelText("全画面で入力"));
      expect(screen.getByText("閉じる")).toBeInTheDocument();
    });

    it("閉じるボタンをクリックするとオーバーレイが閉じる", () => {
      const onChange = jest.fn();
      render(<DailyReportFormFields form={defaultForm} onChange={onChange} />);
      fireEvent.click(screen.getByLabelText("全画面で入力"));
      fireEvent.click(screen.getByText("閉じる"));
      expect(screen.queryByText("閉じる")).not.toBeInTheDocument();
    });

    it("全画面オーバーレイ内の textarea で onChange が呼ばれる", () => {
      const onChange = jest.fn();
      render(<DailyReportFormFields form={defaultForm} onChange={onChange} />);
      fireEvent.click(screen.getByLabelText("全画面で入力"));
      const textareas = screen.getAllByPlaceholderText(
        "例) サマリ/実施タスク/課題などをまとめて記入",
      );
      const overlayTextarea = textareas[textareas.length - 1];
      fireEvent.change(overlayTextarea, { target: { value: "全画面入力" } });
      expect(onChange).toHaveBeenCalledWith("content", "全画面入力");
    });
  });

  describe("空フォームの表示", () => {
    it("空の form でもクラッシュしない", () => {
      const onChange = jest.fn();
      const emptyForm = { date: "", author: "", title: "", content: "" };
      render(<DailyReportFormFields form={emptyForm} onChange={onChange} />);
      expect(
        screen.getByRole("textbox", { name: "タイトル" }),
      ).toBeInTheDocument();
    });
  });
});
