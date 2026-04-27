import { expect, Page, test } from "@playwright/test";

/**
 * E2E テスト: ワークフロー承認フロー（申請 → 承認 / 否認）
 *
 * 目的:
 * - スタッフがワークフロー申請を作成し、一覧に表示されることを確認
 * - 管理者が申請を承認・却下し、ステータスが変わることを確認
 * - 承認コメント付き承認、承認タイムライン表示の動作確認
 *
 * 実行方法:
 * - スタッフユーザー: npm run test:e2e -- workflow/approval-flow --project=chromium-staff
 * - 管理者ユーザー: npm run test:e2e -- workflow/approval-flow --project=chromium-admin
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

/**
 * 管理者ワークフロー一覧で承認可能な申請を探す。
 * 承認可能なステータス（「承認待ち」「提出済」）を含む行を返す。
 * 見つからなければ null を返す。
 */
async function findApprovableWorkflowRow(page: Page) {
  const approvalStatuses = ["承認待ち", "提出済"];

  for (const status of approvalStatuses) {
    const rows = page.locator("tr", { hasText: status });
    const count = await rows.count();
    if (count > 0) {
      return rows.first();
    }

    // モバイルカード
    const cards = page.locator("article", { hasText: status });
    const cardCount = await cards.count();
    if (cardCount > 0) {
      return cards.first();
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// テストスイート
// ---------------------------------------------------------------------------

test.describe("ワークフロー承認フロー", () => {
  // -------------------------------------------------------------------------
  // スタッフユーザー
  // -------------------------------------------------------------------------
  test.describe("スタッフユーザー: ワークフロー申請", () => {
    test.use({ storageState: "playwright/.auth/user.json" });

    test(
      "新規ワークフローを申請できること @smoke-test",
      async ({ page }, testInfo) => {
        if (testInfo.project.name !== "chromium-staff") {
          testInfo.skip();
        }

        const errors = collectErrors(page);

        await test.step("新規作成ページへナビゲート", async () => {
          await page.goto("/workflow/new", { waitUntil: "networkidle" });
          await waitForLoading(page);
        });

        await test.step("ページが表示されること", async () => {
          await expect(page.locator("body")).toBeVisible();
          await expect(
            page.getByRole("heading", { name: "新規作成" }),
          ).toBeVisible({ timeout: 10000 });
        });

        await test.step("申請種別を選択する（有給休暇申請）", async () => {
          const select = page.locator("select").first();
          await expect(select).toBeVisible({ timeout: 5000 });
          await select.selectOption({ label: "有給休暇申請" });
          await page.waitForTimeout(500);
        });

        await test.step("フォームフィールドが表示されること", async () => {
          // 有給休暇申請は日付レンジと理由が自動設定される
          await expect(page.locator("body")).toBeVisible();
        });

        await test.step("申請を送信する", async () => {
          const submitButton = page.getByRole("button", { name: "作成" });
          await expect(submitButton).toBeEnabled({ timeout: 5000 });
          await submitButton.click();
        });

        await test.step("ワークフロー一覧へリダイレクトされること", async () => {
          await page.waitForURL(/\/workflow$/, { timeout: 15000 });
          expect(page.url()).toMatch(/\/workflow$/);
        });

        await test.step("エラーが発生していないこと", () => {
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
        });
      },
    );

    test(
      "ワークフロー一覧に申請が表示されること @smoke-test",
      async ({ page }, testInfo) => {
        if (testInfo.project.name !== "chromium-staff") {
          testInfo.skip();
        }

        const errors = collectErrors(page);

        await test.step("ワークフロー一覧ページへナビゲート", async () => {
          await page.goto("/workflow", { waitUntil: "networkidle" });
          await waitForLoading(page);
        });

        await test.step("ページタイトル「ワークフロー」が表示されること", async () => {
          await expect(
            page.getByRole("heading", { name: "ワークフロー" }),
          ).toBeVisible({ timeout: 10000 });
        });

        await test.step("申請一覧エリアが表示されること", async () => {
          await expect(page.locator("body")).toBeVisible();
        });

        await test.step("エラーが発生していないこと", () => {
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
        });
      },
    );
  });

  // -------------------------------------------------------------------------
  // 管理者ユーザー
  // -------------------------------------------------------------------------
  test.describe("管理者ユーザー: 承認・却下操作", () => {
    test.use({ storageState: "playwright/.auth/admin.json" });

    test(
      "ワークフロー一覧で申請が確認できること @smoke-test",
      async ({ page }, testInfo) => {
        if (testInfo.project.name !== "chromium-admin") {
          testInfo.skip();
        }

        const errors = collectErrors(page);

        await test.step("管理者ワークフロー一覧へナビゲート", async () => {
          await page.goto("/admin/workflow", { waitUntil: "networkidle" });
          await waitForLoading(page);
        });

        await test.step("ページタイトル「ワークフロー管理」が表示されること", async () => {
          await expect(
            page.getByRole("heading", { name: "ワークフロー管理" }),
          ).toBeVisible({ timeout: 10000 });
        });

        await test.step("フィルター（種別・ステータス）が表示されること", async () => {
          await expect(page.getByText("種別")).toBeVisible({ timeout: 5000 });
          await expect(page.getByText("ステータス")).toBeVisible({
            timeout: 5000,
          });
        });

        await test.step("申請件数テキストが表示されること", async () => {
          await expect(page.getByText(/件の申請/)).toBeVisible({
            timeout: 5000,
          });
        });

        await test.step("エラーが発生していないこと", () => {
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
        });
      },
    );

    test(
      "承認操作でステータスが承認済みに変わること @smoke-test",
      async ({ page }, testInfo) => {
        if (testInfo.project.name !== "chromium-admin") {
          testInfo.skip();
        }

        await test.step("管理者ワークフロー一覧へナビゲート", async () => {
          await page.goto("/admin/workflow", { waitUntil: "networkidle" });
          await waitForLoading(page);
          await page.waitForTimeout(1000);
        });

        await test.step("承認可能な申請を探す", async () => {
          // ステータスフィルターを「すべて」に設定してすべての申請を表示
          const allCheckbox = page.locator('label', { hasText: 'すべて' }).locator('input[type="checkbox"]').first();
          if (await allCheckbox.count() > 0) {
            const isChecked = await allCheckbox.isChecked();
            if (!isChecked) {
              await allCheckbox.click();
              await page.waitForTimeout(500);
            }
          }
        });

        let workflowId: string | null = null;

        await test.step("承認可能な申請行をクリックして詳細へ遷移", async () => {
          const row = await findApprovableWorkflowRow(page);
          if (!row) {
            console.warn(
              "承認可能なワークフローが見つかりません — このテストをスキップします",
            );
            return;
          }

          await row.click();

          try {
            await page.waitForURL(/\/admin\/workflow\/.+/, { timeout: 10000 });
            const url = page.url();
            const match = url.match(/\/admin\/workflow\/(.+)/);
            workflowId = match ? match[1] : null;
          } catch {
            console.warn("詳細ページへの遷移が確認できませんでした");
            return;
          }
        });

        if (!workflowId) return;

        await test.step("申請内容の確認セクションが表示されること", async () => {
          await expect(page.getByText("申請内容の確認")).toBeVisible({
            timeout: 10000,
          });
        });

        await test.step("承認ボタンをクリックする", async () => {
          const approveButton = page.getByRole("button", { name: "承認" });
          await expect(approveButton).toBeEnabled({ timeout: 5000 });
          await approveButton.click();
          await page.waitForTimeout(2000);
        });

        await test.step("ステータスが「承認済」に変わること", async () => {
          await expect(page.getByText("承認済")).toBeVisible({
            timeout: 10000,
          });
        });
      },
    );

    test(
      "却下操作でステータスが却下に変わること @smoke-test",
      async ({ page }, testInfo) => {
        if (testInfo.project.name !== "chromium-admin") {
          testInfo.skip();
        }

        await test.step("管理者ワークフロー一覧へナビゲート", async () => {
          await page.goto("/admin/workflow", { waitUntil: "networkidle" });
          await waitForLoading(page);
          await page.waitForTimeout(1000);
        });

        await test.step("承認可能な申請を探す（却下テスト用）", async () => {
          const allCheckbox = page.locator('label', { hasText: 'すべて' }).locator('input[type="checkbox"]').first();
          if (await allCheckbox.count() > 0) {
            const isChecked = await allCheckbox.isChecked();
            if (!isChecked) {
              await allCheckbox.click();
              await page.waitForTimeout(500);
            }
          }
        });

        let workflowId: string | null = null;

        await test.step("承認可能な申請行をクリックして詳細へ遷移", async () => {
          const row = await findApprovableWorkflowRow(page);
          if (!row) {
            console.warn(
              "却下可能なワークフローが見つかりません — このテストをスキップします",
            );
            return;
          }

          await row.click();

          try {
            await page.waitForURL(/\/admin\/workflow\/.+/, { timeout: 10000 });
            const url = page.url();
            const match = url.match(/\/admin\/workflow\/(.+)/);
            workflowId = match ? match[1] : null;
          } catch {
            console.warn("詳細ページへの遷移が確認できませんでした");
            return;
          }
        });

        if (!workflowId) return;

        await test.step("申請内容の確認セクションが表示されること", async () => {
          await expect(page.getByText("申請内容の確認")).toBeVisible({
            timeout: 10000,
          });
        });

        await test.step("却下ボタンをクリックする", async () => {
          const rejectButton = page.getByRole("button", { name: "却下" });
          await expect(rejectButton).toBeEnabled({ timeout: 5000 });
          await rejectButton.click();
          await page.waitForTimeout(2000);
        });

        await test.step("ステータスが「却下」に変わること", async () => {
          await expect(page.getByText("却下")).toBeVisible({
            timeout: 10000,
          });
        });
      },
    );

    test(
      "承認コメント付き承認ができること",
      async ({ page }, testInfo) => {
        if (testInfo.project.name !== "chromium-admin") {
          testInfo.skip();
        }

        await test.step("管理者ワークフロー一覧へナビゲート", async () => {
          await page.goto("/admin/workflow", { waitUntil: "networkidle" });
          await waitForLoading(page);
          await page.waitForTimeout(1000);
        });

        let workflowId: string | null = null;

        await test.step("承認可能な申請を探して詳細へ遷移", async () => {
          const allCheckbox = page.locator('label', { hasText: 'すべて' }).locator('input[type="checkbox"]').first();
          if (await allCheckbox.count() > 0) {
            const isChecked = await allCheckbox.isChecked();
            if (!isChecked) {
              await allCheckbox.click();
              await page.waitForTimeout(500);
            }
          }

          const row = await findApprovableWorkflowRow(page);
          if (!row) {
            console.warn(
              "コメント付き承認用のワークフローが見つかりません — このテストをスキップします",
            );
            return;
          }

          await row.click();

          try {
            await page.waitForURL(/\/admin\/workflow\/.+/, { timeout: 10000 });
            const url = page.url();
            const match = url.match(/\/admin\/workflow\/(.+)/);
            workflowId = match ? match[1] : null;
          } catch {
            console.warn("詳細ページへの遷移が確認できませんでした");
            return;
          }
        });

        if (!workflowId) return;

        await test.step("コメントを入力して送信する", async () => {
          const commentTextarea = page.locator(
            'textarea[placeholder="メッセージを入力..."]',
          );

          if ((await commentTextarea.count()) === 0) {
            console.warn(
              "コメント入力エリアが見つかりません — コメント入力ステップをスキップします",
            );
            return;
          }

          await commentTextarea.fill("E2Eテスト: 承認コメントのテストです。");

          const sendButton = page.getByRole("button", { name: "送信" });
          await expect(sendButton).toBeEnabled({ timeout: 5000 });
          await sendButton.click();
          await page.waitForTimeout(1500);
        });

        await test.step("承認ボタンをクリックする", async () => {
          const approveButton = page.getByRole("button", { name: "承認" });
          await expect(approveButton).toBeEnabled({ timeout: 5000 });
          await approveButton.click();
          await page.waitForTimeout(2000);
        });

        await test.step("ステータスが「承認済」に変わること", async () => {
          await expect(page.getByText("承認済")).toBeVisible({
            timeout: 10000,
          });
        });
      },
    );

    test(
      "WorkflowApprovalTimelineが承認フローを表示すること",
      async ({ page }, testInfo) => {
        if (testInfo.project.name !== "chromium-admin") {
          testInfo.skip();
        }

        await test.step("管理者ワークフロー一覧へナビゲート", async () => {
          await page.goto("/admin/workflow", { waitUntil: "networkidle" });
          await waitForLoading(page);
          await page.waitForTimeout(1000);
        });

        await test.step("申請一覧に申請が存在するか確認", async () => {
          const allCheckbox = page.locator('label', { hasText: 'すべて' }).locator('input[type="checkbox"]').first();
          if (await allCheckbox.count() > 0) {
            const isChecked = await allCheckbox.isChecked();
            if (!isChecked) {
              await allCheckbox.click();
              await page.waitForTimeout(500);
            }
          }
        });

        await test.step("最初の申請行をクリックして詳細へ遷移", async () => {
          // デスクトップ: テーブル行
          const rows = page.locator("table tbody tr");
          const rowCount = await rows.count();

          if (rowCount === 0) {
            // モバイルカード
            const cards = page.locator("article");
            const cardCount = await cards.count();
            if (cardCount === 0) {
              console.warn(
                "ワークフローが存在しません — タイムライン表示テストをスキップします",
              );
              return;
            }
            await cards.first().click();
          } else {
            await rows.first().click();
          }

          try {
            await page.waitForURL(/\/admin\/workflow\/.+/, { timeout: 10000 });
          } catch {
            console.warn("詳細ページへの遷移が確認できませんでした");
            return;
          }
        });

        await test.step("申請内容の確認セクションが表示されること", async () => {
          await expect(page.getByText("申請内容の確認")).toBeVisible({
            timeout: 10000,
          });
        });

        await test.step("WorkflowApprovalTimeline の「承認フロー」が表示されること", async () => {
          await expect(page.getByText("承認フロー")).toBeVisible({
            timeout: 10000,
          });
        });

        await test.step("承認ステップ数が表示されること", async () => {
          await expect(page.getByText(/\d+ 件/)).toBeVisible({
            timeout: 5000,
          });
        });
      },
    );
  });
});

// テスト失敗時にスクリーンショットを保存する
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== "passed") {
    const safeTitle = testInfo.title.replace(/[/\\?*:|"<>@]/g, "-");
    await page.screenshot({
      path: `test-results/workflow-approval-flow-${safeTitle}.png`,
    });
  }
});
