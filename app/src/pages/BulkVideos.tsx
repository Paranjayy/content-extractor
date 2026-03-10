import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { Textarea } from '../components/Input';
import { Input } from '../components/Input';
import { SectionHeader, ProgressBar, StatCard, EmptyState } from '../components/UI';
import { VideoCard } from '../components/VideoCard';
import { useApp } from '../store/AppContext';
import { extractTranscript } from '../utils/api';
import { extractVideoId, isPlaylistUrl, formatNumber } from '../utils/helpers';
import type { VideoData } from '../types';

type ResultStatus = 'success' | 'error' | 'duplicate';
interface BulkResult {
  url: string;
  videoId?: string;
  status: ResultStatus;
  data?: VideoData;
  error?: string;
}

export default function BulkVideosPage() {
  const { settings, addVideo, extractedVideos } = useApp();
  const [urls, setUrls] = useState('');
  const [maxVideos, setMaxVideos] = useState(settings.defaultMaxVideos);
  const [includeDesc, setIncludeDesc] = useState(settings.autoIncludeDescription);
  const [includeStats, setIncludeStats] = useState(settings.autoIncludeStats);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkResult[]>([]);
  const [stats, setStats] = useState({ processed: 0, successful: 0, failed: 0, duplicates: 0, words: 0 });
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'duplicate'>('all');

  const processAll = async () => {
    const lines = urls.split('\n').map(u => u.trim()).filter(u => u && !isPlaylistUrl(u)).slice(0, maxVideos);
    if (!lines.length) { toast.error('No valid video URLs found'); return; }

    setProcessing(true);
    setResults([]);
    setProgress(0);
    const newStats = { processed: 0, successful: 0, failed: 0, duplicates: 0, words: 0 };

    for (let i = 0; i < lines.length; i++) {
      const url = lines[i];
      const videoId = extractVideoId(url);

      if (settings.detectDuplicates && videoId && extractedVideos.some(v => v.videoId === videoId)) {
        newStats.duplicates++;
        setResults(p => [...p, { url, videoId: videoId || undefined, status: 'duplicate', error: 'Already extracted' }]);
      } else {
        try {
          const data = await extractTranscript(url);
          addVideo(data);
          newStats.successful++;
          newStats.words += data.transcript.reduce((n, e) => n + e.text.split(' ').length, 0);
          setResults(p => [...p, { url, videoId: data.videoId, status: 'success', data }]);
        } catch (err: any) {
          newStats.failed++;
          setResults(p => [...p, { url, videoId: videoId || undefined, status: 'error', error: err.message }]);
        }
      }

      newStats.processed++;
      setStats({ ...newStats });
      setProgress(((i + 1) / lines.length) * 100);
      if (i < lines.length - 1) await new Promise(r => setTimeout(r, 800));
    }

    setProcessing(false);
    toast.success(`Done! ${newStats.successful} extracted, ${newStats.failed} failed`);
  };

  const filtered = results.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader
        title="Bulk Videos"
        subtitle="Process multiple YouTube URLs at once"
        icon={<List size={18} />}
      />

      {/* Input */}
      <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <Textarea
          value={urls}
          onChange={e => setUrls(e.target.value)}
          placeholder="Enter YouTube URLs, one per line:&#10;https://www.youtube.com/watch?v=...&#10;https://www.youtube.com/watch?v=..."
          className="min-h-[130px]"
          label="YouTube URLs"
        />
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-36">
            <Input
              label="Max videos"
              type="number"
              value={maxVideos}
              onChange={e => setMaxVideos(Math.min(50, parseInt(e.target.value) || 25))}
              min={1}
              max={50}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" checked={includeDesc} onChange={e => setIncludeDesc(e.target.checked)} />
            Descriptions
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" checked={includeStats} onChange={e => setIncludeStats(e.target.checked)} />
            Stats
          </label>
          <Button onClick={processAll} loading={processing} icon={<Play size={15} />} className="ml-auto">
            Process All
          </Button>
        </div>

        {processing && (
          <ProgressBar value={progress} label={`Processing ${stats.processed} of ${urls.split('\n').filter(u => u.trim()).length} videos`} />
        )}
      </div>

      {/* Stats */}
      <AnimatePresence>
        {stats.processed > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-3">
            <StatCard label="Processed" value={stats.processed} icon={<List size={12} />} color="text-slate-300" />
            <StatCard label="Success" value={stats.successful} icon={<CheckCircle size={12} />} color="text-emerald-400" />
            <StatCard label="Failed" value={stats.failed} icon={<XCircle size={12} />} color="text-red-400" />
            <StatCard label="Words" value={formatNumber(stats.words)} icon={<AlertCircle size={12} />} color="text-indigo-400" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {(['all', 'success', 'error', 'duplicate'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white/[0.04] text-slate-400 hover:text-slate-200'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({results.filter(r => f === 'all' || r.status === f).length})
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((r, i) => (
              r.status === 'success' && r.data ? (
                <VideoCard key={i} video={r.data} />
              ) : (
                <div key={i} className={`bg-white/[0.02] border rounded-xl px-4 py-3 flex items-center gap-3 ${r.status === 'error' ? 'border-red-500/20' : 'border-yellow-500/20'}`}>
                  {r.status === 'error' ? <XCircle size={15} className="text-red-400 shrink-0" /> : <AlertCircle size={15} className="text-yellow-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{r.url}</p>
                    <p className="text-xs text-slate-500">{r.error}</p>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !processing && (
        <EmptyState icon={<List size={24} />} title="No results yet" description="Enter YouTube URLs above and click Process All" />
      )}
    </div>
  );
}
