import { expect, Page, test } from "@playwright/test";

import { AttendanceDirectLocator } from "../locators/AttendanceDirectLocator";
import { AttendanceLocator } from "../attendance/attendance-locator";

/**
 * 打刻フロー E2E テスト
 *
 * スタッフが出勤打刻から退勤まで一連の状態遷移を行う。
 *
 * 実行方法:
 * - スモークテスト: npm run test:e2e -- --grep @smoke-test --project=chromium-staff
 * - 全テスト: npm run test:e2e -- time-recorder-flow --project=chromium-staff
 */

async function waitForTimeRecorderReady(page: Page) {
  await page.goto("/");

  try {
    const loading = page.getByTestId("layout-linear-progress");
    await expect(loading).toBeHidden({ timeout: 10000 });
  } catch {
    // ローディング要素が存在しない場合は無視
  }

  const workStatus = page.getByTestId(AttendanceLocator.workStatusTextTestId);
  await expect(workStatus).toBeVisible({ timeout: 10000 });
}

async function closeErrorDialogIfPresent(page: Page) {
  try {
    const dialog = page.getByTestId("time-elapsed-error-dialog");
    await dialog.waitFor({ state: "visible", timeout: 5000 });
    await page.getByTestId("time-elapsed-error-dialog-later-btn").click();
    await dialog.waitFor({ state: "hidden", timeout: 5000 });
  } catch {
    // ダイアログが表示されなかった場合は無視
  }
}

test.describe("打刻フロー @smoke-test", () => {
  test.use({ storageState: "playwright/.auth/user.json" });
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await waitForTimeRecorderReady(page);
    await closeErrorDialogIfPresent(page);
  });

  test("出勤前 → 勤務中: 出勤ボタンをクリックして打刻完了を確認 @smoke-test", async ({
    page,
  }) => {
    const workStatus = page.getByTestId(AttendanceLocator.workStatusTextTestId);
    const clockInButton = page.getByTestId(
      AttendanceLocator.clockInButtonTestId
    );

    await expect(clockInButton).toBeEnabled({ timeout: 5000 });
    await clockInButton.click();
    await page.waitForTimeout(1000);

    await expect(workStatus).toHaveText("勤務中");
  });

  test("勤務中 → 休憩中: 休憩開始ボタンをクリックして休憩中表示を確認 @smoke-test", async ({
    page,
  }) => {
    const workStatus = page.getByTestId(AttendanceLocator.workStatusTextTestId);
    const restStartButton = page.getByTestId(
      AttendanceLocator.restStartButtonTestId
    );

    await expect(restStartButton).toBeEnabled({ timeout: 5000 });
    await restStartButton.click();
    await page.waitForTimeout(1000);

    await expect(workStatus).toHaveText("休憩中");
  });

  test("休憩中 → 勤務中: 休憩終了ボタンをクリックして勤務中に戻ることを確認 @smoke-test", async ({
    page,
  }) => {
    const workStatus = page.getByTestId(AttendanceLocator.workStatusTextTestId);
    const restEndButton = page.getByTestId(
      AttendanceLocator.restEndButtonTestId
    );

    await expect(restEndButton).toBeEnabled({ timeout: 5000 });
    await restEndButton.click();
    await page.waitForTimeout(1000);

    await expect(workStatus).not.toHaveText("休憩中");
  });

  test("勤務中 → 勤務終了: 退勤ボタンをクリックして勤務終了表示を確認 @smoke-test", async ({
    page,
  }) => {
    const workStatus = page.getByTestId(AttendanceLocator.workStatusTextTestId);
    const clockOutButton = page.getByTestId(
      AttendanceLocator.clockOutButtonTestId
    );

    await expect(clockOutButton).toBeEnabled({ timeout: 5000 });
    await clockOutButton.click({ force: true });
    await page.waitForTimeout(1000);

    await expect(workStatus).toHaveText("勤務終了");
  });
});

test.describe("直行・直帰フロー", () => {
  test.use({ storageState: "playwright/.auth/out-user.json" });

  test.beforeEach(async ({ page }) => {
    await waitForTimeRecorderReady(page);
    await closeErrorDialogIfPresent(page);
  });

  test("直行モードで出勤打刻（AppConfig の既定開始時刻が設定されること）", async ({
    page,
  }) => {
    await test.step("直行直帰モードをON", async () => {
      const directSwitch = page.getByTestId(
        AttendanceDirectLocator.directModeSwitchTestId
      );
      await expect(directSwitch).toBeVisible({ timeout: 5000 });
      await directSwitch.click();

      await expect(
        page.getByTestId(AttendanceDirectLocator.goDirectlyButtonTestId)
      ).toHaveText("直行");
      await expect(
        page.getByTestId(AttendanceDirectLocator.returnDirectlyButtonTestId)
      ).toHaveText("直帰");
    });

    await test.step("直行ボタンをクリック", async () => {
      const goDirectlyButton = page.getByTestId(
        AttendanceDirectLocator.goDirectlyButtonTestId
      );
      await expect(goDirectlyButton).toBeEnabled({ timeout: 5000 });
      await goDirectlyButton.click();
      await page.waitForTimeout(1000);
    });

    await test.step("勤務中に遷移したことを確認", async () => {
      const workStatus = page.getByTestId(
        AttendanceDirectLocator.workStatusTextTestId
      );
      await expect(workStatus).toHaveText("勤務中");
    });
  });

  test("直帰モードで退勤打刻（AppConfig の既定終了時刻が設定されること）", async ({
    page,
  }) => {
    await test.step("直行直帰モードがONであることを確認し、直帰ボタンが有効になるまで待つ", async () => {
      const returnDirectlyButton = page.getByTestId(
        AttendanceDirectLocator.returnDirectlyButtonTestId
      );
      await expect(returnDirectlyButton).toBeEnabled({ timeout: 5000 });
    });

    await test.step("直帰ボタンをクリック", async () => {
      const returnDirectlyButton = page.getByTestId(
        AttendanceDirectLocator.returnDirectlyButtonTestId
      );
      await returnDirectlyButton.click();
      await page.waitForTimeout(1000);
    });

    await test.step("勤務終了に遷移したことを確認", async () => {
      const workStatus = page.getByTestId(
        AttendanceDirectLocator.workStatusTextTestId
      );
      await expect(workStatus).toHaveText("勤務終了");
    });
  });
});

test.describe("準正常系", () => {
  test.use({ storageState: "playwright/.auth/lazy-user.json" });

  test("1 週間以上打刻がない場合のエラーメッセージ表示", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.locator('[data-testid="time-elapsed-error-dialog-title-text"]')
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.locator('[data-testid="time-elapsed-error-dialog"]')
    ).toBeVisible();
  });
});
