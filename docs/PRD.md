### Greenfield PRD — Content Extractor (from scratch)

Version: 1.0 (Greenfield)

Owner: Paranjay Khachar

### Vision

Build a clean, modern, reliable web app that extracts: 1) YouTube transcripts (+ metadata), 2) URL metadata (YouTube, Reddit, GitHub, generic), and 3) Bulk processing with exports — with a single cohesive UX and robust server-side APIs. Treat this as a fresh product; do not inherit implementation constraints from the old project.

### Success Metrics

- P0: 95%+ success on YouTube transcript extraction for public videos with transcripts.
- P0: 99% successful responses from URL metadata endpoint with graceful fallbacks (never crashes/UI dead-ends).
- P0: Bulk run of 50 items completes under 3 minutes locally with progress and partial results.

### MVP Scope

- Single-page app with three tabs: YouTube, Bulk/Playlist, URL Metadata.
- Exports: MD, TXT, CSV, and combined ZIP.
- Server-side APIs (no browser scraping):
  - POST `/api/youtube/transcript`
  - POST `/api/youtube/playlist`
  - POST `/api/url/metadata`
  - GET `/api/health`
- No accounts/auth; no persistence (stateless). All processing is on-demand.

Out of scope (MVP): social login, history, scheduled jobs, cloud DB, comment scraping for Reddit.

### Target Stack (fresh)

- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS.
- Backend: FastAPI (Python 3.11+), `httpx`, `youtube-transcript-api`, `beautifulsoup4`, `pydantic`.
- Packaging: Docker for both web and api. Local dev with `docker compose up`.
- CI: GitHub Actions (lint, type-check, tests, build). Deploy preview for web (Vercel) and api (Railway/Render).

### System Architecture

- Web (Next.js) serves static UI and calls API.
- API (FastAPI) exposes 3 endpoints, does all network calls.
- Optional job runner for bulk (in-process queue + asyncio concurrency; no external broker in MVP).

### API Contracts

- POST `/api/youtube/transcript`
  - req: `{ url: string, preferLanguages?: string[] }`
  - 200: `{ success: true, videoId: string, metadata: Metadata, transcript: TranscriptLine[], language: string, extractedAt: string }`
  - 4xx/5xx: `{ success: false, code: ErrorCode, message: string, requestId: string }`

- POST `/api/youtube/playlist`
  - req: `{ url: string, maxVideos?: number (<=100), preferLanguages?: string[] }`
  - 200: `{ success: true, playlistId: string, total: number, processed: number, results: Array<{ success: boolean, videoId: string, metadata?: Metadata, transcript?: TranscriptLine[], language?: string, message?: string }> }`

- POST `/api/url/metadata`
  - req: `{ url: string, includeDescription?: boolean, includeOgData?: boolean }`
  - 200: `{ success: boolean, url: string, title: string, description: string, domain: string, thumbnail?: string, og?: Record<string,string>, message?: string, extractedAt: string }`

Types
- `Metadata`: `{ title: string, channel?: string, thumbnail?: string, views?: number|string, likes?: number|string, comments?: number|string, duration?: number|string, publishDate?: string }`
- `TranscriptLine`: `{ start: number, text: string }`
- `ErrorCode`: `"INVALID_URL" | "NO_TRANSCRIPT" | "PLATFORM_LIMIT" | "HTTP_ERROR" | "UNKNOWN"`

### UX Flows (clean slate)

- YouTube Single: URL → validate → server call → metadata card → transcript list → export buttons.
- Playlist/Bulk: textarea or playlist URL → queue items → progress bar → per-item cards (success/error) → export all.
- URL Metadata: URL → server call → normalized card (title/desc/thumb/domain) → copy markdown/export CSV.

### Non‑Functional Requirements

- Reliability: defensive parsing, timeouts (10s), retries (exponential backoff), consistent error shapes.
- Performance: async concurrency (FastAPI + httpx) for playlist/bulk; limit 5–8 concurrent external calls.
- Security: input sanitization, no secrets on client, configurable CORS, rate-limit per IP (simple token bucket) in API.
- Observability: requestId on every response; structured JSON logs; timings for external calls.

### Testing

- Unit: URL parsers, duration parsing, fallback selection.
- Integration: endpoint tests with mocked external services; playlist pagination; concurrency caps.
- E2E: Playwright happy paths for the three tabs against local compose.

### Repo Layout (new)

```
content-extractor/
  apps/
    web/           # Next.js 14 + TS
    api/           # FastAPI app
  packages/
    ui/            # (optional) shared components
  infra/
    docker/        # Dockerfiles, compose
  docs/
    PRD.md
```

### Deployment

- Dev: `docker compose up` spins both services at `http://localhost:3000` (web) and `http://localhost:5002` (api).
- Prod: Web on Vercel (static+SSR), API on Railway/Render (Docker). Environment via `.env`/secrets.

### Milestones

- M1: API scaffold + contracts + health + CI — 1 day.
- M2: YouTube single transcript + metadata — 1–2 days.
- M3: URL metadata endpoint + UI — 1 day.
- M4: Bulk/playlist with progress + exports — 2 days.
- M5: Tests (unit/integration/E2E) + telemetry + docs — 1–2 days.

### Risks

- Platform blocking/anti-bot → rely on official endpoints where possible; clear fallbacks; document limits.
- Quotas/rate limits → soft concurrency caps; optional API keys via env.

### Open Questions

- Do we need authenticated deployments (multi-user) soon? If yes, plan for JWT + rate limiter backed by Redis in Phase 2.
- Any must-have export templates beyond MD/TXT/CSV/ZIP?

— This is a ground‑up spec. Build new; don’t port old code.


