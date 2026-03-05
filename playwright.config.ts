import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */

dotenv.config({ path: ".env.local" });

const playwrightBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.VITE_BASE_PATH ||
  "http://localhost:4173";

const useLocalWebServer =
  !process.env.PLAYWRIGHT_BASE_URL && !process.env.VITE_BASE_PATH;

console.info(
  `[playwright] baseURL=${playwrightBaseUrl} mode=${useLocalWebServer ? "local-webserver" : "external-base-url"}`,
);

export default defineConfig({
  testDir: "./playwright/tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined, // CIでも並列化を有効化（1→2）
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { open: "never" }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: playwrightBaseUrl,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    httpCredentials: {
      username: "kintai",
      password: "kintaidev",
    },
    screenshot: "only-on-failure",
  },

  /* Start dev server before running tests */
  webServer: useLocalWebServer
    ? {
        command: "npm start -- --port 4173",
        url: "http://localhost:4173",
        reuseExistingServer: false,
        env: {
          VITE_CHECKER_OVERLAY: "false",
        },
      }
    : undefined,

  /* Configure projects for major browsers */
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
      // Run the `setup` project as a dependency only on CI.
      // In development, avoid automatically running setup to keep iteration fast.
      dependencies: process.env.CI ? ["setup"] : undefined,
    },

    // スタッフユーザー（通常）として認証した状態でテスト実行
    {
      name: "chromium-staff",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },

    // 管理者ユーザーとして認証した状態でテスト実行
    {
      name: "chromium-admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
      dependencies: ["setup"],
    },

    // {
    //   name: "firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //   },
    //   dependencies: ["setup"],
    // },

    // {
    //   name: "webkit",
    //   use: {
    //     ...devices["Desktop Safari"],
    //   },
    //   dependencies: ["setup"],
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
});
