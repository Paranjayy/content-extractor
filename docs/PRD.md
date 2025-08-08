### Product Requirements Document (PRD) — Content Extractor v2

Version: 0.1 (Initial)

Owner: Paranjay Khachar

### 1) Problem & Goals

- **Problem**: Current app mixes multiple tools with inconsistent UX, fragile browser-only workarounds, and limited reliability. Local dev works but navigation is confusing (doc root vs nested paths). Extraction flows need stronger error handling, observability, and testing.
- **Primary Goals**:
  - **Unify UI/UX** into a single modern app (one entry, consistent navigation/components).
  - **Harden backend** for transcript and metadata extraction with clear contracts, retries, and observability.
  - **Improve reliability** across YouTube, Reddit, GitHub, generic URLs with graceful fallbacks.
  - **Ship testable, CI-verified builds** with automated unit/integration tests.

### 2) Users & Use Cases

- **Researchers/Students**: Quickly pull transcripts/metadata for notes or analysis.
- **Content creators**: Extract and save references, transcripts, and citation links.
- **Developers**: Bulk process URLs to audit or archive.

Key use cases:
- Single YouTube transcript with metadata; export to MD/TXT/CSV/ZIP.
- Bulk YouTube (list or playlist) extraction with progress and partial successes.
- URL metadata extraction for GitHub/Reddit/Twitter/X/Generic websites.

### 3) In-Scope (v2)

- Single-page frontend (SPA) with tabs for: YouTube, Bulk/Playlist, URL Metadata.
- Backend API with these stable endpoints (Flask 3.0 OK; can migrate to FastAPI later):
  - `POST /api/extract` — single YouTube URL → transcript + enhanced metadata.
  - `POST /api/extract-playlist` — playlist URL → per-video transcripts + metadata (configurable max).
  - `POST /api/extract-url-metadata` — any URL → title/description/thumbnail/og_data.
  - `GET /api/health` — health probe.
- Robust error model and fallbacks, structured logs, request IDs.
- Strong client validation, progress UI, exports (MD/TXT/CSV/ZIP).
- Config via `.env`; no secrets in client.

Out of scope (v2): Reddit comment scraping UI, auth/multi-user, scheduling, cloud deploy automation; these can follow.

### 4) Non-Functional Requirements

- **Reliability**: Clear fallbacks; no UI dead-ends; API returns machine-parseable error shapes.
- **Performance**: Handle **50 URLs** bulk comfortably on a laptop; playlist up to **100 videos** with progress.
- **Security**: No secrets in browser; CORS limited by config; input validation and URL sanitization.
- **Observability**: Request ID per call, structured logs (JSON), timing metrics, error counters.
- **Compatibility**: Python 3.9+, macOS/Linux local dev; deployable on Railway/Render/Vercel+Functions variant later.

### 5) Information Architecture & UX (v2)

- Single entry: `index.html` (or React SPA) with top-level tabs:
  - **YouTube** (single) → URL input → metadata card → transcript view → export actions.
  - **Bulk/Playlist** → textarea + playlist input → progress + results list (success/error) → export all.
  - **URL Metadata** → URL input → normalized metadata card → copy markdown/export CSV.
- Shared components: notifications, progress bar, result cards, export menu.
- Consistent theming and keyboard actions (Enter to submit).

### 6) API Contracts (JSON)

- POST `/api/extract`
  - req: `{ "url": string }`
  - 200: `{ success: true, videoId, metadata, transcript: [{start:number,text:string}], transcriptLanguage, extractedAt }`
  - 4xx/5xx: `{ error: string, code?: string, requestId?: string }`

- POST `/api/extract-playlist`
  - req: `{ "url": string, "maxVideos"?: number }`
  - 200: `{ success: true, playlistId, totalVideos, processedVideos, results: Array<{ success:boolean, videoId, metadata?, transcript?, error? }> }`

- POST `/api/extract-url-metadata`
  - req: `{ "url": string, "includeDescription"?: boolean, "includeOgData"?: boolean }`
  - 200: `{ success: boolean, url, title, description, domain, thumbnail?, ogData?, error?, extractedAt }`

- GET `/api/health` → `{ status: "healthy" }`

### 7) Data & Error Model

- `metadata` (YouTube): `{ title, channel, thumbnail, views?, likes?, comments?, duration?, publishDate?, description? }` with fallbacks (oEmbed, thumbnail via `img.youtube.com`).
- Error shape: `{ error: string, code: "INVALID_URL" | "NO_TRANSCRIPT" | "PLATFORM_LIMIT" | "HTTP_ERROR" | "UNKNOWN", requestId: string }`.

### 8) Architecture (v2)

- Frontend: retain static HTML now; optional Phase-2 React+Vite TypeScript migration with components and state management.
- Backend: Flask 3.0 + `flask-cors`, `requests`, `youtube-transcript-api`, `python-dotenv`.
- Config: `.env` for `CORS_ORIGINS`, optional `YOUTUBE_API_KEY`.
- Logging: per-request UUID, JSON logs to stdout; timing for external calls.
- Rate limiting: lightweight (e.g., in-memory token bucket per IP) — optional Phase-2.

### 9) Testing Strategy

- Unit tests: extractors (videoId parsing, duration parsing, metadata fallbacks).
- Integration: API endpoints with mocked external calls; playlist pagination.
- UI smoke: Playwright/Cypress for happy paths (single/bulk/metadata) against local servers.
- Contract tests: verify response shapes and required fields.

### 10) Telemetry & Observability

- Request timing, external call durations, error counts by code, success ratios.
- Structured logs: `{ ts, level, requestId, route, durationMs, statusCode, error? }`.

### 11) Acceptance Criteria

- Entering a valid YouTube URL produces metadata + transcript and allows MD/TXT export.
- Bulk processing shows progress, partial success, and produces CSV and ZIP exports.
- URL metadata returns usable title/description/thumbnail on YouTube/Reddit/GitHub/Generic; graceful fallback for X/Twitter.
- API never returns HTML errors; all errors follow the error model with `requestId`.
- Start script prints correct URLs; README quick start works on macOS.

### 12) Milestones & Timeline (suggested)

- M1 — Backend hardening (contracts, errors, logging) — 1–2 days.
- M2 — Unified UI (single entry, tabs/components) — 2–3 days.
- M3 — Exports + bulk polish + playlist — 1–2 days.
- M4 — Tests (unit/integration/UI smoke) + CI — 1–2 days.
- M5 — Docs + examples + deployment guide — 1 day.

### 13) Risks & Mitigations

- YouTube/Twitter platform limits → use oEmbed/thumbnail fallbacks; document limitations.
- CORS/anti-bot issues → shift sensitive extraction server-side; robust error messages.
- Rate limiting → optional per-IP simple limiter; backoff and retries.

### 14) Future Scope (Post v2)

- React/Vite TypeScript migration.
- Auth, user history, cloud storage of results.
- Reddit comments archiving with depth/filters.
- Queue + background processing for very large playlists.
- Deployment templates for Railway/Render and GitHub Pages frontend.

### 15) File Map (current → v2 target)

- Frontend entry: `frontend/index.html` (v2 keeps single entry; legacy pages remain accessible).
- Backend app: `backend/app.py` (keep endpoints, add logging/error model).
- Start script: `start.sh` (prints correct URLs).
- Requirements: `config/requirements.txt`.

### 16) CI/CD (initial)

- GitHub Actions: lint + unit/integration tests on PR; build static artifacts and publish GitHub Pages (frontend) on main.

---

This PRD is intentionally concise and high-signal to guide v2 implementation. Iterate as features land.


