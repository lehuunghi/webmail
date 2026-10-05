import { chromium } from "../.ui-tools/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { qrUiSmoke } from "./qr-ui-smoke.mjs";
mkdirSync("ui-smoke", { recursive: true });
const children = [];
let browser;
const start = (args, env) => { const child = spawn(process.execPath, args, { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] }); let log = ""; child.stdout.on("data", (s) => log += s); child.stderr.on("data", (s) => log += s); children.push({ child, log: () => log }); };
async function ready(url) { for (let i = 0; i < 60; i++) { try { if ((await fetch(url)).ok) return; } catch {} await new Promise((r) => setTimeout(r, 500)); } throw new Error("Test fixture unavailable"); }
try {
  start(["--import", "tsx", "server/src/mock/index.ts"], { MOCK_USER: "demo", MOCK_PASS: "demo" });
  await ready("http://127.0.0.1:8788/.well-known/jmap");
  start(["server/dist/index.js"], { HOST: "127.0.0.1", PORT: "8080", STALWART_URL: "http://127.0.0.1:8788", APP_SECRET: randomBytes(32).toString("hex"), ADMINISTRATION: "0", BASE_PATH: "", SESSION_FILE: process.cwd() + "/ui-smoke/sessions.json" });
  await ready("http://127.0.0.1:8080/api/health");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const result = await qrUiSmoke(browser);
  writeFileSync("ui-smoke/qr-report.json", JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
} catch (error) { writeFileSync("ui-smoke/qr-report.json", JSON.stringify({ error: error.message }, null, 2)); throw error; }
finally { await browser?.close(); children.forEach(({ child, log }, i) => { child.kill(); writeFileSync("ui-smoke/server-" + i + ".log", log()); }); }
