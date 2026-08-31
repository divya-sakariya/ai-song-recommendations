# Moment — AI Song Recommendations

Turns a set of photos into an AI-matched song, caption, and exportable Reel.
Next.js (App Router) + TypeScript + Tailwind CSS, MongoDB via Mongoose,
NextAuth for auth.

## Status

**Milestone 1 (Prove the Core Mechanic) is implemented**: sign up/in, photo
upload with DPDP consent, AI mood analysis, and a song shortlist with
preview/select/search/region-lock handling. Milestone 2 (dashboard,
captions, sequencing, export, full accessibility pass) is not built yet.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in at least MONGODB_URI and NEXTAUTH_SECRET
npm run dev
```

You need a MongoDB instance (local or Atlas) for sign-up/sign-in to work.

### Demo mode

`GEMINI_API_KEY`, `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET`, and
`YOUTUBE_API_KEY` are all optional. Without them, mood analysis and song
search run against a small local catalog instead of the live APIs, so the
app is fully runnable without any third-party credentials — see
`lib/ai/moodAnalysis.ts` and `lib/music/resolveSongs.ts` for exactly where
each fallback kicks in. Add the real keys to get live Gemini analysis and
live Spotify/YouTube search.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint (Next.js config)
- `npm run typecheck` — TypeScript, no emit
- `npm test` — Jest unit + component + API integration tests
- `npm run test:e2e` — Playwright E2E, accessibility (axe-core), and
  keyboard-navigation specs; builds and boots the app itself, no running
  dev server needed first

### Testing notes

- API integration tests mock the DB layer (no MongoDB needed to run them).
- E2E tests bypass the login screen with a real, correctly-signed NextAuth
  session JWT rather than a live sign-up/sign-in, since the create flow
  itself needs no DB in demo mode — see `e2e/fixtures.ts` for why.
  Registration/login are covered separately by component tests that mock
  `next-auth/react`.
- `mongodb-memory-server` is an installed devDependency for a real-DB test
  setup in environments that can reach `fastdl.mongodb.org` (this doesn't
  work in every sandbox/CI network policy) — not currently wired into any
  test.
