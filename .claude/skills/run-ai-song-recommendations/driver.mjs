// REPL driver for the ai-song-recommendations Next.js app.
// Designed for agents: wrap in tmux, send-keys commands, capture-pane output.
// Run with: node .claude/skills/run-ai-song-recommendations/driver.mjs
//
// Two contexts are kept open: "public" (no session) and "authed" (a real,
// correctly-signed NextAuth session JWT injected as a cookie — see the
// Gotchas section in SKILL.md for why this exists instead of a real
// sign-up). Commands act on whichever is "current" (default: public).
import { chromium } from "playwright-core";
import { encode } from "next-auth/jwt";
import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";

const BASE_URL = process.env.RUN_BASE_URL || "http://localhost:3300";
const NEXTAUTH_SECRET = process.env.RUN_NEXTAUTH_SECRET || "run-secret-do-not-use-in-prod-000000";
const CHROME_PATH =
  process.env.RUN_CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const SHOT_DIR = process.env.SCREENSHOT_DIR || "/tmp/shots";
fs.mkdirSync(SHOT_DIR, { recursive: true });

let browser = null;
const contexts = {}; // { public: {context, page, consoleErrors}, authed: {...} }
let current = "public";

function ctx() {
  const c = contexts[current];
  if (!c) throw new Error(`no "${current}" context — run "launch" first`);
  return c;
}

async function makeContext(name, { authed } = {}) {
  const context = await browser.newContext();
  if (authed) {
    const token = await encode({
      token: {
        sub: "run-user",
        userId: "run-user",
        email: "run@example.com",
        name: "Run User",
      },
      secret: NEXTAUTH_SECRET,
    });
    await context.addCookies([
      {
        name: "next-auth.session-token",
        value: token,
        url: BASE_URL,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  }
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  contexts[name] = { context, page, consoleErrors };
}

const COMMANDS = {
  async launch() {
    if (browser) return console.log("already launched");
    browser = await chromium.launch({ executablePath: CHROME_PATH, args: ["--no-sandbox"] });
    await makeContext("public", { authed: false });
    // Demo mode (no GEMINI_API_KEY/SPOTIFY keys on the server) means the
    // authed create-flow needs no real database — see SKILL.md Gotchas.
    await makeContext("authed", { authed: true });
    current = "public";
    console.log("launched. contexts: public, authed. current:", current);
  },

  use(name) {
    if (!contexts[name]) return console.log("ERROR: no such context:", name, "(public|authed)");
    current = name;
    console.log("current context ->", current);
  },

  async goto(pathname) {
    const { page } = ctx();
    await page.goto(BASE_URL + (pathname || "/"));
    console.log("goto", pathname, "-> title:", await page.title());
  },

  async upload(args) {
    const [selector, filePath] = args.split(/\s+/);
    const { page } = ctx();
    await page.locator(selector).setInputFiles(path.resolve(filePath));
    console.log("uploaded", filePath, "to", selector);
  },

  async click(selector) {
    const { page } = ctx();
    await page.locator(selector).click();
    console.log("clicked", selector);
  },

  // Playwright's strict mode refuses to click a selector matching more
  // than one element (e.g. any repeated "Select" button in a list) — use
  // this instead of `click` for that case.
  async "click-first"(selector) {
    const { page } = ctx();
    await page.locator(selector).first().click();
    console.log("clicked first match of", selector);
  },

  async "click-text"(text) {
    const { page } = ctx();
    const r = await page.evaluate((t) => {
      const els = [...document.querySelectorAll('button, a, [role="button"]')];
      const el = els.find((e) => e.textContent?.trim() === t) ?? els.find((e) => e.textContent?.includes(t));
      if (!el) return "NOT_FOUND";
      el.click();
      return "OK: " + el.tagName;
    }, text);
    console.log("click-text", JSON.stringify(text), "->", r);
  },

  async type(text) {
    await ctx().page.keyboard.type(text, { delay: 20 });
  },

  async press(key) {
    await ctx().page.keyboard.press(key);
  },

  async wait(selector) {
    try {
      await ctx().page.waitForSelector(selector, { timeout: 15_000 });
      console.log("found:", selector);
    } catch {
      console.log("TIMEOUT:", selector);
    }
  },

  async "wait-text"(text) {
    try {
      await ctx().page.waitForSelector(`text=${text}`, { timeout: 15_000 });
      console.log("found text:", text);
    } catch {
      console.log("TIMEOUT waiting for text:", text);
    }
  },

  async ss(name) {
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + ".png");
    await ctx().page.screenshot({ path: f });
    console.log("screenshot:", f);
  },

  async text(selector) {
    console.log(
      await ctx().page.evaluate(
        (s) => (s ? document.querySelector(s) : document.body)?.innerText ?? "(null)",
        selector || null,
      ),
    );
  },

  async eval(expr) {
    try {
      console.log(JSON.stringify(await ctx().page.evaluate(expr)));
    } catch (e) {
      console.log("ERROR:", e.message);
    }
  },

  console() {
    const { consoleErrors } = ctx();
    console.log(
      `console errors on "${current}" (${consoleErrors.length}):`,
      consoleErrors.length ? consoleErrors.join("\n  ") : "(none)",
    );
  },

  async quit() {
    if (browser) await browser.close().catch(() => {});
    browser = null;
  },

  help() {
    console.log("commands:", Object.keys(COMMANDS).join(", "));
  },
};

const stdin = fs.createReadStream(null, { fd: fs.openSync("/dev/stdin", "r") });
const rl = readline.createInterface({ input: stdin, output: process.stdout, prompt: "driver> " });

rl.on("line", async (line) => {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  if (!cmd) return rl.prompt();
  const fn = COMMANDS[cmd];
  if (!fn) {
    console.log("unknown:", cmd, "- try: help");
    return rl.prompt();
  }
  try {
    await fn(rest.join(" "));
  } catch (e) {
    console.log("ERROR:", e.message);
  }
  if (cmd === "quit") {
    rl.close();
    process.exit(0);
  }
  rl.prompt();
});
rl.on("close", async () => {
  await COMMANDS.quit();
  process.exit(0);
});

console.log("ai-song-recommendations driver - \"help\" for commands, \"launch\" to start");
rl.prompt();
