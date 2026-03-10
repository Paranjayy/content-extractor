import type { TranscriptEntry, VideoData, TranscriptParagraph, AppSettings } from '../types';

// Public demo API key - override via Settings > YouTube Data API > Custom API Key
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyAV_j5IsZlkXNtkadQ7HQiocTYysm9kvH0';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:v=|\/)([0-9A-Za-z_-]{11}).*/,
    /(?:embed\/)([0-9A-Za-z_-]{11})/,
    /(?:watch\?v=|\/)([0-9A-Za-z_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  if (url.length === 11 && /^[0-9A-Za-z_-]+$/.test(url)) return url;
  return null;
}

export function isPlaylistUrl(url: string): boolean {
  return url.includes('playlist') || url.includes('list=') || /[?&]list=/.test(url);
}

export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num) : num;
  if (isNaN(n)) return String(num);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function sanitizeFilename(str: string): string {
  if (!str) return 'untitled';
  return str.toString()
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)
    .trim();
}

export function generateSmartFilename(
  data: { title?: string; channel?: string; domain?: string },
  type: 'youtube' | 'url',
  ext: string
): string {
  const date = new Date().toISOString().split('T')[0];
  let name = '';
  if (type === 'youtube') {
    name = `${sanitizeFilename(data.title || 'video')}_${sanitizeFilename(data.channel || '')}`;
  } else {
    name = `${sanitizeFilename(data.domain || '')}__${sanitizeFilename(data.title || 'link')}`;
  }
  name = name.replace(/[-_\s]+/g, '_').replace(/^[-_]+|[-_]+$/g, '');
  return `${name}_${date}.${ext}`;
}

export function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function groupTranscriptIntoParagraphs(
  transcript: TranscriptEntry[],
  settings: Pick<AppSettings, 'stitchedMode'>
): TranscriptParagraph[] {
  if (!settings.stitchedMode) {
    return transcript.map(entry => ({
      startTime: entry.start,
      lines: [entry],
      preview: entry.text.substring(0, 50) + '...',
      stitchedText: entry.text,
    }));
  }

  const paragraphs: TranscriptParagraph[] = [];
  let current: TranscriptEntry[] = [];
  let startTime = 0;

  for (const entry of transcript) {
    if (current.length === 0) {
      startTime = entry.start;
      current.push(entry);
    } else if (current.length >= 3 || entry.start - startTime > 10) {
      paragraphs.push({
        startTime,
        lines: [...current],
        preview: current[0].text.substring(0, 50) + '...',
        stitchedText: `${formatTimestamp(startTime)} ${current.map(l => l.text).join(' ')}`,
      });
      current = [entry];
      startTime = entry.start;
    } else {
      current.push(entry);
    }
  }
  if (current.length > 0) {
    paragraphs.push({
      startTime,
      lines: [...current],
      preview: current[0].text.substring(0, 50) + '...',
      stitchedText: `${formatTimestamp(startTime)} ${current.map(l => l.text).join(' ')}`,
    });
  }
  return paragraphs;
}

export function generateMarkdown(videoData: VideoData, settings: AppSettings): string {
  const { metadata, transcript, url } = videoData;
  let md = '';

  if (settings.obsidianUrls) {
    md += `# [${metadata.title}](${url})\n\n`;
  } else {
    md += `# ${metadata.title}\n\n**URL:** ${url}\n\n`;
  }

  md += `**Channel:** ${metadata.channel}\n`;
  if (metadata.views !== 'Unknown' && metadata.views !== 'Error' && metadata.views !== 'N/A') {
    md += `**Views:** ${formatNumber(metadata.views as number)} | **Likes:** ${formatNumber(metadata.likes as number)} | **Comments:** ${formatNumber(metadata.comments as number)}\n`;
  }
  if (typeof metadata.duration === 'number') {
    const pub = metadata.publishDate && metadata.publishDate !== 'Unknown'
      ? new Date(metadata.publishDate).toLocaleDateString() : 'Unknown';
    md += `**Duration:** ${formatTimestamp(metadata.duration)} | **Published:** ${pub}\n`;
  }
  if (metadata.description && metadata.description !== 'Description not available') {
    md += `\n**Description:**\n${metadata.description.substring(0, 500)}${metadata.description.length > 500 ? '...' : ''}\n`;
  }

  md += '\n## Transcript\n\n';
  if (settings.stitchedMode) {
    groupTranscriptIntoParagraphs(transcript, settings).forEach(p => { md += `${p.stitchedText}\n\n`; });
  } else {
    transcript.forEach(entry => {
      if (settings.includeTimestamps) {
        const link = `${url}&t=${Math.floor(entry.start)}`;
        md += settings.obsidianUrls
          ? `[${formatTimestamp(entry.start)}](${link}) ${entry.text}\n`
          : `${formatTimestamp(entry.start)} ${entry.text}\n`;
      } else {
        md += `${entry.text}\n`;
      }
    });
  }
  return md;
}

