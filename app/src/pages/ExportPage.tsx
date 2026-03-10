import { Download, FileJson, FileText, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { SectionHeader, StatCard, EmptyState, CodeBlock } from '../components/UI';
import { useApp } from '../store/AppContext';
import { exportVideosAsCSV, exportVideosAsJSON, exportVideosAsZip } from '../utils/helpers';

export default function ExportPage() {
  const { extractedVideos, clearVideos, settings } = useApp();

  const totalWords = extractedVideos.reduce(
    (n, v) => n + v.transcript.reduce((w, e) => w + e.text.split(' ').length, 0), 0
  );

  const handleZip = async () => {
    if (!extractedVideos.length) { toast.error('No videos to export'); return; }
    await exportVideosAsZip(extractedVideos, settings);
    toast.success('ZIP downloaded!');
  };

  const handleCsv = () => {
    if (!extractedVideos.length) { toast.error('No videos to export'); return; }
    exportVideosAsCSV(extractedVideos);
    toast.success('CSV downloaded!');
  };

  const handleJson = () => {
    if (!extractedVideos.length) { toast.error('No videos to export'); return; }
    exportVideosAsJSON(extractedVideos);
    toast.success('JSON downloaded!');
  };

  const handleClear = () => {
    if (!extractedVideos.length) return;
    if (confirm('Clear all extracted data?')) {
      clearVideos();
      toast.success('All data cleared');
    }
  };

  const exampleMd = `# [Video Title](https://youtube.com/watch?v=...)

**Channel:** Channel Name
**Views:** 1.2M | **Likes:** 45K | **Comments:** 2.3K
**Duration:** 10:30 | **Published:** 2024-01-15

## Transcript

[00:00](https://youtube.com/watch?v=...&t=0) First line of transcript...
[00:15](https://youtube.com/watch?v=...&t=15) Second line...`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader
        title="Export"
        subtitle="Download all extracted transcripts in your preferred format"
        icon={<Download size={18} />}
        actions={
          <Button variant="danger" size="sm" icon={<Trash2 size={12} />} onClick={handleClear}>
            Clear All
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Videos" value={extractedVideos.length} icon={<Package size={12} />} />
        <StatCard label="Transcripts" value={extractedVideos.length} icon={<FileText size={12} />} />
        <StatCard label="Total Words" value={totalWords.toLocaleString()} icon={<FileText size={12} />} color="text-purple-400" />
        <StatCard label="Est. Size" value={`${(JSON.stringify(extractedVideos).length / 1024).toFixed(1)} KB`} icon={<Download size={12} />} color="text-blue-400" />
      </div>

      {/* Export buttons */}
      {extractedVideos.length > 0 ? (
        <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Export {extractedVideos.length} transcript{extractedVideos.length !== 1 ? 's' : ''}</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleZip}
              className="flex flex-col items-center gap-3 p-5 bg-indigo-500/8 hover:bg-indigo-500/14 border border-indigo-500/20 rounded-xl transition-all duration-150 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Package size={22} className="text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">ZIP Archive</p>
                <p className="text-xs text-slate-500 mt-0.5">Individual MD files + summary CSV</p>
              </div>
            </button>
            <button
              onClick={handleCsv}
              className="flex flex-col items-center gap-3 p-5 bg-emerald-500/8 hover:bg-emerald-500/14 border border-emerald-500/20 rounded-xl transition-all duration-150 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText size={22} className="text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">CSV</p>
                <p className="text-xs text-slate-500 mt-0.5">Spreadsheet with all metadata</p>
              </div>
            </button>
            <button
              onClick={handleJson}
              className="flex flex-col items-center gap-3 p-5 bg-yellow-500/8 hover:bg-yellow-500/14 border border-yellow-500/20 rounded-xl transition-all duration-150 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-yellow-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileJson size={22} className="text-yellow-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">JSON</p>
                <p className="text-xs text-slate-500 mt-0.5">Full structured data</p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <EmptyState icon={<Download size={24} />} title="Nothing to export" description="Extract some transcripts first" />
      )}

      {/* Format preview */}
      <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Output Format Preview (Markdown)</h3>
        <CodeBlock>{exampleMd}</CodeBlock>
      </div>
    </div>
  );
}
