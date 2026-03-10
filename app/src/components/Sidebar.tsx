import { motion } from 'framer-motion';
import {
  Youtube, Link, ChevronRight, Zap, History, Settings, Download,
  FileText, List, Film, Globe, Sparkles, Hash
} from 'lucide-react';
import { StatusDot } from './UI';
import { useApp } from '../store/AppContext';
import type { MainSection, YoutubeTab, UrlTab } from '../types';

interface NavItem {
  id: YoutubeTab | UrlTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const youtubeItems: NavItem[] = [
  { id: 'single', label: 'Single Video', icon: <Film size={16} /> },
  { id: 'bulk', label: 'Bulk Videos', icon: <List size={16} /> },
  { id: 'playlist', label: 'Playlist', icon: <Hash size={16} /> },
  { id: 'export', label: 'Export', icon: <Download size={16} /> },
  { id: 'history', label: 'History', icon: <History size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

const urlItems: NavItem[] = [
  { id: 'single-url', label: 'Single URL', icon: <Globe size={16} /> },
  { id: 'bulk-urls', label: 'Bulk URLs', icon: <List size={16} /> },
  { id: 'extract-text', label: 'Extract from Text', icon: <FileText size={16} /> },
  { id: 'url-history', label: 'History', icon: <History size={16} /> },
  { id: 'url-settings', label: 'Settings', icon: <Settings size={16} /> },
];

interface SidebarProps {
  section: MainSection;
  setSection: (s: MainSection) => void;
  youtubeTab: YoutubeTab;
  setYoutubeTab: (t: YoutubeTab) => void;
  urlTab: UrlTab;
  setUrlTab: (t: UrlTab) => void;
}

export function Sidebar({ section, setSection, youtubeTab, setYoutubeTab, urlTab, setUrlTab }: SidebarProps) {
  const { backendOnline, extractedVideos, extractedUrls } = useApp();

  const items = section === 'youtube' ? youtubeItems : urlItems;
  const activeTab = section === 'youtube' ? youtubeTab : urlTab;

  const setTab = (id: YoutubeTab | UrlTab) => {
    if (section === 'youtube') setYoutubeTab(id as YoutubeTab);
    else setUrlTab(id as UrlTab);
  };

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-white/[0.015] border-r border-white/[0.06] min-h-screen">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-100">ContentExtractor</span>
            <span className="block text-[10px] text-slate-500">Pro</span>
          </div>
        </div>
      </div>

      {/* Section switcher */}
      <div className="px-3 mb-4">
        <div className="bg-white/[0.04] rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setSection('youtube')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${section === 'youtube' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Youtube size={13} />
            YouTube
          </button>
          <button
            onClick={() => setSection('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${section === 'url' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Link size={13} />
            URL
          </button>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5">
        {items.map(item => {
          const isActive = item.id === activeTab;
          const badge = item.id === 'history' ? extractedVideos.length
            : item.id === 'url-history' ? extractedUrls.length
            : undefined;
          return (
            <motion.button
              key={item.id}
              onClick={() => setTab(item.id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer relative group
                ${isActive
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-indigo-400"
                />
              )}
              <span className={`${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {badge ? (
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{badge}</span>
              ) : isActive ? (
                <ChevronRight size={13} className="text-indigo-400/60" />
              ) : null}
            </motion.button>
          );
        })}
      </nav>

      {/* Backend status */}
      <div className="p-3 pb-6">
        <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2 border ${backendOnline ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
          <StatusDot online={backendOnline} />
          <div>
            <p className="text-xs font-medium text-slate-300">Backend</p>
            <p className={`text-[10px] ${backendOnline ? 'text-emerald-400' : 'text-red-400'}`}>
              {backendOnline ? 'Connected' : 'Offline'}
            </p>
          </div>
          <Zap size={12} className={`ml-auto ${backendOnline ? 'text-emerald-400' : 'text-red-400'}`} />
        </div>
      </div>
    </aside>
  );
}
