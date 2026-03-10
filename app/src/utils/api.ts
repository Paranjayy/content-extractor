import type { VideoData, UrlData } from '../types';

let BACKEND_BASE = '/api';

export function setBackendBase(url: string) {
  BACKEND_BASE = url;
}

export function getBackendBase() {
  return BACKEND_BASE;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${BACKEND_BASE}/health`, { signal: controller.signal });
    clearTimeout(tid);
    return res.ok;
  } catch {
    return false;
  }
}

export async function extractTranscript(url: string): Promise<VideoData> {
  const res = await fetch(`${BACKEND_BASE}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Extraction failed');
  return {
    videoId: data.videoId,
    metadata: data.metadata,
    transcript: data.transcript,
    url: data.metadata?.url || url,
    transcriptLanguage: data.transcriptLanguage,
    extractedAt: data.extractedAt || new Date().toISOString(),
  };
}

export async function extractPlaylist(
  url: string,
  maxVideos: number,
  includeDescription: boolean,
  includeStats: boolean
): Promise<{ totalVideos: number; processedVideos: number; results: Array<{ success: boolean; videoId?: string; metadata?: VideoData['metadata']; transcript?: VideoData['transcript']; transcriptLanguage?: string; error?: string }> }> {
  const res = await fetch(`${BACKEND_BASE}/extract-playlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, maxVideos, includeDescription, includeStats }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Playlist extraction failed');
  return data;
}

export async function extractUrlMetadata(
  url: string,
  includeDescription: boolean,
  includeOgData: boolean
): Promise<UrlData> {
  // Try backend first
  try {
    const res = await fetch(`${BACKEND_BASE}/extract-url-metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, includeDescription, includeOgData }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        url,
        title: data.title || new URL(url).hostname,
        description: data.description || '',
        domain: data.domain || new URL(url).hostname,
        thumbnail: data.thumbnail,
        ogData: data.ogData,
        success: data.success !== false,
        error: data.error,
        convertedAt: new Date().toISOString(),
      };
    }
  } catch { /* try proxy */ }

  // Proxy fallback
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    const data = await res.json();
    if (data.contents) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      const title =
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        doc.querySelector('title')?.textContent ||
        new URL(url).hostname;
      const description =
        doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
        doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        '';
      return {
        url, title: title.trim(), description: description.trim(),
        domain: new URL(url).hostname, success: true,
        convertedAt: new Date().toISOString(),
      };
    }
  } catch { /* all failed */ }

  return {
    url, title: new URL(url).hostname, description: '', domain: new URL(url).hostname,
    success: false, error: 'Could not fetch metadata', convertedAt: new Date().toISOString(),
  };
}
