import { expect, type Page } from "@playwright/test";

export interface CollectedPageErrors {
  readonly console: string[];
  readonly network: string[];
  readonly pageErrors: Error[];
}

export function collectPageErrors(page: Page): CollectedPageErrors {
  const errors: CollectedPageErrors = {
    console: [],
    network: [],
    pageErrors: [],
  };

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!text.includes("status of 400") && !text.includes("status of 404")) {
        errors.console.push(text);
      }
    }
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status >= 500) {
      errors.network.push(`[${status}] ${response.url()}`);
    }
  });

  page.on("pageerror", (error) => {
    errors.pageErrors.push(error);
  });

  return errors;
}

export async function waitForOptionalLayoutLoading(page: Page) {
  try {
    const loading = page.getByTestId("layout-linear-progress");
    await expect(loading).toBeVisible();
    await expect(loading).toBeHidden({ timeout: 10000 });
  } catch {
    // ignore when loading indicator is not rendered
  }
}

export async function closeTimeElapsedErrorDialogIfVisible(page: Page) {
  try {
    const dialog = page.getByTestId("time-elapsed-error-dialog");
    await dialog.waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("time-elapsed-error-dialog-later-btn").click();
    await dialog.waitFor({ state: "hidden", timeout: 5000 });
  } catch {
    // ignore when dialog is not rendered
  }
}

export function assertNoPageErrors(errors: CollectedPageErrors) {
  expect(errors.console.length).toBe(
    0,
    `JavaScriptコンソールエラーが検出されました:\n${errors.console.join("\n")}`,
  );
  expect(errors.network.length).toBe(
    0,
    `サーバーエラー（5xx）が検出されました:\n${errors.network.join("\n")}`,
  );
  expect(errors.pageErrors.length).toBe(
    0,
    `ページエラーが検出されました:\n${errors.pageErrors.map((e) => e.message).join("\n")}`,
  );
}
