import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

type LabelMatcher = string | RegExp;

interface FillCalendarFormOptions {
  readonly startDate: string;
  readonly name: string;
  readonly triggerValidation: () => Promise<void>;
  readonly endDate?: string;
  readonly nameLabel?: LabelMatcher;
  readonly description?: string;
  readonly descriptionLabel?: LabelMatcher;
}

export async function openCalendarDialog(buttonName: LabelMatcher) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: buttonName }));
}

export function setDatePickerValue(label: string, value: string) {
  fireEvent.change(screen.getByTestId(`datepicker-${label}`), {
    target: { value },
  });
}

export function setTextInputValue(label: LabelMatcher, value: string) {
  fireEvent.change(screen.getByLabelText(label), {
    target: { value },
  });
}

export async function waitForRegisterEnabled() {
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
  });
}

export async function clickRegister() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "登録" }));
}

export async function fillCalendarFormAndEnableRegister({
  startDate,
  endDate,
  name,
  triggerValidation,
  nameLabel = /休日名/,
  description,
  descriptionLabel = /詳細/,
}: FillCalendarFormOptions) {
  setDatePickerValue("開始日", startDate);
  if (endDate) {
    setDatePickerValue("終了日 (任意)", endDate);
  }
  setTextInputValue(nameLabel, name);
  if (description !== undefined) {
    setTextInputValue(descriptionLabel, description);
  }
  await triggerValidation();
  await waitForRegisterEnabled();
}
