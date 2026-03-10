export interface TranscriptEntry {
  start: number;
  text: string;
}

export interface VideoMetadata {
  title: string;
  channel: string;
  thumbnail: string;
  views: number | string;
  likes: number | string;
  comments: number | string;
  duration: number | string;
  publishDate: string;
  description: string;
  tags?: string[];
  url?: string;
}

export interface VideoData {
  videoId: string;
  metadata: VideoMetadata;
  transcript: TranscriptEntry[];
  url: string;
  transcriptLanguage?: string;
  extractedAt: string;
}

export interface UrlData {
  url: string;
  title: string;
  description: string;
  domain: string;
  thumbnail?: string;
  ogData?: Record<string, string>;
  success: boolean;
  error?: string;
  convertedAt: string;
}

export interface TranscriptParagraph {
  startTime: number;
  lines: TranscriptEntry[];
  preview: string;
  stitchedText: string;
}

export interface AppSettings {
  obsidianUrls: boolean;
  stitchedMode: boolean;
  customApiKey: string;
  defaultMaxVideos: number;
  autoIncludeDescription: boolean;
  autoIncludeStats: boolean;
  backendUrl: string;
  includeTimestamps: boolean;
  detectDuplicates: boolean;
}

export interface UrlSettings {
  useAdvancedScraping: boolean;
  extractSocialMeta: boolean;
  includeDomainOnFail: boolean;
  requestDelay: number;
  maxRetries: number;
  requestTimeout: number;
  linkFormat: string;
  includeOriginalUrl: boolean;
}

export type MainSection = 'youtube' | 'url';
export type YoutubeTab = 'single' | 'bulk' | 'playlist' | 'export' | 'history' | 'settings';
export type UrlTab = 'single-url' | 'bulk-urls' | 'extract-text' | 'url-history' | 'url-settings';
