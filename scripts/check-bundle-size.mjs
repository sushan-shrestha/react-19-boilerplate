#!/usr/bin/env node
import { readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const DIST_JS_DIR = "dist/assets/js";

// Per-chunk budgets in KB (raw, not gzipped). Tune as the app grows.
//
// NOTE: Vite 8 / Rolldown reshapes chunks differently than Vite 7 / Rollup.
// `react-core` now bundles broader peer deps that previously landed in
// `vendor` / `router-vendor`. `manualChunks` in `vite.config.ts` is overdue
// for a Rolldown-aware retune — track that separately.
const BUDGETS = {
  default: 250,
  "react-core": 500,
  "react-dom": 220,
  "router-vendor": 100,
  "redux-vendor": 50,
  "http-vendor": 60,
  "sentry-react": 250,
  "sentry-tracing": 250,
  vendor: 200,
};

const matchBudget = (filename) => {
  for (const [key, kb] of Object.entries(BUDGETS)) {
    if (key !== "default" && filename.startsWith(key)) return kb;
  }
  return BUDGETS.default;
};

const main = async () => {
  if (!existsSync(DIST_JS_DIR)) {
    console.error(`Bundle directory missing: ${DIST_JS_DIR}. Run \`npm run build\` first.`);
    process.exit(2);
  }

  const files = (await readdir(DIST_JS_DIR)).filter((f) => f.endsWith(".js"));
  let failed = false;

  for (const file of files) {
    const { size } = await stat(join(DIST_JS_DIR, file));
    const kb = size / 1024;
    const baseName = file.replace(/-[A-Za-z0-9_]{6,}\.js$/, "");
    const budget = matchBudget(baseName);
    const status = kb > budget ? "FAIL" : "OK";
    if (status === "FAIL") failed = true;
    console.log(
      `  ${status.padEnd(4)}  ${file.padEnd(45)}  ${kb.toFixed(2).padStart(8)} KB  (budget ${budget} KB)`,
    );
  }

  if (failed) {
    console.error("\nBundle size budget exceeded. See entries marked FAIL above.");
    process.exit(1);
  }
  console.log("\nAll chunks within budget.");
};

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
