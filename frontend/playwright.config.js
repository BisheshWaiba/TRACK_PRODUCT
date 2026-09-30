import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// These tests drive the real app against the real Supabase backend (no
// mocking) — see e2e/README.md before running them. Point BASE_URL at a
// live deployment to test that instead of a local dev server.
const PORT = 5199;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // no parallel tests within a file
  workers: 1, // and no parallel test *files* either — all tests share one real backend
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        // --strictPort: fail loudly instead of silently picking a
        // different port when PORT is already taken (e.g. a stale dev
        // server from a previous run) — that silent fallback previously
        // caused tests to run against stale code with no indication why.
        command: `npm run dev -- --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: false, // always start fresh; a reused stale server is worse than a slower test run
        timeout: 30_000,
      },
});
