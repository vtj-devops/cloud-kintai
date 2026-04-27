import { fireEvent,render, screen } from "@testing-library/react";
import dayjs from "dayjs";

import DateField from "../DateField";

jest.mock("react-day-picker/dist/style.css", () => ({}));
jest.mock("react-day-picker", () => ({
  DayPicker: ({
    onSelect,
    selected,
  }: {
    onSelect: (d: Date | undefined) => void;
    selected?: Date;
  }) => (
    <div data-testid="day-picker">
      <button
        data-testid="pick-day"
        onClick={() => onSelect(new Date("2024-04-15"))}
      >
        pick
      </button>
      <button data-testid="pick-null" onClick={() => onSelect(undefined)}>
        clear
      </button>
      {selected && (
        <span data-testid="selected-date">{selected.toISOString()}</span>
      )}
    </div>
  ),
}));

describe("DateField", () => {
  it("labelとplaceholderが表示される", () => {
    render(
      <DateField
        label="日付"
        value={null}
        onChange={jest.fn()}
        placeholder="選択してください"
      />
    );
    expect(screen.getByText("日付")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("選択してください")).toBeInTheDocument();
  });

  it("requiredの場合にアスタリスクが表示される", () => {
    render(<DateField label="日付" value={null} onChange={jest.fn()} required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("valueが設定されている場合にフォーマットされた日付が表示される", () => {
    render(
      <DateField value={dayjs("2024-04-15")} onChange={jest.fn()} />
    );
    expect(screen.getByDisplayValue("2024/04/15")).toBeInTheDocument();
  });

  it("valueがnullの場合に空文字が表示される", () => {
    render(<DateField value={null} onChange={jest.fn()} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  it("カレンダーボタンをクリックするとDayPickerが表示される", () => {
    render(<DateField value={null} onChange={jest.fn()} />);
    expect(screen.queryByTestId("day-picker")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("日付を選択"));
    expect(screen.getByTestId("day-picker")).toBeInTheDocument();
  });

  it("DayPickerで日付を選択するとonChangeが呼ばれてカレンダーが閉じる", () => {
    const onChange = jest.fn();
    render(<DateField value={null} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("日付を選択"));
    fireEvent.click(screen.getByTestId("pick-day"));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ $d: expect.any(Date) }));
    expect(screen.queryByTestId("day-picker")).not.toBeInTheDocument();
  });

  it("DayPickerでundefinedを選択するとonChange(null)が呼ばれる", () => {
    const onChange = jest.fn();
    render(<DateField value={dayjs("2024-04-15")} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("日付を選択"));
    fireEvent.click(screen.getByTestId("pick-null"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("テキスト入力で有効な日付を入力するとonChangeが呼ばれる", () => {
    const onChange = jest.fn();
    render(<DateField value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "2024/04/15" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ $d: expect.any(Date) })
    );
  });

  it("テキスト入力で空文字を入力するとonChange(null)が呼ばれる", () => {
    const onChange = jest.fn();
    render(<DateField value={dayjs("2024-04-15")} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("無効な日付文字列を入力してもonChangeは呼ばれない", () => {
    const onChange = jest.fn();
    render(<DateField value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "invalid" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("onBlurで有効な下書きをコミットしてdraftをリセットする", () => {
    const onChange = jest.fn();
    render(<DateField value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "2024/04/20" } });
    onChange.mockClear();
    fireEvent.blur(input);
    // draft is cleared (displayed value from value prop, but value prop hasn't changed in this test)
    expect(onChange).toHaveBeenCalled();
  });

  it("helperTextが表示される", () => {
    render(
      <DateField value={null} onChange={jest.fn()} helperText="ヘルプテキスト" />
    );
    expect(screen.getByText("ヘルプテキスト")).toBeInTheDocument();
  });

  it("errorTextが表示される", () => {
    render(
      <DateField value={null} onChange={jest.fn()} errorText="エラーです" />
    );
    expect(screen.getByText("エラーです")).toBeInTheDocument();
  });

  it("disabledのとき入力とボタンが無効化される", () => {
    render(<DateField value={null} onChange={jest.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByLabelText("日付を選択")).toBeDisabled();
  });

  it("YYYY/MMフォーマットで年月のみの入力を受け付ける", () => {
    const onChange = jest.fn();
    render(
      <DateField value={null} onChange={onChange} format="YYYY/MM" monthOnly />
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "2024/04" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ $d: expect.any(Date) })
    );
  });

  it("フォーカスするとカレンダーが開く", () => {
    render(<DateField value={null} onChange={jest.fn()} />);
    fireEvent.focus(screen.getByRole("textbox"));
    expect(screen.getByTestId("day-picker")).toBeInTheDocument();
  });
});
