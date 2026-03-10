import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { AppProvider, useApp } from './store/AppContext';
import { checkHealth } from './utils/api';
import type { MainSection, YoutubeTab, UrlTab } from './types';

// Pages
import SingleVideoPage from './pages/SingleVideo';
import BulkVideosPage from './pages/BulkVideos';
import PlaylistPage from './pages/Playlist';
import ExportPage from './pages/ExportPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import SingleUrlPage from './pages/SingleUrl';
import BulkUrlsPage from './pages/BulkUrls';
import ExtractFromText from './pages/ExtractFromText';
import UrlHistoryPage from './pages/UrlHistoryPage';
import UrlSettingsPage from './pages/UrlSettingsPage';

function AppContent() {
  const { setBackendOnline } = useApp();
  const [section, setSection] = useState<MainSection>('youtube');
  const [youtubeTab, setYoutubeTab] = useState<YoutubeTab>('single');
  const [urlTab, setUrlTab] = useState<UrlTab>('single-url');

  useEffect(() => {
    const check = async () => {
      const ok = await checkHealth();
      setBackendOnline(ok);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [setBackendOnline]);

  const page = section === 'youtube' ? youtubeTab : urlTab;

  const renderPage = () => {
    switch (page) {
      case 'single': return <SingleVideoPage />;
      case 'bulk': return <BulkVideosPage />;
      case 'playlist': return <PlaylistPage />;
      case 'export': return <ExportPage />;
      case 'history': return <HistoryPage />;
      case 'settings': return <SettingsPage />;
      case 'single-url': return <SingleUrlPage />;
      case 'bulk-urls': return <BulkUrlsPage />;
      case 'extract-text': return <ExtractFromText />;
      case 'url-history': return <UrlHistoryPage />;
      case 'url-settings': return <UrlSettingsPage />;
      default: return <SingleVideoPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#080812]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-900/15 rounded-full blur-[80px]" />
      </div>

      <Sidebar
        section={section}
        setSection={setSection}
        youtubeTab={youtubeTab}
        setYoutubeTab={setYoutubeTab}
        urlTab={urlTab}
        setUrlTab={setUrlTab}
      />

      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1a1a2e' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1a1a2e' } },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
