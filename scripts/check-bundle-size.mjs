#!/usr/bin/env node
import { readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const DIST_JS_DIR = "dist/assets/js";

// Per-chunk budgets in KB (raw, not gzipped). Tune as the app grows.
//
// Under Vite 8 / Rolldown we no longer use `manualChunks`; the bundler
// auto-splits based on static-vs-dynamic import boundaries. The natural
// chunks today are:
//   - `index-*.js`     — main entry (React, ReactDOM, Redux, axios, query)
//   - `esm-*.js`       — Sentry dynamic import chunk (gated by feature flag)
//   - `web-vitals-*.js`— web-vitals dynamic import
//   - `<route>.screen-*.js` — one chunk per lazy-loaded route
const BUDGETS = {
  default: 250,
  // Main entry — React + ReactDOM + Redux Toolkit + axios + react-query
  // + redux-persist + crypto-js. Re-evaluate if this drifts upward.
  index: 500,
  // Sentry dynamic chunk — Sentry itself is ~450 KB; lives outside the
  // critical path because main.tsx uses `await import("@sentry/react")`.
  esm: 500,
  // web-vitals dynamic chunk.
  "web-vitals": 30,
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
