import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { VideoData, UrlData, AppSettings, UrlSettings } from '../types';
import { setBackendBase } from '../utils/api';

const DEFAULT_SETTINGS: AppSettings = {
  obsidianUrls: false,
  stitchedMode: true,
  customApiKey: '',
  defaultMaxVideos: 25,
  autoIncludeDescription: true,
  autoIncludeStats: true,
  backendUrl: '/api',
  includeTimestamps: true,
  detectDuplicates: true,
};

const DEFAULT_URL_SETTINGS: UrlSettings = {
  useAdvancedScraping: false,
  extractSocialMeta: true,
  includeDomainOnFail: true,
  requestDelay: 1000,
  maxRetries: 2,
  requestTimeout: 10000,
  linkFormat: '[title](url)',
  includeOriginalUrl: false,
};

interface AppState {
  // YouTube data
  extractedVideos: VideoData[];
  addVideo: (v: VideoData) => void;
  removeVideo: (id: string) => void;
  clearVideos: () => void;

  // URL data
  extractedUrls: UrlData[];
  failedUrls: UrlData[];
  addUrl: (u: UrlData) => void;
  removeUrl: (url: string) => void;
  clearUrls: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  urlSettings: UrlSettings;
  updateUrlSettings: (s: Partial<UrlSettings>) => void;

  // Backend status
  backendOnline: boolean;
  setBackendOnline: (v: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [extractedVideos, setExtractedVideos] = useState<VideoData[]>([]);
  const [extractedUrls, setExtractedUrls] = useState<UrlData[]>([]);
  const [failedUrls, setFailedUrls] = useState<UrlData[]>([]);
  const [backendOnline, setBackendOnline] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const s = localStorage.getItem('appSettings');
      return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const [urlSettings, setUrlSettings] = useState<UrlSettings>(() => {
    try {
      const s = localStorage.getItem('urlSettings');
      return s ? { ...DEFAULT_URL_SETTINGS, ...JSON.parse(s) } : DEFAULT_URL_SETTINGS;
    } catch { return DEFAULT_URL_SETTINGS; }
  });

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setBackendBase(settings.backendUrl);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('urlSettings', JSON.stringify(urlSettings));
  }, [urlSettings]);

  const addVideo = (v: VideoData) => {
    setExtractedVideos(prev => {
      if (settings.detectDuplicates && prev.some(x => x.videoId === v.videoId)) return prev;
      return [v, ...prev];
    });
  };

  const removeVideo = (id: string) => setExtractedVideos(p => p.filter(v => v.videoId !== id));
  const clearVideos = () => setExtractedVideos([]);

  const addUrl = (u: UrlData) => {
    if (u.success) {
      setExtractedUrls(p => [u, ...p]);
    } else {
      setFailedUrls(p => [u, ...p]);
    }
  };

  const removeUrl = (url: string) => {
    setExtractedUrls(p => p.filter(u => u.url !== url));
    setFailedUrls(p => p.filter(u => u.url !== url));
  };

  const clearUrls = () => { setExtractedUrls([]); setFailedUrls([]); };

  const updateSettings = (s: Partial<AppSettings>) => setSettings(p => ({ ...p, ...s }));
  const updateUrlSettings = (s: Partial<UrlSettings>) => setUrlSettings(p => ({ ...p, ...s }));

  return (
    <AppContext.Provider value={{
      extractedVideos, addVideo, removeVideo, clearVideos,
      extractedUrls, failedUrls, addUrl, removeUrl, clearUrls,
      settings, updateSettings, urlSettings, updateUrlSettings,
      backendOnline, setBackendOnline,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