export async function getEnhancedMetadata(videoId: string, customApiKey?: string) {
  const apiKey = customApiKey || YOUTUBE_API_KEY;
  try {
    const res = await fetch(`${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`);
    if (res.ok) {
      const data = await res.json();
      if (data.items?.length > 0) {
        const { snippet, statistics, contentDetails } = data.items[0];
        return {
          title: snippet.title,
          channel: snippet.channelTitle,
          thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
          views: parseInt(statistics.viewCount) || 0,
          likes: parseInt(statistics.likeCount) || 0,
          comments: parseInt(statistics.commentCount) || 0,
          duration: parseDuration(contentDetails.duration),
          publishDate: snippet.publishedAt,
          description: snippet.description,
          tags: snippet.tags || [],
          channelId: snippet.channelId,
          categoryId: snippet.categoryId,
          defaultLanguage: snippet.defaultLanguage,
        };
      }
    }
    // oEmbed fallback
    const oembed = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (oembed.ok) {
      const d = await oembed.json();
      return { title: d.title, channel: d.author_name, thumbnail: d.thumbnail_url, views: 'N/A', likes: 'N/A', comments: 'N/A', duration: 'Unknown', publishDate: 'Unknown', description: '' };
    }
  } catch { /* fall through */ }
  return {
    title: `Video ${videoId}`,
    channel: 'Unknown',
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    views: 'N/A', likes: 'N/A', comments: 'N/A',
    duration: 'Unknown', publishDate: 'Unknown', description: '',
  };
}

function parseDuration(d: string): number {
  const m = d?.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!m) return 0;
  return (parseInt(m[1]) || 0) * 3600 + (parseInt(m[2]) || 0) * 60 + (parseInt(m[3]) || 0);
}

export function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return s.startsWith('http://') || s.startsWith('https://');
  } catch { return false; }
}

export function generateMarkdownLink(
  urlData: { url: string; title: string; description?: string },
  format = '[title](url)'
): string {
  const { url, title, description = '' } = urlData;
  switch (format) {
    case '[[title]](url)': return `[[${title}]](${url})`;
    case "[title](url 'description')": return `[${title}](${url} '${description.substring(0, 100)}...')`;
    default: return `[${title}](${url})`;
  }
}

export async function exportVideosAsZip(items: VideoData[], settings: AppSettings): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  items.forEach((data, i) => {
    const md = generateMarkdown(data, settings);
    const name = generateSmartFilename(
      { title: `${i + 1}_${data.metadata.title}`, channel: data.metadata.channel },
      'youtube', 'md'
    );
    zip.file(name, md);
  });
  // Add summary CSV
  const header = 'Video ID,Title,Channel,URL,Views,Likes\n';
  const rows = items.map(d => [d.videoId, `"${d.metadata.title.replace(/"/g, '""')}"`, `"${d.metadata.channel.replace(/"/g, '""')}"`, d.url, d.metadata.views || '', d.metadata.likes || ''].join(',')).join('\n');
  zip.file('summary.csv', header + rows);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcripts_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportVideosAsCSV(items: VideoData[]): void {
  const header = 'Video ID,Title,Channel,URL,Views,Likes,Comments,Duration,Transcript\n';
  const rows = items.map(d => {
    const t = d.transcript.map(e => `(${formatTimestamp(e.start)}) ${e.text}`).join(' ');
    return [
      d.videoId,
      `"${d.metadata.title.replace(/"/g, '""')}"`,
      `"${d.metadata.channel.replace(/"/g, '""')}"`,
      d.url,
      d.metadata.views || '',
      d.metadata.likes || '',
      d.metadata.comments || '',
      d.metadata.duration || '',
      `"${t.replace(/"/g, '""')}"`,
    ].join(',');
  }).join('\n');
  downloadBlob(header + rows, `transcripts_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

export function exportVideosAsJSON(items: VideoData[]): void {
  downloadBlob(
    JSON.stringify({ exportedAt: new Date().toISOString(), totalVideos: items.length, videos: items }, null, 2),
    `transcripts_${new Date().toISOString().split('T')[0]}.json`,
    'application/json'
  );
}

export async function exportUrlsAsZip(
  items: { url: string; title: string; description?: string }[],
  format: string
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  items.forEach((u, i) => {
    const md = generateMarkdownLink(u, format);
    zip.file(`${i + 1}_${sanitizeFilename(u.title)}.md`, md);
  });
  const combined = items.map(u => generateMarkdownLink(u, format)).join('\n');
  zip.file('all_links.md', combined);
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `url_conversions_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
