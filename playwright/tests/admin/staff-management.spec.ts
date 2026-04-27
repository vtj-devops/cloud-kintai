import { expect, Page, test } from "@playwright/test";

/**
 * E2E テスト: スタッフ管理フロー（作成・編集・削除）
 *
 * 目的:
 * - 管理者がスタッフを新規作成し、一覧に表示されることを確認
 * - スタッフ情報を編集して保存・反映を確認
 * - スタッフを削除して一覧から消えることを確認
 * - スタッフの有効化・無効化の確認
 * - 勤務形態（シフト勤務 / 固定勤務）の設定確認
 *
 * 実行方法:
 * - スモークテスト: npm run test:e2e -- smoke-test --project=chromium-admin
 * - 全テスト: npm run test:e2e -- admin/staff-management --project=chromium-admin
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

function generateTestEmail(): string {
  return `e2e-test-${Date.now()}@example.com`;
}

// ---------------------------------------------------------------------------
// スモークテスト（chromium-admin）
// ---------------------------------------------------------------------------

test.describe("スタッフ管理フロー @smoke-test", () => {
  test.use({ storageState: "playwright/.auth/admin.json" });

  test(
    "スタッフ CRUD フロー（作成・編集・削除）@smoke-test",
    async ({ page }, testInfo) => {
      if (testInfo.project.name !== "chromium-admin") {
        testInfo.skip();
      }

      const errors = collectErrors(page);
      const email = generateTestEmail();
      const familyName = "E2Eテスト";
      const givenName = "スタッフ";

      // 1. スタッフ管理画面を開く
      await page.goto("/admin/staff", { waitUntil: "networkidle" });
      await waitForLoading(page);
      await expect(page.locator("body")).toBeVisible();

      // スタッフ登録ボタンが表示されていることを確認
      const createButton = page.getByRole("button", { name: "スタッフ登録" });
      await expect(createButton).toBeVisible({ timeout: 10000 });

      // 2. 新規スタッフ作成フォームを開く
      await createButton.click();

      const formTitle = page.getByText("スタッフ作成");
      await expect(formTitle).toBeVisible({ timeout: 5000 });

      // フォームフィールドに入力
      await page.getByLabel("姓").fill(familyName);
      await page.getByLabel("名").fill(givenName);
      await page.locator('input[type="email"]').fill(email);

      // 登録ボタンが有効になることを確認
      const submitButton = page.getByRole("button", { name: "登録" });
      await expect(submitButton).toBeEnabled({ timeout: 5000 });

      // 登録を実行
      await submitButton.click();

      // 3. 作成成功通知を確認
      await waitForNotification(page, "スタッフを作成しました");

      // 4. 一覧に新規スタッフが表示されることを確認
      const staffRow = page.locator("tr", { hasText: email });
      await expect(staffRow.first()).toBeVisible({ timeout: 15000 });

      // 5. スタッフ情報を編集する
      const editButton = staffRow
        .first()
        .getByRole("button", { name: "スタッフを編集" });
      await editButton.click();

      await waitForLoading(page);

      // 編集ページが表示されることを確認
      const saveButton = page.getByTestId("save-button");
      await expect(saveButton).toBeVisible({ timeout: 10000 });

      // 汎用コードを入力して変更を加える
      const sortKeyInput = page.locator(
        'input[placeholder*="汎用コード"], input[placeholder*="ZZ001"]',
      );
      if (await sortKeyInput.isVisible().catch(() => false)) {
        await sortKeyInput.fill("E2E-001");
      } else {
        // 汎用コード入力欄を別の方法で取得
        const sortKeyCell = page.locator("td", { hasText: "汎用コード" });
        const inputInCell = sortKeyCell.locator("xpath=following-sibling::td//input").first();
        if (await inputInCell.isVisible().catch(() => false)) {
          await inputInCell.fill("E2E-001");
        }
      }

      // 保存ボタンが有効になるまで待機
      await expect(saveButton).toBeEnabled({ timeout: 5000 });

      // 保存を実行
      await saveButton.click();

      // 6. 保存成功通知を確認
      await waitForNotification(page, "保存しました");

      // 7. スタッフ一覧に戻る
      await page.goto("/admin/staff", { waitUntil: "networkidle" });
      await waitForLoading(page);

      const staffRowForDelete = page.locator("tr", { hasText: email });
      await expect(staffRowForDelete.first()).toBeVisible({ timeout: 15000 });

      // 8. スタッフを削除する（確認ダイアログを自動承認）
      page.once("dialog", (dialog) => dialog.accept());

      const moreButton = staffRowForDelete
        .first()
        .getByRole("button", { name: "アカウント操作" });
      await moreButton.click();

      const deleteMenuItem = page.getByRole("menuitem", {
        name: "アカウントを削除",
      });
      await expect(deleteMenuItem).toBeVisible({ timeout: 5000 });
      await deleteMenuItem.click();

      // 9. 削除成功通知を確認
      await waitForNotification(page, "スタッフを削除しました");

      // 10. 一覧から消えることを確認
      await expect(page.locator("tr", { hasText: email })).toBeHidden({
        timeout: 10000,
      });

      // エラーがないことを確認
      expect(errors.console).toHaveLength(0);
      expect(errors.network).toHaveLength(0);
    },
  );
});

// ---------------------------------------------------------------------------
// 追加シナリオ
// ---------------------------------------------------------------------------

test.describe("スタッフ管理 追加シナリオ", () => {
  test.use({ storageState: "playwright/.auth/admin.json" });

  test("スタッフの有効化・無効化（enable/disable）", async (
    { page },
    testInfo,
  ) => {
    if (testInfo.project.name !== "chromium-admin") {
      testInfo.skip();
    }

    const errors = collectErrors(page);

    await page.goto("/admin/staff", { waitUntil: "networkidle" });
    await waitForLoading(page);

    // テーブルにスタッフが存在することを確認
    const tableBody = page.locator("table tbody");
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // 有効なスタッフ（アカウント状態: 有効）の行を探す
    const enabledRows = page.locator("tr", { hasText: "有効" });
    const enabledCount = await enabledRows.count();

    if (enabledCount === 0) {
      // 有効なスタッフがいない場合はスキップ
      testInfo.skip();
      return;
    }

    // 最初の有効なスタッフ行でテスト
    const targetRow = enabledRows.first();

    // アカウント無効化
    const moreButton = targetRow.getByRole("button", {
      name: "アカウント操作",
    });
    await moreButton.click();

    const disableMenuItem = page.getByRole("menuitem", {
      name: "アカウントを無効化",
    });
    await expect(disableMenuItem).toBeVisible({ timeout: 5000 });
    await disableMenuItem.click();

    await waitForNotification(page, "アカウントを無効化しました");

    // ページをリロードして変更が反映されていることを確認
    await page.reload({ waitUntil: "networkidle" });
    await waitForLoading(page);

    // 無効化されたスタッフを再有効化する
    const disabledRows = page.locator("tr", { hasText: "無効" });
    const disabledCount = await disabledRows.count();

    if (disabledCount > 0) {
      const disabledRow = disabledRows.first();
      const enableMoreButton = disabledRow.getByRole("button", {
        name: "アカウント操作",
      });
      await enableMoreButton.click();

      const enableMenuItem = page.getByRole("menuitem", {
        name: "アカウントを有効化",
      });
      await expect(enableMenuItem).toBeVisible({ timeout: 5000 });
      await enableMenuItem.click();

      await waitForNotification(page, "アカウントを有効化しました");
    }

    expect(errors.console).toHaveLength(0);
    expect(errors.network).toHaveLength(0);
  });

  test("勤務形態（シフト勤務 / 固定勤務）の設定", async (
    { page },
    testInfo,
  ) => {
    if (testInfo.project.name !== "chromium-admin") {
      testInfo.skip();
    }

    const errors = collectErrors(page);

    await page.goto("/admin/staff", { waitUntil: "networkidle" });
    await waitForLoading(page);

    // テーブルにスタッフが存在することを確認
    const tableBody = page.locator("table tbody");
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // スタッフ行が存在することを確認
    const staffRows = page.locator("table tbody tr").filter({
      hasNot: page.locator("td[colspan]"),
    });
    const rowCount = await staffRows.count();

    if (rowCount === 0) {
      testInfo.skip();
      return;
    }

    // 最初のスタッフの編集ページを開く
    const firstRow = staffRows.first();
    const editButton = firstRow.getByRole("button", {
      name: "スタッフを編集",
    });
    await editButton.click();

    await waitForLoading(page);

    // 編集ページが表示されることを確認
    const saveButton = page.getByTestId("save-button");
    await expect(saveButton).toBeVisible({ timeout: 10000 });

    // 勤務形態セクションが表示されていることを確認
    const workTypeCell = page.locator("td", { hasText: "勤務形態" });
    await expect(workTypeCell).toBeVisible({ timeout: 5000 });

    // 勤務形態の Autocomplete が表示されていることを確認
    const workTypeSection = page.locator("td", { hasText: "勤務形態" }).locator("xpath=following-sibling::td");
    await expect(workTypeSection.first()).toBeVisible({ timeout: 5000 });

    // 現在の勤務形態を取得
    const workTypeInput = workTypeSection.first().locator("input").first();
    const currentWorkType = await workTypeInput
      .inputValue()
      .catch(() => "");

    // 勤務形態を変更（シフト勤務 ↔ 固定勤務）
    await workTypeInput.click();
    await page.waitForTimeout(300);

    const options = page.locator('[role="option"]');
    const optionCount = await options.count();

    if (optionCount > 1) {
      // 現在と異なるオプションを選択
      const targetOption = options.filter({
        hasNotText: currentWorkType,
      });
      const targetCount = await targetOption.count();
      if (targetCount > 0) {
        await targetOption.first().click();

        // 保存ボタンが有効になるまで待機
        await expect(saveButton).toBeEnabled({ timeout: 5000 });
        await saveButton.click();

        await waitForNotification(page, "保存しました");
      } else {
        // 変更できる選択肢がなければ Escape で閉じる
        await page.keyboard.press("Escape");
      }
    } else {
      await page.keyboard.press("Escape");
    }

    expect(errors.console).toHaveLength(0);
    expect(errors.network).toHaveLength(0);
  });
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== "passed") {
    const testName = testInfo.title.replace(/[/\\?*:|"<>]/g, "-");
    await page.screenshot({
      path: `test-results/staff-management-${testName}.png`,
    });
  }
});
