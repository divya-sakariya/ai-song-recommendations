---
name: run-ai-song-recommendations
description: Build, run, and drive the ai-song-recommendations Next.js app. Use when asked to start the app, run it, screenshot it, or interact with its UI (upload/consent/analysis/shortlist flow, sign-in, sign-up).
---

This is a Next.js (App Router) web app. Drive it via the Playwright REPL
at `.claude/skills/run-ai-song-recommendations/driver.mjs` — `chromium-cli`
isn't installed in this sandbox, so this driver replaces it, pointed at the
pre-installed Chromium binary. All paths below are relative to the repo
root (`ai-song-recommendations/`).

## Prerequisites

None beyond `npm install` — `playwright-core` and `next-auth` (used by the
driver) are already project dependencies. A pre-installed Chromium is
expected at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (this
sandbox's default); override with `RUN_CHROME_PATH` if it lives elsewhere.

## Setup

```bash
npm install
```

No `.env.local` is required to run the app or the driver — see Gotchas
for what does and doesn't need a real database.

## Run (agent path)

Start the dev server in the background with a placeholder DB URL (demo
mode doesn't need a real one — see Gotchas) and wait for it to serve:

```bash
MONGODB_URI="mongodb://localhost:27017/run-placeholder" \
NEXTAUTH_SECRET="run-secret-do-not-use-in-prod-000000" \
NEXTAUTH_URL="http://localhost:3300" \
npm run dev -- -p 3300 &> /tmp/run-dev.log &
timeout 40 bash -c 'until curl -sf http://localhost:3300 >/dev/null; do sleep 1; done'
```

Launch the driver under tmux and poll for real output, not the echoed
input line (see Gotchas):

```bash
tmux new-session -d -s appdrv -x 200 -y 50
# tmux's new session doesn't reliably inherit this shell's cwd — cd
# explicitly rather than assuming it does:
tmux send-keys -t appdrv "cd $(pwd) && node .claude/skills/run-ai-song-recommendations/driver.mjs" Enter
timeout 20 bash -c 'until tmux capture-pane -t appdrv -p | grep -q "driver>"; do sleep 0.2; done'

tmux send-keys -t appdrv 'launch' Enter
timeout 30 bash -c 'until tmux capture-pane -t appdrv -p | grep -q "launched\."; do sleep 0.2; done'
```

One representative flow — sign-in page, then the authed upload -> consent
-> analysis -> shortlist -> select flow (demo mode, no API keys needed):

```bash
tmux send-keys -t appdrv 'goto /signin' Enter
tmux send-keys -t appdrv 'ss 01-signin' Enter

tmux send-keys -t appdrv 'use authed' Enter
tmux send-keys -t appdrv 'goto /create' Enter
tmux send-keys -t appdrv 'upload #photo-input e2e/fixtures/sample1.png' Enter
tmux send-keys -t appdrv 'click-text Run analysis' Enter
tmux send-keys -t appdrv 'wait [role=dialog]' Enter
tmux send-keys -t appdrv 'ss 02-consent' Enter
tmux send-keys -t appdrv 'click-text I agree, analyze my photos' Enter
tmux send-keys -t appdrv 'wait-text Matches' Enter
tmux send-keys -t appdrv 'ss 03-shortlist' Enter
tmux send-keys -t appdrv 'click-first ul[aria-label="Song shortlist"] li button:has-text("Select")' Enter
tmux send-keys -t appdrv 'ss 04-selected' Enter
tmux send-keys -t appdrv 'console' Enter
tmux capture-pane -t appdrv -p | tail -20
```

Screenshots land in `/tmp/shots/` (override with `SCREENSHOT_DIR`). Stop:

```bash
tmux send-keys -t appdrv 'quit' Enter
tmux kill-session -t appdrv
lsof -ti:3300 -sTCP:LISTEN | xargs -r kill
```

### Driver commands

| command | what it does |
|---|---|
| `launch` | launch the browser; creates `public` (no session) and `authed` (signed-in) contexts |
| `use public\|authed` | switch which context subsequent commands act on |
| `goto <path>` | navigate current page to `BASE_URL + path` |
| `upload <selector> <file>` | `setInputFiles` on a file input |
| `click <selector>` | click one element (fails if the selector matches >1 — see Gotchas) |
| `click-first <selector>` | click the first match of a selector |
| `click-text <text>` | click a button/link/`[role=button]` by visible text |
| `type <text>` / `press <key>` | keyboard input |
| `wait <selector>` | wait up to 15s for a selector |
| `wait-text <text>` | wait up to 15s for visible text |
| `ss [name]` | screenshot current page -> `/tmp/shots/<name>.png` |
| `text [selector]` | print `innerText` (body if no selector) |
| `eval <js>` | evaluate JS in the page, print the JSON result |
| `console` | print collected `console.error` messages for the current context |
| `quit` | close the browser |

### Environment

| Variable | Required | Default | Notes |
|---|---|---|---|
| `RUN_BASE_URL` | No | `http://localhost:3300` | must match the dev server's port |
| `RUN_NEXTAUTH_SECRET` | No | `run-secret-do-not-use-in-prod-000000` | must match the dev server's `NEXTAUTH_SECRET` |
| `RUN_CHROME_PATH` | No | `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` | pre-installed Chromium binary |
| `SCREENSHOT_DIR` | No | `/tmp/shots` | |

## Run (human path)

```bash
npm run dev   # http://localhost:3000, needs a real MONGODB_URI for sign-up/sign-in
```

## Test

```bash
npm test          # Jest: unit + component + API integration (68 tests, mocked DB)
npm run test:e2e  # Playwright: E2E + axe-core a11y + keyboard-nav (17 tests)
```

Both suites are green as of this writing and need no real database (see
Gotchas — `npm run test:e2e` uses the same JWT-cookie technique as this
driver).

## Gotchas

- **No MongoDB is reachable in this sandbox** — the org network policy
  blocks `fastdl.mongodb.org` (needed by `mongodb-memory-server`), and
  MongoDB isn't in the Ubuntu apt repos. A real sign-up/sign-in can't be
  driven end-to-end here. Instead, `launch` creates an `authed` context
  with a real, correctly-signed NextAuth session JWT injected as a cookie
  (`next-auth.session-token`, encoded via `next-auth/jwt`'s `encode()`
  with the same secret the server was started with) — the same technique
  `e2e/fixtures.ts` uses. This works because the create flow (upload,
  consent, analysis, shortlist) needs no database call in demo mode.

- **Demo mode requires no API keys.** Without `GEMINI_API_KEY` /
  `SPOTIFY_CLIENT_ID`+`SECRET` / `YOUTUBE_API_KEY` set, mood analysis and
  song search run against a small local catalog (`lib/ai/moodAnalysis.ts`,
  `lib/music/resolveSongs.ts`) instead of live APIs — this is why the
  flow above works with zero configured secrets.

- **`POST /api/consent` returns 500 and logs a console error in this
  setup** — it tries to write an audit-log entry to the (unreachable)
  placeholder database. This is expected here: the call is
  fire-and-forget (`components/create/UploadScreen.tsx`) specifically so
  a slow/broken DB never blocks the user, so the flow proceeds anyway.
  Don't chase this as a driver bug.

- **`/favicon.ico` 404s** — no favicon is defined in the app yet. Harmless,
  unrelated to the flow.

- **Playwright strict mode rejects an ambiguous `click`.** Any selector
  matching more than one element (e.g. the repeated "Select" button per
  song card) throws instead of clicking. Use `click-first`, not `click`,
  for anything inside a list.

- **`chromium-cli` isn't installed in this sandbox.** The driver launches
  `playwright-core`'s `chromium` directly against the pre-installed
  binary (pinned via `RUN_CHROME_PATH`) rather than the version
  `npx playwright install` would fetch — that fetch also fails here
  (network policy), and even where it doesn't, the pinned binary avoids a
  version mismatch between `@playwright/test` and what's on disk.

## Troubleshooting

- **`EADDRINUSE: address already in use 0.0.0.0:3300`**: a previous dev
  server is still holding the port (sometimes as a zombie process after
  `kill`). `lsof -ti:3300 -sTCP:LISTEN | xargs -r kill -9`, wait a second,
  retry.
- **A `tmux send-keys` command's effect never appears**: you polled for
  the *echoed input line* (which appears immediately) instead of the
  driver's *output* for that command. Match on the actual result text
  (e.g. `"launched."`, `"clicked first match"`), not the command name.
- **`browserType.launch: Executable doesn't exist at .../chromium_headless_shell-...`**:
  the installed `playwright-core` version expects a newer browser
  revision than what's on disk. Confirmed working pin:
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` via
  `RUN_CHROME_PATH` — don't let Playwright auto-resolve the executable.
