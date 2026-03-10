import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Layers, Trash2, Download, Package, FileJson, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { SectionHeader, StatCard, EmptyState } from '../components/UI';
import { VideoCard } from '../components/VideoCard';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { useApp } from '../store/AppContext';
import { exportVideosAsCSV, exportVideosAsJSON, exportVideosAsZip } from '../utils/helpers';

export default function HistoryPage() {
  const { extractedVideos, clearVideos, settings } = useApp();
  const [activeTranscript, setActiveTranscript] = useState<string | null>(null);

  const totalWords = extractedVideos.reduce(
    (n, v) => n + v.transcript.reduce((w, e) => w + e.text.split(' ').length, 0), 0
  );

  const handleClear = () => {
    if (!extractedVideos.length) return;
    if (confirm('Clear all transcript history?')) {
      clearVideos();
      setActiveTranscript(null);
      toast.success('History cleared');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader
        title="History"
        subtitle="All transcripts extracted this session"
        icon={<History size={18} />}
        actions={
          <div className="flex gap-2">
            {extractedVideos.length > 0 && (
              <>
                <Button size="sm" variant="secondary" icon={<Package size={12} />} onClick={() => exportVideosAsZip(extractedVideos, settings).then(() => toast.success('ZIP downloaded!'))}>
                  ZIP
                </Button>
                <Button size="sm" variant="secondary" icon={<FileText size={12} />} onClick={() => { exportVideosAsCSV(extractedVideos); toast.success('CSV downloaded!'); }}>
                  CSV
                </Button>
                <Button size="sm" variant="secondary" icon={<FileJson size={12} />} onClick={() => { exportVideosAsJSON(extractedVideos); toast.success('JSON downloaded!'); }}>
                  JSON
                </Button>
                <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={handleClear}>
                  Clear
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Stats */}
      {extractedVideos.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Videos" value={extractedVideos.length} icon={<History size={12} />} />
          <StatCard label="Total Lines" value={extractedVideos.reduce((n, v) => n + v.transcript.length, 0)} icon={<Layers size={12} />} color="text-purple-400" />
          <StatCard label="Total Words" value={totalWords.toLocaleString()} icon={<FileText size={12} />} color="text-blue-400" />
          <StatCard label="Data Size" value={`${(JSON.stringify(extractedVideos).length / 1024).toFixed(1)} KB`} icon={<Download size={12} />} color="text-slate-300" />
        </div>
      )}

      {/* List */}
      {extractedVideos.length > 0 ? (
        <div className="space-y-3">
          {extractedVideos.map(video => (
            <div key={video.videoId}>
              <VideoCard
                video={video}
                onViewTranscript={() => setActiveTranscript(activeTranscript === video.videoId ? null : video.videoId)}
              />
              <AnimatePresence>
                {activeTranscript === video.videoId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/[0.02] border border-t-0 border-white/[0.06] rounded-b-2xl p-5 -mt-2">
                      <TranscriptViewer videoData={video} settings={settings} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<History size={24} />} title="No history yet" description="Extract some YouTube transcripts to see them here" />
      )}
    </div>
  );
}
