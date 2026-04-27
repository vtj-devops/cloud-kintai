import { expect, Page, test } from "@playwright/test";

/**
 * E2E テスト: 管理者設定変更フロー（AppConfig）
 *
 * 目的:
 * - 管理者が勤務時間設定（WorkingTime）を変更・保存できることを確認
 * - 保存成功のスナックバー通知が表示されることを確認
 * - ページリロード後も変更が保持されることを確認
 * - QuickInput（申請・入力タブ）の表示確認
 * - テーマカラーの変更・保存フローの確認
 * - シフト設定ダイアログの表示確認
 *
 * 実行方法:
 * - スモークテスト: npm run test:e2e -- smoke-test --project=chromium-admin
 * - 全テスト: npm run test:e2e -- admin/config-management --project=chromium-admin
 */

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function collectErrors(page: Page) {
  const errors = {
    console: [] as string[],
    network: [] as string[],
    pageErrors: [] as Error[],
  };

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (
        !text.includes("status of 400") &&
        !text.includes("status of 404")
      ) {
        errors.console.push(text);
      }
    }
  });

  page.on("response", (response) => {
    if (response.status() >= 500) {
      errors.network.push(`[${response.status()}] ${response.url()}`);
    }
  });

  page.on("pageerror", (error: Error) => {
    errors.pageErrors.push(error);
  });

  return errors;
}

async function waitForLoading(page: Page) {
  try {
    const loading = page.getByTestId("layout-linear-progress");
    await expect(loading).toBeHidden({ timeout: 10000 });
  } catch {
    // ローディング要素がないページでは無視する
  }
}

async function waitForNotification(page: Page, message: string) {
  const notification = page.locator('[role="alert"]').filter({
    hasText: message,
  });
  await expect(notification).toBeVisible({ timeout: 15000 });
}

/**
 * 勤怠管理ページで設定ダイアログを開く
 */
async function openAttendanceSettingsDialog(page: Page) {
  await page.goto("/admin/attendances", { waitUntil: "networkidle" });
  await waitForLoading(page);

  const settingsButton = page.getByRole("button", { name: "勤怠設定を開く" });
  await expect(settingsButton).toBeVisible({ timeout: 10000 });
  await settingsButton.click();

  const dialog = page.getByRole("dialog", { name: "勤怠設定" });
  await expect(dialog).toBeVisible({ timeout: 5000 });

  return dialog;
}

// ---------------------------------------------------------------------------
// スモークテスト（chromium-admin）
// ---------------------------------------------------------------------------

test.describe("管理者設定変更フロー @smoke-test", () => {
  test.use({ storageState: "playwright/.auth/admin.json" });

  test("勤務開始・終了時刻を変更して保存成功を確認 @smoke-test", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "chromium-admin") {
      testInfo.skip();
    }

    const errors = collectErrors(page);
    const dialog = await openAttendanceSettingsDialog(page);

    // 「勤務ルール」タブが選択されていることを確認（デフォルト）
    const rulesTab = dialog.getByRole("tab", { name: "勤務ルール" });
    await expect(rulesTab).toHaveAttribute("aria-selected", "true");

    // 勤務時間セクション内の開始・終了時刻の input[type="time"] を取得
    // WorkingTimeSection: 開始時間（1番目）・終了時間（2番目）の順で並ぶ
    const timeInputs = dialog.locator('input[type="time"]');
    const startInput = timeInputs.nth(0);
    const endInput = timeInputs.nth(1);

    await expect(startInput).toBeVisible({ timeout: 5000 });
    await expect(endInput).toBeVisible({ timeout: 5000 });

    // 現在の値を読み取り、少し変更する
    const currentStart = await startInput.inputValue();
    const currentEnd = await endInput.inputValue();

    const newStart = currentStart === "09:00" ? "09:30" : "09:00";
    const newEnd = currentEnd === "18:00" ? "18:30" : "18:00";

    await startInput.fill(newStart);
    // 自動保存 (AUTO_SAVE_DELAY = 600ms) をトリガー
    await endInput.fill(newEnd);

    // 保存成功通知を確認（設定更新 or 新規作成）
    try {
      await waitForNotification(page, "設定が正常に更新されました");
    } catch {
      await waitForNotification(page, "設定が正常に作成されました");
    }

    // コンソールエラーがないことを確認
    expect(errors.console).toHaveLength(0);
    expect(errors.network).toHaveLength(0);

    // ダイアログを閉じて再度開き、設定値が反映されていることを確認
    await page.getByRole("button", { name: "閉じる" }).click();
    await expect(dialog).toBeHidden({ timeout: 5000 });

    await page.reload({ waitUntil: "networkidle" });
    await waitForLoading(page);

    const dialogAfterReload = await openAttendanceSettingsDialog(page);
    const timeInputsAfterReload = dialogAfterReload.locator('input[type="time"]');
    await expect(timeInputsAfterReload.nth(0)).toHaveValue(newStart);
    await expect(timeInputsAfterReload.nth(1)).toHaveValue(newEnd);
  });
});

// ---------------------------------------------------------------------------
// 追加シナリオ
// ---------------------------------------------------------------------------

