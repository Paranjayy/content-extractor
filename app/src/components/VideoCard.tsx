import { motion } from 'framer-motion';
import { Eye, ThumbsUp, MessageSquare, Clock, Calendar, Trash2, Copy, Download, FileText } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './UI';
import { formatNumber, formatTimestamp, generateMarkdown, downloadBlob, sanitizeFilename } from '../utils/helpers';
import { useApp } from '../store/AppContext';
import toast from 'react-hot-toast';
import type { VideoData } from '../types';

interface VideoCardProps {
  video: VideoData;
  onViewTranscript?: () => void;
  compact?: boolean;
}

export function VideoCard({ video, onViewTranscript, }: VideoCardProps) {
  const { metadata, url, videoId, transcriptLanguage } = video;
  const { settings, removeVideo } = useApp();

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdown(video, settings));
      toast.success('Copied to clipboard!');
    } catch { toast.error('Copy failed'); }
  };

  const downloadMd = () => {
    const md = generateMarkdown(video, settings);
    downloadBlob(md, `${sanitizeFilename(metadata.title)}.md`, 'text/markdown');
    toast.success('Markdown downloaded!');
  };

  const downloadTxt = () => {
    const txt = video.transcript.map(e => `${formatTimestamp(e.start)} ${e.text}`).join('\n');
    downloadBlob(txt, `${sanitizeFilename(metadata.title)}.txt`, 'text/plain');
    toast.success('Transcript downloaded!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-white/[0.025] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all duration-200 group"
    >
      {/* Thumbnail + info row */}
      <div className="flex gap-4 p-4">
        <div className="shrink-0">
          <img
            src={metadata.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
            alt={metadata.title}
            className="w-32 h-[72px] object-cover rounded-xl bg-white/[0.04]"
            onError={e => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`; }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 text-sm leading-snug line-clamp-2 mb-1">
            <a href={url} target="_blank" rel="noreferrer" className="hover:text-indigo-300 transition-colors">
              {metadata.title}
            </a>
          </h3>
          <p className="text-xs text-slate-500 mb-2">{metadata.channel}</p>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
            {metadata.views !== 'N/A' && metadata.views !== 'Unknown' && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Eye size={10} /> {formatNumber(metadata.views as number)}
              </span>
            )}
            {metadata.likes !== 'N/A' && metadata.likes !== 'Unknown' && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <ThumbsUp size={10} /> {formatNumber(metadata.likes as number)}
              </span>
            )}
            {metadata.comments !== 'N/A' && metadata.comments !== 'Unknown' && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <MessageSquare size={10} /> {formatNumber(metadata.comments as number)}
              </span>
            )}
            {typeof metadata.duration === 'number' && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Clock size={10} /> {formatTimestamp(metadata.duration)}
              </span>
            )}
            {metadata.publishDate && metadata.publishDate !== 'Unknown' && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Calendar size={10} /> {new Date(metadata.publishDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => removeVideo(videoId)}
            className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-600 hover:text-red-400 transition-colors"
            title="Remove"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
        <Badge variant="indigo">{video.transcript.length} lines</Badge>
        {transcriptLanguage && <Badge variant="purple">{transcriptLanguage}</Badge>}
        <div className="ml-auto flex gap-1.5">
          {onViewTranscript && (
            <Button size="sm" variant="ghost" icon={<FileText size={12} />} onClick={onViewTranscript}>
              View
            </Button>
          )}
          <Button size="sm" variant="secondary" icon={<Copy size={12} />} onClick={copyMarkdown}>
            Copy
          </Button>
          <Button size="sm" variant="secondary" icon={<Download size={12} />} onClick={downloadMd}>
            .md
          </Button>
          <Button size="sm" variant="secondary" icon={<FileText size={12} />} onClick={downloadTxt}>
            .txt
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
