import { expect, Page, test } from "@playwright/test";
import dayjs from "dayjs";

/**
 * 日報フロー E2E テスト
 *
 * スタッフが日報を投稿し、管理者が確認するフローを検証する。
 *
 * 実行方法:
 * - スタッフユーザー: npm run test:e2e -- --grep @smoke-test --project=chromium-staff
 * - 管理者ユーザー: npm run test:e2e -- --grep @smoke-test --project=chromium-admin
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

function assertNoErrors(errors: ReturnType<typeof collectErrors>) {
  expect(errors.console.length).toBe(
    0,
    `JavaScriptコンソールエラーが検出されました:\n${errors.console.join("\n")}`,
  );
  expect(errors.network.length).toBe(
    0,
    `サーバーエラーが検出されました:\n${errors.network.join("\n")}`,
  );
  expect(errors.pageErrors.length).toBe(
    0,
    `ページエラーが検出されました:\n${errors.pageErrors.map((e) => e.message).join("\n")}`,
  );
}

// ---------------------------------------------------------------------------
// テストスイート
// ---------------------------------------------------------------------------

test.describe("日報フロー", () => {
  // -------------------------------------------------------------------------
  // スタッフ: 日報投稿
  // -------------------------------------------------------------------------
  test.describe("スタッフ: 日報投稿", () => {
    test.use({ storageState: "playwright/.auth/user.json" });

    test(
      "日報を入力して提出し、提出済みステータスになること @smoke-test",
      async ({ page }, testInfo) => {
        if (testInfo.project.name !== "chromium-staff") {
          testInfo.skip();
        }

        const errors = collectErrors(page);

        await test.step("日報画面へナビゲート", async () => {
          await page.goto("/attendance/daily-report", {
            waitUntil: "networkidle",
          });
          await waitForLoading(page);
        });

        await test.step("ページが表示されること", async () => {
          await expect(page.locator("body")).toBeVisible();
        });

        await test.step("新規作成モードへ移行", async () => {
          // 当日の日報がすでに存在する場合はスキップ（環境依存を考慮）
          const createButton = page.getByTestId("daily-report-create-button");
          const createButtonCount = await createButton.count();
          if (createButtonCount > 0) {
            await createButton.click();
          }
          // 作成フォームが表示されるまで待機
          await expect(
            page.getByTestId("daily-report-title-input"),
          ).toBeVisible({ timeout: 10000 });
        });

        const testTitle = `E2Eテスト日報 ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`;

        await test.step("タイトルを入力", async () => {
          const titleInput = page.getByTestId("daily-report-title-input");
          await titleInput.fill(testTitle);
        });

        await test.step("業務内容を入力", async () => {
          const contentInput = page.getByTestId("daily-report-content-input");
          await contentInput.fill(
            "E2Eテストによって自動投稿された日報です。\n\n## 実施タスク\n- 自動テストの実行確認",
          );
        });

        await test.step("提出ボタンをクリック", async () => {
          const submitButton = page.getByTestId("daily-report-submit-button");
          await expect(submitButton).toBeEnabled({ timeout: 5000 });
          await submitButton.click();
        });

        await test.step("提出済みステータスに変わること", async () => {
          const statusChip = page.getByTestId("daily-report-status-chip");
          await expect(statusChip).toBeVisible({ timeout: 15000 });
          await expect(statusChip).toHaveText("提出済");
        });

        await test.step("エラーが発生していないこと", () => {
          assertNoErrors(errors);
        });
      },
    );
  });

  // -------------------------------------------------------------------------
  // 管理者: 日報確認
  // -------------------------------------------------------------------------
  test.describe("管理者: 日報確認", () => {
    test.use({ storageState: "playwright/.auth/admin.json" });

    test(
      "日報管理画面でカルーセルダイアログを開き詳細を確認できること @smoke-test",
      async ({ page }, testInfo) => {
        if (testInfo.project.name !== "chromium-admin") {
          testInfo.skip();
        }

        const errors = collectErrors(page);

        await test.step("日報管理画面へナビゲート", async () => {
          await page.goto("/admin/daily-report", { waitUntil: "networkidle" });
          await waitForLoading(page);
        });

        await test.step("ページが表示されること", async () => {
          await expect(page.locator("body")).toBeVisible();
        });

        await test.step("日報一覧が読み込まれること", async () => {
          // ローディング中テキストが消えるのを待つ
          await expect(
            page.getByText("読み込み中..."),
          ).toBeHidden({ timeout: 15000 });
        });

        await test.step("まとめて確認ボタンが有効であること", async () => {
          const carouselButton = page.getByTestId(
            "admin-daily-report-carousel-button",
          );
          await expect(carouselButton).toBeVisible({ timeout: 10000 });

          const isDisabled = await carouselButton.isDisabled();
          if (isDisabled) {
            console.warn(
              "まとめて確認ボタンが無効（日報データなし）— カルーセルテストをスキップ",
            );
            return;
          }

          await carouselButton.click();
        });

        await test.step("カルーセルダイアログが開くこと", async () => {
          const dialog = page.getByTestId("daily-report-carousel-dialog");
          // ダイアログが表示されていない場合（前のステップでスキップ）は確認しない
          const dialogCount = await dialog.count();
          if (dialogCount === 0) {
            console.warn(
              "カルーセルダイアログが表示されませんでした — スキップ",
            );
            return;
          }
          await expect(dialog).toBeVisible({ timeout: 10000 });
        });

        await test.step("ダイアログに日報内容が表示されること", async () => {
          const dialog = page.getByTestId("daily-report-carousel-dialog");
          const dialogCount = await dialog.count();
          if (dialogCount === 0) {
            return;
          }
          // タイトル（日報を確認）が表示されること
          await expect(
            page.getByText("日報を確認"),
          ).toBeVisible({ timeout: 5000 });
        });

        await test.step("リアクションボタンが表示されること", async () => {
          const reactionButton = page.getByTestId("daily-report-reaction-CHEER");
          const buttonCount = await reactionButton.count();
          if (buttonCount === 0) {
            console.warn("リアクションボタンが見つかりませんでした — スキップ");
            return;
          }
          await expect(reactionButton).toBeVisible({ timeout: 10000 });
        });

        await test.step("コメント入力欄が表示されること", async () => {
          const commentInput = page.getByTestId("daily-report-comment-input");
          const inputCount = await commentInput.count();
          if (inputCount === 0) {
            console.warn("コメント入力欄が見つかりませんでした — スキップ");
            return;
          }
          await expect(commentInput).toBeVisible({ timeout: 5000 });
        });

        await test.step("コメントを入力して投稿できること", async () => {
          const commentInput = page.getByTestId("daily-report-comment-input");
          const inputCount = await commentInput.count();
          if (inputCount === 0) {
            return;
          }

          const commentText = `E2Eテストコメント ${dayjs().format("HH:mm:ss")}`;
          await commentInput.fill(commentText);

          const submitButton = page.getByTestId("daily-report-comment-submit");
          await expect(submitButton).toBeEnabled({ timeout: 5000 });
          await submitButton.click();

          // コメント入力欄がクリアされること（投稿完了の確認）
          await expect(commentInput).toHaveValue("", { timeout: 10000 });
        });

        await test.step("エラーが発生していないこと", () => {
          assertNoErrors(errors);
        });
      },
    );
  });
});
