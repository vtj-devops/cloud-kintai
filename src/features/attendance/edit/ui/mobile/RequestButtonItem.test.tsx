import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RequestButtonItem } from "./RequestButtonItem";

describe("RequestButtonItem", () => {
  it("handleSubmit経由で申請処理を呼ぶ", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const submitHandler = jest.fn();
    const handleSubmit = jest.fn(() => submitHandler);

    render(
      <RequestButtonItem
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
        isDirty
        isValid
        isSubmitting={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "申請" }));

    expect(handleSubmit).toHaveBeenCalledWith(onSubmit);
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });

  it("送信中はloading状態になる", () => {
    const handleSubmit = jest.fn(() => jest.fn());

    render(
      <RequestButtonItem
        handleSubmit={handleSubmit}
        onSubmit={jest.fn()}
        isDirty
        isValid
        isSubmitting
      />,
    );

    const button = screen.getByRole("button", { name: "申請" });
    expect(button).toBeDisabled();
    expect(button.querySelector(".app-button__spinner")).toBeInTheDocument();
  });
});
