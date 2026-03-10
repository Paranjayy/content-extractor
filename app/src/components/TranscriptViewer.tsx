import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, AlignLeft, Layers } from 'lucide-react';
import { Button } from './Button';
import { groupTranscriptIntoParagraphs, formatTimestamp } from '../utils/helpers';
import type { VideoData } from '../types';
import type { AppSettings } from '../types';

interface TranscriptViewerProps {
  videoData: VideoData;
  settings: AppSettings;
}

type ViewMode = 'stitched' | 'raw';

export function TranscriptViewer({ videoData, settings }: TranscriptViewerProps) {
  const [mode, setMode] = useState<ViewMode>('stitched');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const { transcript, url } = videoData;
  const paragraphs = groupTranscriptIntoParagraphs(transcript, settings);

  const togglePara = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
        <span className="text-xs text-slate-500 mr-1">View:</span>
        <Button
          size="sm"
          variant={mode === 'stitched' ? 'primary' : 'secondary'}
          icon={<Layers size={12} />}
          onClick={() => setMode('stitched')}
        >
          Paragraphs
        </Button>
        <Button
          size="sm"
          variant={mode === 'raw' ? 'primary' : 'secondary'}
          icon={<AlignLeft size={12} />}
          onClick={() => setMode('raw')}
        >
          Raw Lines
        </Button>
        <span className="text-xs text-slate-600 ml-auto">{transcript.length} lines · {paragraphs.length} paragraphs</span>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2">
        <AnimatePresence mode="wait">
          {mode === 'stitched' ? (
            <motion.div
              key="stitched"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2"
            >
              {paragraphs.map((para, i) => (
                <div
                  key={i}
                  className="bg-white/[0.025] border border-white/[0.06] rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => togglePara(i)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                  >
                    {expanded.has(i) ? <ChevronDown size={14} className="text-indigo-400 shrink-0" /> : <ChevronRight size={14} className="text-slate-500 shrink-0" />}
                    <a
                      href={`${url}&t=${Math.floor(para.startTime)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md shrink-0"
                    >
                      {formatTimestamp(para.startTime)}
                    </a>
                    <span className="text-sm text-slate-300 truncate">{para.preview}</span>
                    <span className="ml-auto text-xs text-slate-600 shrink-0">{para.lines.length}L</span>
                  </button>
                  <AnimatePresence>
                    {expanded.has(i) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 pt-0 space-y-1.5 border-t border-white/[0.04]">
                          {para.lines.map((line, j) => (
                            <div key={j} className="flex items-start gap-2 text-sm">
                              <a
                                href={`${url}&t=${Math.floor(line.start)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-mono text-indigo-400/70 hover:text-indigo-300 shrink-0 mt-0.5"
                              >
                                {formatTimestamp(line.start)}
                              </a>
                              <span className="text-slate-300 leading-relaxed">{line.text}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="raw"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-1"
            >
              {transcript.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 text-sm py-1 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <a
                    href={`${url}&t=${Math.floor(entry.start)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md shrink-0 mt-0.5 transition-colors"
                  >
                    {formatTimestamp(entry.start)}
                  </a>
                  <span className="text-slate-300 leading-relaxed">{entry.text}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