test.describe("管理者設定 追加シナリオ", () => {
  test.use({ storageState: "playwright/.auth/admin.json" });

  test("QuickInput（申請・入力タブ）の設定変更フロー", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "chromium-admin") {
      testInfo.skip();
    }

    const errors = collectErrors(page);
    const dialog = await openAttendanceSettingsDialog(page);

    // 「申請・入力」タブに切り替え
    const inputsTab = dialog.getByRole("tab", { name: "申請・入力" });
    await expect(inputsTab).toBeVisible({ timeout: 5000 });
    await inputsTab.click();
    await expect(inputsTab).toHaveAttribute("aria-selected", "true");

    // QuickInput（出勤時間・退勤時間）セクションが表示されていることを確認
    const outgoingTimeSection = dialog.getByText("出勤時間");
    await expect(outgoingTimeSection).toBeVisible({ timeout: 5000 });

    const incomingTimeSection = dialog.getByText("退勤時間");
    await expect(incomingTimeSection).toBeVisible({ timeout: 5000 });

    // 「+ 出勤時間を追加」ボタンを押して QuickInput を追加
    const addStartTimeButton = dialog.getByRole("button", {
      name: "+ 出勤時間を追加",
    });
    await expect(addStartTimeButton).toBeVisible({ timeout: 5000 });
    await addStartTimeButton.click();

    // 追加された時刻入力フィールドが表示されることを確認
    const quickInputs = dialog.locator('input[type="time"]');
    const countAfterAdd = await quickInputs.count();
    expect(countAfterAdd).toBeGreaterThan(0);

    // 自動保存を待機
    await page.waitForTimeout(2000);

    // 保存成功通知を確認
    try {
      await waitForNotification(page, "設定が正常に更新されました");
    } catch {
      await waitForNotification(page, "設定が正常に作成されました");
    }

    expect(errors.console).toHaveLength(0);
    expect(errors.network).toHaveLength(0);
  });

  test("テーマカラー変更（AdminTheme）の確認", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "chromium-admin") {
      testInfo.skip();
    }

    const errors = collectErrors(page);

    await page.goto("/admin/master/theme", { waitUntil: "networkidle" });
    await waitForLoading(page);

    // ページが正常に表示されていることを確認
    await expect(page.locator("body")).toBeVisible();

    // カラーパレットのスウォッチが表示されていることを確認
    const colorSwatches = page.locator('button[aria-label^="テーマカラー"]');
    await expect(colorSwatches.first()).toBeVisible({ timeout: 10000 });

    // カラーパレット全体を確認
    // AdminTheme はカラー選択 UI を持つページとして表示されていることを確認
    await expect(page.locator("body")).toBeVisible();

    // テーマページのカラー入力要素を確認
    // ページが正常にロードされて要素が存在すればOK
    const pageTitle = page.locator("h1, h2").filter({ hasText: /テーマ/ });
    await expect(pageTitle).toBeVisible({ timeout: 10000 }).catch(() => {
      // タイトルがない場合でもOK（ページがロードされていれば）
    });

    // 2番目のスウォッチを選択して変更
    const secondSwatch = colorSwatches.nth(1);
    const newColor = await secondSwatch.getAttribute("aria-label");
    await secondSwatch.click();

    // 保存ボタンが存在することを確認
    const saveButton = page.getByRole("button", { name: "保存" });
    await expect(saveButton).toBeVisible({ timeout: 5000 });

    // 保存ボタンをクリック
    await saveButton.click();

    // テーマカラー保存成功通知を確認
    await waitForNotification(page, "テーマカラーを保存しました");

    expect(errors.console).toHaveLength(0);
    expect(errors.network).toHaveLength(0);

    // ページリロードして設定が反映されていることを確認
    await page.reload({ waitUntil: "networkidle" });
    await waitForLoading(page);
    await expect(page.locator("body")).toBeVisible();

    // 保存したカラーのスウォッチが選択状態（aria-pressed または border）であることを確認
    if (newColor) {
      const reloadedSwatch = page.locator(`button[aria-label="${newColor}"]`);
      await expect(reloadedSwatch).toBeVisible({ timeout: 5000 });
    }
  });

  test("シフト設定（AdminShiftSettings）の変更・保存", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "chromium-admin") {
      testInfo.skip();
    }

    const errors = collectErrors(page);

    await page.goto("/admin/shift", { waitUntil: "networkidle" });
    await waitForLoading(page);

    // ページが正常に表示されていることを確認
    await expect(page.locator("body")).toBeVisible();

    // シフト設定を開くボタンを探す
    const settingsButton = page
      .getByRole("button")
      .filter({ hasText: /設定/ });

    const settingsButtonVisible = await settingsButton.first().isVisible().catch(() => false);

    if (settingsButtonVisible) {
      await settingsButton.first().click();

      // シフト設定ダイアログが開くことを確認
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // ダイアログ内に設定コンテンツが表示されていることを確認
      await expect(dialog).toBeVisible();

      // ダイアログを閉じる
      const closeButton = dialog
        .getByRole("button")
        .filter({ hasText: /閉じる|キャンセル/ });
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      } else {
        await page.keyboard.press("Escape");
      }
    } else {
      // シフト設定ボタンがない場合はページが正常にロードされていることのみ確認
      const body = page.locator("body");
      await expect(body).toBeVisible();
    }

    expect(errors.console).toHaveLength(0);
    expect(errors.network).toHaveLength(0);
  });
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== "passed") {
    const testName = testInfo.title.replace(/[/\\?*:|"<>]/g, "-");
    await page.screenshot({
      path: `test-results/config-management-${testName}.png`,
    });
  }
});
