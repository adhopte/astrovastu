import { defineConfig } from "vitest/config";
import os from "node:os";
import path from "node:path";

export default defineConfig({
  test: {
    env: {
      NODE_ENV: "test",
      DATABASE_PATH: ":memory:",
      UPLOAD_DIR: path.join(os.tmpdir(), "astrovastu-test-uploads"),
      JWT_SECRET: "test-secret",
      AUTH_DEV_LOGIN: "true",
      AI_ENABLED: "false",
      GEOCODE_URL: "http://127.0.0.1:9/unreachable",
    },
  },
});
