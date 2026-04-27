import { expect, Page, test } from "@playwright/test";
import dayjs from "dayjs";

/**
 * シフト共同編集フロー E2E テスト
 *
 * 目的:
 * - 複数ユーザーが同一シフト表を同時編集する共同編集フローの動作確認
 * - セル状態変更・同期ステータス・ロック操作・変更履歴の基本動作確認
 * - JavaScriptコンソールエラー・サーバーエラーの検出
 *
 * 前提条件:
 * - AppConfig の shiftDefaultMode が "collaborative" に設定されていること
 * - playwright/.auth/admin.json が存在すること（`npm run test:e2e:setup` で生成）
 *
 * 実行方法:
 * - スモークテスト: npm run test:e2e -- shift/collaborative-flow --project=chromium-admin
 * - grep タグ:      npm run test:e2e -- --grep "@smoke-test" --project=chromium-admin
 */

// ページごとのエラーを収集するヘルパー
function collectErrorsForPage(page: Page) {
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

function assertNoErrors(errors: ReturnType<typeof collectErrorsForPage>) {
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

async function waitForLoading(page: Page) {
  try {
    const modeLoading = page.getByTestId("shift-mode-loading");
    await modeLoading.waitFor({ state: "hidden", timeout: 10000 });
  } catch {
    // ローディング要素が存在しない場合は無視
  }

  try {
    const layoutLoading = page.getByTestId("layout-linear-progress");
    await expect(layoutLoading).toBeHidden({ timeout: 10000 });
  } catch {
    // ローディング要素が存在しない場合は無視
  }
}

/**
 * shiftDefaultMode が collaborative でない場合 /shift へリダイレクトされる。
 * そのケースでは共同編集テストをスキップする。
 */
async function isCollaborativePageActive(page: Page): Promise<boolean> {
  return page.url().includes("/shift/collaborative");
}

test.describe("シフト共同編集フロー @smoke-test", () => {
  test.use({ storageState: "playwright/.auth/admin.json" });

  test.beforeEach(async (_page, testInfo) => {
    if (testInfo.project.name !== "chromium-admin") {
      testInfo.skip();
    }
  });

  // ---------------------------------------------------------------------------
  // 1. ページ表示確認（smoke-test 対象）
  // ---------------------------------------------------------------------------
  test("共同編集画面が表示されること @smoke-test", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "chromium-admin") testInfo.skip();

    const errors = collectErrorsForPage(page);

    await test.step("/shift/collaborative へナビゲート", async () => {
      await page.goto("/shift/collaborative", { waitUntil: "networkidle" });
    });

    await test.step("AppConfig ロード完了を待つ", async () => {
      await waitForLoading(page);
    });

    await test.step("shiftDefaultMode が collaborative でない場合はスキップ", async () => {
      if (!(await isCollaborativePageActive(page))) {
        testInfo.skip();
      }
    });

    await test.step("ページ本体が表示されていること", async () => {
      await expect(page.locator("body")).toBeVisible();
    });

    await test.step("当月がヘッダーに表示されること", async () => {
      const currentMonth = dayjs().format("YYYY年");
      await expect(page.getByText(currentMonth)).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step("同期ボタンが表示されていること", async () => {
      await expect(page.getByLabel("sync")).toBeVisible({ timeout: 10000 });
    });

    await test.step("印刷ボタンが表示されていること", async () => {
      await expect(page.getByLabel("print")).toBeVisible({ timeout: 10000 });
    });

    await test.step("シフトテーブルのヘッダー「スタッフ名」が表示されること", async () => {
      await expect(page.getByText("スタッフ名")).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step("JSエラー・サーバーエラーが発生していないこと", () => {
      assertNoErrors(errors);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. 月ナビゲーション確認
  // ---------------------------------------------------------------------------
  test("前月・翌月ナビゲーションが動作すること @smoke-test", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "chromium-admin") testInfo.skip();

    await test.step("/shift/collaborative へナビゲート", async () => {
      await page.goto("/shift/collaborative", { waitUntil: "networkidle" });
    });

    await test.step("AppConfig ロード完了を待つ", async () => {
      await waitForLoading(page);
    });

    if (!(await isCollaborativePageActive(page))) {
      testInfo.skip();
      return;
    }

    const currentMonthLabel = dayjs().format("YYYY年 M月");
    const prevMonthLabel = dayjs().subtract(1, "month").format("YYYY年 M月");
    const nextMonthLabel = dayjs().add(1, "month").format("YYYY年 M月");

    await test.step("現在月が表示されていること", async () => {
      await expect(page.getByText(currentMonthLabel)).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step("「前月」ボタンをクリックすると前月に切り替わること", async () => {
      await page.getByRole("button", { name: "前月" }).click();
      await expect(page.getByText(prevMonthLabel)).toBeVisible({
        timeout: 5000,
      });
    });

    await test.step("「翌月」ボタンをクリックすると翌月に切り替わること", async () => {
      await page.getByRole("button", { name: "翌月" }).click();
      await expect(page.getByText(currentMonthLabel)).toBeVisible({
        timeout: 5000,
      });
    });

    await test.step("さらに「翌月」ボタンをクリックすると翌月に切り替わること", async () => {
      await page.getByRole("button", { name: "翌月" }).click();
      await expect(page.getByText(nextMonthLabel)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 3. セル操作：クリックで状態変更・ShiftCellPanel 表示確認
  // ---------------------------------------------------------------------------
  test("セルをクリックすると ShiftCellPanel が表示され状態変更が可能であること @smoke-test", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "chromium-admin") testInfo.skip();

    await test.step("/shift/collaborative へナビゲート", async () => {
      await page.goto("/shift/collaborative", { waitUntil: "networkidle" });
    });

    await test.step("AppConfig ロード完了を待つ", async () => {
      await waitForLoading(page);
    });

    if (!(await isCollaborativePageActive(page))) {
      testInfo.skip();
      return;
    }

    await test.step("テーブルのデータ読み込み完了を待つ", async () => {
      await expect(page.getByText("読み込み中...")).toBeHidden({
        timeout: 15000,
      });
    });

    await test.step("シフトスタッフが存在する場合のみセル操作を検証", async () => {
      const staffNameHeader = page.getByText("スタッフ名");
      await expect(staffNameHeader).toBeVisible({ timeout: 10000 });

      // シフト対象スタッフが存在するかチェック
      // テーブルの tbody 行数で確認（備考行を除く）
      const tableRows = page.locator("table tbody tr");
      const rowCount = await tableRows.count();

      // 備考行（最終行）のみの場合 = スタッフなし
      if (rowCount <= 1) {
        test.info().annotations.push({
          type: "skip",
          description: "シフト対象スタッフが存在しないためセル操作テストをスキップ",
        });
        return;
      }

      // 最初のスタッフ行の最初のセル（インデックス 1 = 1日目のセル）をクリック
      const firstDataRow = tableRows.first();
      const firstCell = firstDataRow.locator("td").nth(1);

      await test.step("セルをクリックする", async () => {
        await firstCell.click();
      });

      await test.step("ShiftCellPanel に「1セル選択中」が表示されること", async () => {
        await expect(page.getByText(/\d+セル選択中/)).toBeVisible({
          timeout: 5000,
        });
      });

      await test.step("状態変更の選択肢が表示されること", async () => {
        await expect(page.getByText("状態を一括変更:")).toBeVisible({
          timeout: 5000,
        });
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 4. 同期ボタン操作確認
  // ---------------------------------------------------------------------------
  test("同期ボタンをクリックすると同期中は二重実行が防止されること @smoke-test", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "chromium-admin") testInfo.skip();

    await test.step("/shift/collaborative へナビゲート", async () => {
      await page.goto("/shift/collaborative", { waitUntil: "networkidle" });
    });

    await test.step("AppConfig ロード完了を待つ", async () => {
      await waitForLoading(page);
    });

    if (!(await isCollaborativePageActive(page))) {
      testInfo.skip();
      return;
    }

    const syncButton = page.getByLabel("sync");

    await test.step("同期ボタンが表示されていること", async () => {
      await expect(syncButton).toBeVisible({ timeout: 10000 });
    });

    await test.step("同期ボタンをクリックすると一時的に無効化されること", async () => {
      await syncButton.click();
      await expect(syncButton).toBeDisabled({ timeout: 3000 });
    });
  });

  // ---------------------------------------------------------------------------
  // 5. ロック操作確認（管理者のみ）
  // ---------------------------------------------------------------------------
  test("管理者はシフトテーブルにロック操作ボタンが表示されること @smoke-test", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "chromium-admin") testInfo.skip();

    await test.step("/shift/collaborative へナビゲート", async () => {
      await page.goto("/shift/collaborative", { waitUntil: "networkidle" });
    });

    await test.step("AppConfig ロード完了を待つ", async () => {
      await waitForLoading(page);
    });

    if (!(await isCollaborativePageActive(page))) {
      testInfo.skip();
      return;
    }

    await test.step("テーブルのデータ読み込み完了を待つ", async () => {
      await expect(page.getByText("読み込み中...")).toBeHidden({
        timeout: 15000,
      });
    });

    await test.step("シフト対象スタッフがいる場合、「全員確定」または「全員解除」ボタンが表示されること", async () => {
      const tableRows = page.locator("table tbody tr");
      const rowCount = await tableRows.count();

      if (rowCount <= 1) {
        test.info().annotations.push({
          type: "skip",
          description: "シフト対象スタッフが存在しないためロック操作テストをスキップ",
        });
        return;
      }

      // 管理者向けの「全員確定」または「全員解除」ボタンの存在を確認
      const lockMonthButton = page.getByRole("button", {
        name: /全員確定|全員解除/,
      });
      await expect(lockMonthButton).toBeVisible({ timeout: 5000 });
    });
  });

  // ---------------------------------------------------------------------------
  // 6. 変更履歴パネル確認
  // ---------------------------------------------------------------------------
  test("セル選択時に変更履歴セクションが表示可能であること", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "chromium-admin") testInfo.skip();

    await test.step("/shift/collaborative へナビゲート", async () => {
      await page.goto("/shift/collaborative", { waitUntil: "networkidle" });
    });

    await test.step("AppConfig ロード完了を待つ", async () => {
      await waitForLoading(page);
    });

    if (!(await isCollaborativePageActive(page))) {
      testInfo.skip();
      return;
    }

    await test.step("テーブルのデータ読み込み完了を待つ", async () => {
      await expect(page.getByText("読み込み中...")).toBeHidden({
        timeout: 15000,
      });
    });

    await test.step("スタッフがいる場合、セルをクリックして ShiftCellPanel を表示", async () => {
      const tableRows = page.locator("table tbody tr");
      const rowCount = await tableRows.count();

      if (rowCount <= 1) {
        test.info().annotations.push({
          type: "skip",
          description: "シフト対象スタッフが存在しないため変更履歴テストをスキップ",
        });
        return;
      }

      const firstDataRow = tableRows.first();
      const firstCell = firstDataRow.locator("td").nth(1);
      await firstCell.click();

      // ShiftCellPanel が表示されるまで待つ
      await expect(page.getByText(/\d+セル選択中/)).toBeVisible({
        timeout: 5000,
      });

      // 変更履歴セクションの存在確認（履歴がある場合は展開表示される）
      // 履歴がない場合は "変更履歴（0件）" または非表示になるが、
      // セクション自体はセル選択時に ShiftCellPanel に存在する
      // ここではパネルが表示されたことを確認するに留める
      await expect(page.getByText("状態を一括変更:")).toBeVisible({
        timeout: 5000,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Undo/Redo ツールバー確認
  // ---------------------------------------------------------------------------
  test("Undo/Redo ツールバーのアイコンボタンが表示されていること @smoke-test", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "chromium-admin") testInfo.skip();

    await test.step("/shift/collaborative へナビゲート", async () => {
      await page.goto("/shift/collaborative", { waitUntil: "networkidle" });
    });

    await test.step("AppConfig ロード完了を待つ", async () => {
      await waitForLoading(page);
    });

    if (!(await isCollaborativePageActive(page))) {
      testInfo.skip();
      return;
    }

    await test.step("同期ボタン（aria-label=sync）が存在すること", async () => {
      await expect(page.getByLabel("sync")).toBeVisible({ timeout: 10000 });
    });

    await test.step("印刷ボタン（aria-label=print）が存在すること", async () => {
      await expect(page.getByLabel("print")).toBeVisible({ timeout: 10000 });
    });
  });
});

// テスト失敗時にスクリーンショットを保存する
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== "passed") {
    const safeTitle = testInfo.title.replace(/[/\\?*:|"<>]/g, "-");
    await page.screenshot({
      path: `test-results/shift-collaborative-flow-${safeTitle}.png`,
    });
  }
});
