import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Copy, Download, FileText, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SectionHeader, LoadingSpinner, FadeIn } from '../components/UI';
import { VideoCard } from '../components/VideoCard';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { useApp } from '../store/AppContext';
import { extractTranscript } from '../utils/api';
import { generateMarkdown, downloadBlob, sanitizeFilename } from '../utils/helpers';
import type { VideoData } from '../types';

export default function SingleVideoPage() {
  const { settings, addVideo } = useApp();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VideoData | null>(null);
  const [includeDesc, setIncludeDesc] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);

  const handleExtract = async () => {
    if (!url.trim()) { toast.error('Please enter a YouTube URL'); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await extractTranscript(url.trim());
      setResult(data);
      addVideo(data);
      toast.success(`Extracted ${data.transcript.length} lines!`);
    } catch (err: any) {
      toast.error(err.message || 'Extraction failed');
    } finally {
      setLoading(false);
    }
  };

  const copyMd = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(generateMarkdown(result, settings));
    toast.success('Copied!');
  };

  const downloadMd = () => {
    if (!result) return;
    downloadBlob(generateMarkdown(result, settings), `${sanitizeFilename(result.metadata.title)}.md`, 'text/markdown');
  };

  const downloadTxt = () => {
    if (!result) return;
    const txt = result.transcript.map(e => `${e.start.toFixed(1)}s ${e.text}`).join('\n');
    downloadBlob(txt, `${sanitizeFilename(result.metadata.title)}.txt`, 'text/plain');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader
        title="Single Video"
        subtitle="Extract transcript from any YouTube video"
        icon={<Search size={18} />}
      />

      {/* Input */}
      <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <div className="flex gap-3">
          <Input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleExtract()}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1"
          />
          <Button onClick={handleExtract} loading={loading} icon={<Search size={15} />} size="lg">
            Extract
          </Button>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" checked={includeDesc} onChange={e => setIncludeDesc(e.target.checked)} />
            Include description
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" checked={includeStats} onChange={e => setIncludeStats(e.target.checked)} />
            Include stats
          </label>
        </div>
      </div>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingSpinner text="Extracting transcript…" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <FadeIn>
            <div className="space-y-4">
              <VideoCard video={result} />

              {/* Transcript viewer */}
              <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers size={15} className="text-indigo-400" />
                    <span className="text-sm font-semibold text-slate-200">Transcript</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" icon={<Copy size={12} />} onClick={copyMd}>
                      Copy MD
                    </Button>
                    <Button size="sm" variant="secondary" icon={<Download size={12} />} onClick={downloadMd}>
                      .md
                    </Button>
                    <Button size="sm" variant="secondary" icon={<FileText size={12} />} onClick={downloadTxt}>
                      .txt
                    </Button>
                  </div>
                </div>
                <TranscriptViewer videoData={result} settings={settings} />
              </div>
            </div>
          </FadeIn>
        )}
      </AnimatePresence>
    </div>
  );
}
