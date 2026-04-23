import { fireEvent,render, screen } from "@testing-library/react";

import { DateField } from "../DateField";
import { DateRangeField } from "../DateRangeField";
import { TemplateSelectField } from "../TemplateSelectField";
import { TextareaField } from "../TextareaField";
import { TextField } from "../TextField";
import { TimeField } from "../TimeField";
import { TimeRangeField } from "../TimeRangeField";

jest.mock("../WorkflowTypeFields.module.scss", () => ({
  formRow: "formRow",
  formLabel: "formLabel",
  formField: "formField",
  input: "input",
  inputError: "inputError",
  errorText: "errorText",
  textarea: "textarea",
  dateInput: "dateInput",
  inlineGroup: "inlineGroup",
  dateSeparator: "dateSeparator",
  timeFieldGroup: "timeFieldGroup",
  timeInputGroup: "timeInputGroup",
  timeSeparator: "timeSeparator",
  selectWrap: "selectWrap",
  select: "select",
  selectIcon: "selectIcon",
  applyButton: "applyButton",
}));

jest.mock("@shared/ui/TimeInput", () => ({
  TimeInput: ({
    value,
    onChange,
  }: {
    value: string | null;
    onChange: (v: string | null) => void;
  }) => (
    <input
      data-testid="time-input"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
    />
  ),
}));

jest.mock(
  "@entities/workflow-template/api/workflowTemplateApi",
  () => ({
    useGetWorkflowTemplatesQuery: jest.fn(() => ({
      data: [
        { id: "t1", name: "テンプレート1", title: "タイトル1", content: "内容1" },
        { id: "t2", name: "テンプレート2", title: "タイトル2", content: "内容2" },
      ],
    })),
  }),
);

const baseConfig = { key: "field1", type: "text" as const, label: "フィールド" };

