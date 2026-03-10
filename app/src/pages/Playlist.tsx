import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Play, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SectionHeader, StatCard, EmptyState, LoadingSpinner } from '../components/UI';
import { VideoCard } from '../components/VideoCard';
import { useApp } from '../store/AppContext';
import { extractPlaylist } from '../utils/api';
import type { VideoData } from '../types';

export default function PlaylistPage() {
  const { settings, addVideo } = useApp();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [maxVideos, setMaxVideos] = useState(20);
  const [includeDesc, setIncludeDesc] = useState(settings.autoIncludeDescription);
  const [includeStats, setIncludeStats] = useState(settings.autoIncludeStats);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VideoData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, processed: 0 });

  const processPlaylist = async () => {
    if (!playlistUrl.trim()) { toast.error('Enter a playlist URL'); return; }
    setLoading(true);
    setResults([]);
    setErrors([]);

    try {
      const data = await extractPlaylist(playlistUrl, maxVideos, includeDesc, includeStats);
      setStats({ total: data.totalVideos, processed: data.processedVideos });

      const successful: VideoData[] = [];
      const failed: string[] = [];

      data.results.forEach(r => {
        if (r.success && r.metadata && r.transcript) {
          const vd: VideoData = {
            videoId: r.videoId || '',
            metadata: r.metadata,
            transcript: r.transcript,
            url: r.metadata.url || '',
            transcriptLanguage: r.transcriptLanguage,
            extractedAt: new Date().toISOString(),
          };
          successful.push(vd);
          addVideo(vd);
        } else {
          failed.push(r.error || 'Unknown error');
        }
      });

      setResults(successful);
      setErrors(failed);
      toast.success(`Processed ${data.processedVideos} of ${data.totalVideos} videos`);
    } catch (err: any) {
      toast.error(err.message || 'Playlist extraction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader
        title="Playlist"
        subtitle="Extract transcripts from an entire YouTube playlist"
        icon={<Hash size={18} />}
      />

      {/* Input */}
      <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <div className="flex gap-3">
          <Input
            value={playlistUrl}
            onChange={e => setPlaylistUrl(e.target.value)}
            placeholder="https://www.youtube.com/playlist?list=..."
            className="flex-1"
          />
          <Button onClick={processPlaylist} loading={loading} icon={<Play size={15} />} size="lg">
            Extract
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="w-40">
            <Input
              label="Max videos"
              type="number"
              value={maxVideos}
              onChange={e => setMaxVideos(Math.min(100, parseInt(e.target.value) || 20))}
              min={1}
              max={100}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer mt-4">
            <input type="checkbox" checked={includeDesc} onChange={e => setIncludeDesc(e.target.checked)} />
            Include descriptions
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer mt-4">
            <input type="checkbox" checked={includeStats} onChange={e => setIncludeStats(e.target.checked)} />
            Include stats
          </label>
        </div>
      </div>

      {loading && <LoadingSpinner text="Processing playlist…" />}

      {/* Stats */}
      <AnimatePresence>
        {(results.length > 0 || errors.length > 0) && !loading && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
            <StatCard label="Total in Playlist" value={stats.total} color="text-slate-300" icon={<Hash size={12} />} />
            <StatCard label="Extracted" value={results.length} color="text-emerald-400" icon={<CheckCircle size={12} />} />
            <StatCard label="Failed" value={errors.length} color="text-red-400" icon={<XCircle size={12} />} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((v, i) => <VideoCard key={i} video={v} />)}
        </div>
      )}

      {errors.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
          <p className="text-sm font-medium text-red-400 mb-2">{errors.length} video(s) failed</p>
          {errors.slice(0, 5).map((e, i) => <p key={i} className="text-xs text-red-400/70">{e}</p>)}
          {errors.length > 5 && <p className="text-xs text-red-400/50">+{errors.length - 5} more</p>}
        </div>
      )}

      {!loading && results.length === 0 && errors.length === 0 && (
        <EmptyState icon={<Hash size={24} />} title="No playlist loaded" description="Enter a YouTube playlist URL and click Extract" />
      )}
    </div>
  );
}
