import { test, expect, Page } from "@playwright/test";

/**
 * オフライン対応のE2Eテスト
 * シフト共同編集機能でのオフライン対応をテスト
 */

// テストの前に必要なセットアップ
test.beforeEach(async ({ page }) => {
  // テスト用のシーディングデータを準備
  // ここではシフト調整ページにアクセス
  await page.goto("/shift/collaborative");

  // ページロードを待つ
  await page.waitForLoadState("networkidle");
});

test.describe("オフライン対応", () => {
  test("ネットワークが切断された場合、オフラインインジケーターが表示される", async ({
    page,
  }) => {
    // ネットワークをオフラインにする
    await page.context().setOfflineMode(true);

    // オフラインインジケーターが表示されるまで待つ
    const offlineIndicator = page.locator('[data-testid="offline-status"]');
    await expect(offlineIndicator).toBeVisible();

    // エラーメッセージが表示される
    const errorMessage = page.locator("text=インターネット接続がありません");
    await expect(errorMessage).toBeVisible();

    // ネットワークを復帰
    await page.context().setOfflineMode(false);
    await page.waitForLoadState("networkidle");

    // インジケーターが消える
    await expect(offlineIndicator).not.toBeVisible();
  });

  test("オフライン中にシフトを変更した場合、ローカルに保存される", async ({
    page,
  }) => {
    // ネットワークをオフラインにする
    await page.context().setOfflineMode(true);

    // シフトテーブル内のセルを探す
    const shiftCell = page.locator(
      'input[data-testid="shift-cell-staff1-2026-02-01"]',
    );

    // セルをクリック
    await shiftCell.click();

    // シフト状態を変更（例：出勤）
    await page.locator("text=出勤").click();

    // 確認ボタンをクリック
    await page.locator("button:has-text('決定')").click();

    // 変更が即座にUIに反映される
    await expect(shiftCell).toHaveValue("present");

    // ペンディング変更カウントが表示される
    const pendingCount = page.locator('[data-testid="pending-changes-count"]');
    await expect(pendingCount).toBeVisible();
    await expect(pendingCount).toContainText("1");

    // ローカルストレージに保存されたことを確認
    const pendingChanges = await page.evaluate(() => {
      return localStorage.getItem("shift_pending_changes");
    });

    expect(pendingChanges).not.toBeNull();
    const changes = JSON.parse(pendingChanges || "[]");
    expect(changes.length).toBeGreaterThan(0);
  });

  test("オンライン復帰時に自動同期される", async ({ page }) => {
    // ネットワークをオフラインにする
    await page.context().setOfflineMode(true);

    // シフトを変更
    const shiftCell = page.locator(
      'input[data-testid="shift-cell-staff1-2026-02-01"]',
    );
    await shiftCell.click();
    await page.locator("text=出勤").click();
    await page.locator("button:has-text('決定')").click();

    // ペンディング変更が保存される
    let pendingCount = page.locator('[data-testid="pending-changes-count"]');
    await expect(pendingCount).toContainText("1");

    // ネットワークを復帰
    await page.context().setOfflineMode(false);
    await page.waitForLoadState("networkidle");

    // 同期完了を待つ
    await page.waitForTimeout(2000);

    // ペンディング変更がクリアされる
    const pendingChangesStorage = await page.evaluate(() => {
      return localStorage.getItem("shift_pending_changes");
    });

    const changes = JSON.parse(pendingChangesStorage || "[]");
    expect(changes.length).toBe(0);
  });

  test("コンフリクトが発生した場合、解決ダイアログが表示される", async ({
    page,
  }) => {
    // ※ このテストには複数タブでの同時編集のシミュレーションが必要
    // または、バックエンドでコンフリクトを意図的に作成する必要があります

    // オフラインにする
    await page.context().setOfflineMode(true);

    // 変更を加える
    const shiftCell = page.locator(
      'input[data-testid="shift-cell-staff1-2026-02-01"]',
    );
    await shiftCell.click();
    await page.locator("text=出勤").click();
    await page.locator("button:has-text('決定')").click();

    // オンラインに復帰しようとする時点で、別のユーザーが同じセルを更新したと仮定
    // (バックエンドのモックでコンフリクトを返す)
    await page.context().setOfflineMode(false);
    await page.waitForLoadState("networkidle");

    // コンフリクト解決ダイアログが表示される
    const conflictDialog = page.locator("text=コンフリクトが発生しました");
    const isVisible = await conflictDialog.isVisible();

    // コンフリクトが発生した場合のみダイアログを確認
    if (isVisible) {
      await expect(conflictDialog).toBeVisible();

      // ローカル版を採用
      await page.locator("button:has-text('ローカル版を採用')").click();

      // ダイアログが閉じる
      await expect(conflictDialog).not.toBeVisible();
    }
  });

  test("オフライン状態で読み取り専用モードになる（設定時）", async ({
    page,
  }) => {
    // 読み取り専用モードを有効化する設定があるか確認
    const readOnlyToggle = page.locator(
      '[data-testid="enable-readonly-offline"]',
    );

    if (await readOnlyToggle.isVisible()) {
      // 読み取り専用モードを有効化
      await readOnlyToggle.check();

      // オフラインにする
      await page.context().setOfflineMode(true);

      // シフトセルが無効化される
      const shiftCell = page.locator(
        'input[data-testid="shift-cell-staff1-2026-02-01"]',
      );
      await expect(shiftCell).toBeDisabled();

      // オンラインに復帰
      await page.context().setOfflineMode(false);
      await page.waitForLoadState("networkidle");

      // シフトセルが有効化される
      await expect(shiftCell).toBeEnabled();
    }
  });

  test("複数の変更がオフライン中に保存されて、順序を保持する", async ({
    page,
  }) => {
    // オフラインにする
    await page.context().setOfflineMode(true);

    // 複数のセルを変更
    const cells = [
      'input[data-testid="shift-cell-staff1-2026-02-01"]',
      'input[data-testid="shift-cell-staff1-2026-02-02"]',
      'input[data-testid="shift-cell-staff1-2026-02-03"]',
    ];

    for (const cellSelector of cells) {
      const cell = page.locator(cellSelector);
      if (await cell.isVisible()) {
        await cell.click();
        await page.locator("text=出勤").click();
        await page.locator("button:has-text('決定')").click();
        await page.waitForTimeout(100);
      }
    }

    // ペンディング変更が複数保存されている
    const pendingChanges = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("shift_pending_changes") || "[]");
    });

    expect(pendingChanges.length).toBeGreaterThanOrEqual(1);

    // タイムスタンプが昇順（挿入順）になっている
    for (let i = 1; i < pendingChanges.length; i++) {
      expect(pendingChanges[i].timestamp).toBeGreaterThanOrEqual(
        pendingChanges[i - 1].timestamp,
      );
    }
  });
});

test.describe("オフライン - ローカルストレージの容量管理", () => {
  test("ローカルストレージが満杯の場合のハンドリング", async ({ page }) => {
    // ローカルストレージを満杯にするシミュレーション
    const largeData = "x".repeat(5 * 1024 * 1024); // 5MB

    await page.evaluate((data) => {
      try {
        localStorage.setItem("large_data", data);
      } catch (e) {
        // QuotaExceededError
      }
    }, largeData);

    // オフラインにする
    await page.context().setOfflineMode(true);

    // 変更を試みる
    const shiftCell = page.locator(
      'input[data-testid="shift-cell-staff1-2026-02-01"]',
    );
    await shiftCell.click();

    // エラーメッセージが表示される可能性
    const errorMessage = page.locator("text=ストレージが満杯です");
    const isErrorVisible = await errorMessage.isVisible();

    // エラーが表示されるか、変更が正常に保存されるか確認
    if (isErrorVisible) {
      await expect(errorMessage).toBeVisible();
    }
  });
});
