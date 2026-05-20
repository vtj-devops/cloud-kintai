import { expect, test } from "@playwright/test";
import {
  assertNoPageErrors,
  collectPageErrors,
  waitForOptionalLayoutLoading,
} from "../helpers/pageTestHelpers";

/**
 * ワークフロー E2E テスト: ページ表示確認
 *
 * 目的:
 * - ワークフロー関連ページへのナビゲーション確認
 * - JavaScriptコンソールエラーの検出
 * - サーバーエラー（5xx）の検出
 * - ページロードの完了確認
 *
 * 実行方法:
 * - スタッフユーザー: npm run test:e2e -- workflow/flow --project=chromium-staff
 * - 管理者ユーザー: npm run test:e2e -- workflow/flow --project=chromium-admin
 *
 * 注意:
 * - 実際のデータ操作（承認・申請）はテストデータ依存のため行わない
 * - ページナビゲーション + エラー検出 + 基本的な UI 表示確認に留める
 * - playwright/.auth/admin.json および user.json が存在することが前提
 *   （存在しない場合は `npm run test:e2e:setup` で生成してください）
 */

// ---------------------------------------------------------------------------
// テストスイート
// ---------------------------------------------------------------------------

test.describe("ワークフロー - ページ表示確認", () => {
  // -------------------------------------------------------------------------
  // スタッフユーザー
  // -------------------------------------------------------------------------
  test.describe("スタッフユーザー", () => {
    // playwright/.auth/user.json が存在することを前提とする
    // 存在しない場合は `npm run test:e2e:setup` を実行してください
    test.use({ storageState: "playwright/.auth/user.json" });

    test("ワークフロー一覧ページ（/workflow）が表示されること", async ({
      page,
    }, testInfo) => {
      if (testInfo.project.name !== "chromium-staff") {
        testInfo.skip();
      }

      const errors = collectPageErrors(page);

      await test.step("ページへナビゲート", async () => {
        await page.goto("/workflow", { waitUntil: "networkidle" });
      });

      await test.step("ローディング完了を待つ", async () => {
        await waitForOptionalLayoutLoading(page);
      });

      await test.step("ページ本体が表示されていること", async () => {
        await expect(page.locator("body")).toBeVisible();
      });

      await test.step("ページタイトル「ワークフロー」が表示されていること", async () => {
        // WorkflowHero コンポーネントの PageTitle テキストを確認する
        // data-testid は未付与のため、見出しテキストで特定する
        await expect(
          page.getByRole("heading", { name: "ワークフロー" }),
        ).toBeVisible({ timeout: 10000 });
      });

      await test.step("エラーが発生していないこと", () => {
        assertNoPageErrors(errors);
      });
    });

    test("ワークフロー新規作成ページ（/workflow/new）が表示されること", async ({
      page,
    }, testInfo) => {
      if (testInfo.project.name !== "chromium-staff") {
        testInfo.skip();
      }

      const errors = collectPageErrors(page);

      await test.step("ページへナビゲート", async () => {
        await page.goto("/workflow/new", { waitUntil: "networkidle" });
      });

      await test.step("ローディング完了を待つ", async () => {
        await waitForOptionalLayoutLoading(page);
      });

      await test.step("ページ本体が表示されていること", async () => {
        await expect(page.locator("body")).toBeVisible();
      });

      await test.step("エラーが発生していないこと", () => {
        assertNoPageErrors(errors);
      });
    });
  });

  // -------------------------------------------------------------------------
  // 管理者ユーザー
  // -------------------------------------------------------------------------
  test.describe("管理者ユーザー", () => {
    // playwright/.auth/admin.json が存在することを前提とする
    // 存在しない場合は `npm run test:e2e:setup` を実行してください
    test.use({ storageState: "playwright/.auth/admin.json" });

    test("管理者ワークフロー一覧ページ（/admin/workflow）が表示されること", async ({
      page,
    }, testInfo) => {
      if (testInfo.project.name !== "chromium-admin") {
        testInfo.skip();
      }

      const errors = collectPageErrors(page);

      await test.step("ページへナビゲート", async () => {
        await page.goto("/admin/workflow", { waitUntil: "networkidle" });
      });

      await test.step("ローディング完了を待つ", async () => {
        await waitForOptionalLayoutLoading(page);
      });

      await test.step("ページ本体が表示されていること", async () => {
        await expect(page.locator("body")).toBeVisible();
      });

      await test.step("ページタイトル「ワークフロー管理」が表示されていること", async () => {
        // AdminWorkflow の h1 テキストを確認する
        // data-testid は未付与のため、見出しテキストで特定する
        await expect(
          page.getByRole("heading", { name: "ワークフロー管理" }),
        ).toBeVisible({ timeout: 10000 });
      });

      await test.step("フィルター（種別・ステータス）が表示されていること", async () => {
        // AdminWorkflow のフィルター select/label が表示されていることを確認
        await expect(page.getByText("種別")).toBeVisible({ timeout: 5000 });
        await expect(page.getByText("ステータス")).toBeVisible({
          timeout: 5000,
        });
      });

      await test.step("JSエラー・サーバーエラーが発生していないこと", () => {
        assertNoPageErrors(errors);
      });
    });

    test("管理者ワークフロー詳細ページ（/admin/workflow/:id）は存在しないIDでエラー画面になること", async ({
      page,
    }, testInfo) => {
      if (testInfo.project.name !== "chromium-admin") {
        testInfo.skip();
      }

      // NOTE: 実在しない workflowId でアクセスした場合のフォールバック表示を確認する。
      // サーバーエラー（5xx）が発生していなければ正常とみなす。
      const networkErrors: string[] = [];
      page.on("response", (response) => {
        if (response.status() >= 500) {
          networkErrors.push(`[${response.status()}] ${response.url()}`);
        }
      });

      await test.step("存在しない詳細ページへナビゲート", async () => {
        await page.goto("/admin/workflow/nonexistent-id-for-e2e-test", {
          waitUntil: "networkidle",
        });
      });

      await test.step("ローディング完了を待つ", async () => {
        await waitForOptionalLayoutLoading(page);
      });

      await test.step("ページ本体が表示されていること", async () => {
        await expect(page.locator("body")).toBeVisible();
      });

      await test.step("サーバーエラー（5xx）が発生していないこと", () => {
        expect(networkErrors.length).toBe(
          0,
          `サーバーエラーが検出されました:\n${networkErrors.join("\n")}`,
        );
      });
    });
  });
});

// テスト失敗時にスクリーンショットを保存する
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== "passed") {
    const safeTitle = testInfo.title.replace(/[/\\?*:|"<>]/g, "-");
    await page.screenshot({
      path: `test-results/workflow-flow-${safeTitle}.png`,
    });
  }
});