// ─────────────────────────────────────────────
// TextField
// ─────────────────────────────────────────────
describe("TextField", () => {
  it("ラベルと入力フィールドを表示する", () => {
    render(
      <TextField config={baseConfig} value="テスト" onChange={jest.fn()} />,
    );
    expect(screen.getByText("フィールド")).toBeInTheDocument();
    expect(screen.getByDisplayValue("テスト")).toBeInTheDocument();
  });

  it("入力変更時に onChange を呼ぶ", () => {
    const onChange = jest.fn();
    render(<TextField config={baseConfig} value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "新値" } });
    expect(onChange).toHaveBeenCalledWith("新値");
  });

  it("エラーメッセージを表示する", () => {
    render(
      <TextField
        config={baseConfig}
        value=""
        onChange={jest.fn()}
        error="必須項目です"
      />,
    );
    expect(screen.getByText("必須項目です")).toBeInTheDocument();
  });

  it("disabled のとき入力を無効化する", () => {
    render(
      <TextField config={baseConfig} value="" onChange={jest.fn()} disabled />,
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});

// ─────────────────────────────────────────────
// DateField
// ─────────────────────────────────────────────
describe("DateField", () => {
  const dateConfig = { key: "date", type: "date" as const, label: "日付" };

  it("ラベルと日付入力を表示する", () => {
    render(
      <DateField
        config={dateConfig}
        value="2024-01-15"
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText("日付")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2024-01-15")).toBeInTheDocument();
  });

  it("日付変更時に onChange を呼ぶ", () => {
    const onChange = jest.fn();
    render(<DateField config={dateConfig} value="" onChange={onChange} />);
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2024-02-01" } });
    expect(onChange).toHaveBeenCalledWith("2024-02-01");
  });

  it("エラーを表示する", () => {
    render(
      <DateField
        config={dateConfig}
        value=""
        onChange={jest.fn()}
        error="日付エラー"
      />,
    );
    expect(screen.getByText("日付エラー")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// TextareaField
// ─────────────────────────────────────────────
describe("TextareaField", () => {
  const taConfig = {
    key: "memo",
    type: "textarea" as const,
    label: "メモ",
  };

  it("ラベルと textarea を表示する", () => {
    render(
      <TextareaField
        config={taConfig}
        value="メモ内容"
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText("メモ")).toBeInTheDocument();
    expect(screen.getByDisplayValue("メモ内容")).toBeInTheDocument();
  });

  it("変更時に onChange を呼ぶ", () => {
    const onChange = jest.fn();
    render(<TextareaField config={taConfig} value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "新しいメモ" },
    });
    expect(onChange).toHaveBeenCalledWith("新しいメモ");
  });

  it("エラーを表示する", () => {
    render(
      <TextareaField
        config={taConfig}
        value=""
        onChange={jest.fn()}
        error="メモエラー"
      />,
    );
    expect(screen.getByText("メモエラー")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// TimeField
// ─────────────────────────────────────────────
describe("TimeField", () => {
  const timeConfig = {
    key: "start",
    type: "time" as const,
    label: "開始時間",
  };

  it("ラベルと TimeInput を表示する", () => {
    render(
      <TimeField config={timeConfig} value="09:00" onChange={jest.fn()} />,
    );
    expect(screen.getByText("開始時間")).toBeInTheDocument();
    expect(screen.getByTestId("time-input")).toBeInTheDocument();
  });

  it("TimeInput 変更時に onChange を呼ぶ", () => {
    const onChange = jest.fn();
    render(<TimeField config={timeConfig} value={null} onChange={onChange} />);
    fireEvent.change(screen.getByTestId("time-input"), {
      target: { value: "10:00" },
    });
    expect(onChange).toHaveBeenCalledWith("10:00");
  });

  it("value が null でもクラッシュしない", () => {
    render(
      <TimeField config={timeConfig} value={null} onChange={jest.fn()} />,
    );
    expect(screen.getByTestId("time-input")).toHaveValue("");
  });
});

// ─────────────────────────────────────────────
// TimeRangeField
// ─────────────────────────────────────────────
describe("TimeRangeField", () => {
  const trConfig = {
    key: "timeRange",
    type: "time_range" as const,
    label: "時間帯",
  };

  it("ラベルと2つの TimeInput を表示する", () => {
    render(
      <TimeRangeField
        config={trConfig}
        value={{ start: "09:00", end: "18:00" }}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText("時間帯")).toBeInTheDocument();
    expect(screen.getAllByTestId("time-input")).toHaveLength(2);
  });

  it("start 変更時に onChange({ start, end }) を呼ぶ", () => {
    const onChange = jest.fn();
    render(
      <TimeRangeField
        config={trConfig}
        value={{ start: "09:00", end: "18:00" }}
        onChange={onChange}
      />,
    );
    const [startInput] = screen.getAllByTestId("time-input");
    fireEvent.change(startInput, { target: { value: "10:00" } });
    expect(onChange).toHaveBeenCalledWith({ start: "10:00", end: "18:00" });
  });

  it("end 変更時に onChange({ start, end }) を呼ぶ", () => {
    const onChange = jest.fn();
    render(
      <TimeRangeField
        config={trConfig}
        value={{ start: "09:00", end: "18:00" }}
        onChange={onChange}
      />,
    );
    const [, endInput] = screen.getAllByTestId("time-input");
    fireEvent.change(endInput, { target: { value: "19:00" } });
    expect(onChange).toHaveBeenCalledWith({ start: "09:00", end: "19:00" });
  });

  it("不正な value は { start: null, end: null } として扱う", () => {
    render(
      <TimeRangeField
        config={trConfig}
        value={null as unknown as { start: string | null; end: string | null }}
        onChange={jest.fn()}
      />,
    );
    const inputs = screen.getAllByTestId("time-input");
    expect(inputs[0]).toHaveValue("");
    expect(inputs[1]).toHaveValue("");
  });

  it("エラーを表示する", () => {
    render(
      <TimeRangeField
        config={trConfig}
        value={{ start: null, end: null }}
        onChange={jest.fn()}
        error="時間帯エラー"
      />,
    );
    expect(screen.getByText("時間帯エラー")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// DateRangeField
// ─────────────────────────────────────────────
describe("DateRangeField", () => {
  const drConfig = {
    key: "dateRange",
    type: "date_range" as const,
    label: "期間",
  };

  it("ラベルと2つの date 入力を表示する", () => {
    render(
      <DateRangeField
        config={drConfig}
        value={{ start: "2024-01-01", end: "2024-01-31" }}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText("期間")).toBeInTheDocument();
    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs).toHaveLength(2);
  });

  it("start 変更時に onChange を呼ぶ", () => {
    const onChange = jest.fn();
    render(
      <DateRangeField
        config={drConfig}
        value={{ start: "2024-01-01", end: "2024-01-31" }}
        onChange={onChange}
      />,
    );
    const [startInput] = document.querySelectorAll('input[type="date"]');
    fireEvent.change(startInput, { target: { value: "2024-02-01" } });
    expect(onChange).toHaveBeenCalledWith({
      start: "2024-02-01",
      end: "2024-01-31",
    });
  });

  it("end 変更時に onChange を呼ぶ", () => {
    const onChange = jest.fn();
    render(
      <DateRangeField
        config={drConfig}
        value={{ start: "2024-01-01", end: "2024-01-31" }}
        onChange={onChange}
      />,
    );
    const [, endInput] = document.querySelectorAll('input[type="date"]');
    fireEvent.change(endInput, { target: { value: "2024-02-28" } });
    expect(onChange).toHaveBeenCalledWith({
      start: "2024-01-01",
      end: "2024-02-28",
    });
  });

  it("エラーを表示する", () => {
    render(
      <DateRangeField
        config={drConfig}
        value={{ start: "", end: "" }}
        onChange={jest.fn()}
        error="期間エラー"
      />,
    );
    expect(screen.getByText("期間エラー")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// TemplateSelectField
// ─────────────────────────────────────────────
describe("TemplateSelectField", () => {
  const tsConfig = {
    key: "template",
    type: "template_select" as const,
    label: "テンプレート",
  };

  it("テンプレート選択肢を表示する", () => {
    render(
      <TemplateSelectField
        config={tsConfig}
        value=""
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText("テンプレート1")).toBeInTheDocument();
    expect(screen.getByText("テンプレート2")).toBeInTheDocument();
  });

  it("テンプレート選択変更時に onChange を呼ぶ", () => {
    const onChange = jest.fn();
    render(
      <TemplateSelectField config={tsConfig} value="" onChange={onChange} />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "t1" },
    });
    expect(onChange).toHaveBeenCalledWith("t1");
  });

  it("value が空のとき適用ボタンが disabled", () => {
    render(
      <TemplateSelectField config={tsConfig} value="" onChange={jest.fn()} />,
    );
    expect(screen.getByRole("button", { name: "適用" })).toBeDisabled();
  });

  it("テンプレート選択後に適用すると onSetField が呼ばれる", () => {
    const onSetField = jest.fn();
    window.confirm = jest.fn(() => true);
    render(
      <TemplateSelectField
        config={tsConfig}
        value="t1"
        onChange={jest.fn()}
        onSetField={onSetField}
        titleFieldKey="title"
        contentFieldKey="content"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "適用" }));
    expect(onSetField).toHaveBeenCalledWith("title", "タイトル1");
    expect(onSetField).toHaveBeenCalledWith("content", "内容1");
  });

  it("confirm がキャンセルされると onSetField は呼ばれない", () => {
    const onSetField = jest.fn();
    window.confirm = jest.fn(() => false);
    render(
      <TemplateSelectField
        config={tsConfig}
        value="t1"
        onChange={jest.fn()}
        onSetField={onSetField}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "適用" }));
    expect(onSetField).not.toHaveBeenCalled();
  });
});
