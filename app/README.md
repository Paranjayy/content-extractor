# Content Extractor Pro — React App

A modern React + Vite + Tailwind CSS frontend for the Content Extractor Pro backend.

## Features

### YouTube Transcript Extractor
- **Single Video** — Extract transcript from any YouTube URL with metadata (views, likes, comments, duration)
- **Bulk Videos** — Process multiple URLs at once with progress tracking and filter controls
- **Playlist** — Extract entire YouTube playlists
- **Export** — ZIP, CSV, JSON bulk export
- **History** — Session transcript history with collapsible transcript viewer
- **Settings** — API key, display options, backend configuration

### URL to Markdown Converter
- **Single URL** — Convert any URL to a formatted Markdown link with metadata
- **Bulk URLs** — Process multiple URLs with rate limiting and progress
- **Extract from Text** — Auto-detect URLs in pasted text
- **History** — Session conversion history
- **Settings** — Format, rate limiting, retry options

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 7** (build tool)
- **Tailwind CSS v4** (utility-first styling)
- **Framer Motion** (animations & transitions)
- **Lucide React** (icons)
- **React Hot Toast** (notifications)
- **JSZip** (client-side ZIP generation)

## Getting Started

```bash
cd app
npm install
npm run dev      # Dev server with hot reload on http://localhost:5173
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

Or use the root `start.sh`:
```bash
./start.sh        # Production build + preview + backend
./start.sh --dev  # Dev server + backend
```

## Architecture

```
src/
├── App.tsx              # Root component, page routing
├── types.ts             # TypeScript interfaces
├── store/
│   └── AppContext.tsx   # Global state (React Context)
├── utils/
│   ├── api.ts           # Backend API calls
│   └── helpers.ts       # Markdown generation, exports, formatting
├── components/
│   ├── Sidebar.tsx      # Navigation sidebar
│   ├── Button.tsx       # Animated button
│   ├── Input.tsx        # Input & Textarea
│   ├── UI.tsx           # Badges, stats, progress, toggles, etc.
│   ├── VideoCard.tsx    # YouTube video result card
│   └── TranscriptViewer.tsx  # Paragraph/raw transcript viewer
└── pages/
    ├── SingleVideo.tsx
    ├── BulkVideos.tsx
    ├── Playlist.tsx
    ├── ExportPage.tsx
    ├── HistoryPage.tsx
    ├── SettingsPage.tsx
    ├── SingleUrl.tsx
    ├── BulkUrls.tsx
    ├── ExtractFromText.tsx
    ├── UrlHistoryPage.tsx
    └── UrlSettingsPage.tsx
```
