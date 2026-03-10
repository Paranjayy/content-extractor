import { History, Copy, Trash2, ExternalLink, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { SectionHeader, StatCard, EmptyState, Badge } from '../components/UI';
import { useApp } from '../store/AppContext';
import { generateMarkdownLink, exportUrlsAsZip } from '../utils/helpers';

export default function UrlHistoryPage() {
  const { extractedUrls, failedUrls, clearUrls, urlSettings, removeUrl } = useApp();

  const uniqueDomains = new Set([...extractedUrls, ...failedUrls].map(u => u.domain)).size;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader
        title="Conversion History"
        subtitle="All URLs converted this session"
        icon={<History size={18} />}
        actions={
          <div className="flex gap-2">
            {extractedUrls.length > 0 && (
              <>
                <Button size="sm" variant="secondary" icon={<Copy size={12} />} onClick={async () => {
                  const md = extractedUrls.map(u => generateMarkdownLink(u, urlSettings.linkFormat)).join('\n');
                  await navigator.clipboard.writeText(md);
                  toast.success('Copied!');
                }}>Copy All</Button>
                <Button size="sm" variant="secondary" icon={<Package size={12} />} onClick={async () => {
                  await exportUrlsAsZip(extractedUrls, urlSettings.linkFormat);
                  toast.success('ZIP downloaded!');
                }}>ZIP</Button>
                <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={() => { if (confirm('Clear history?')) { clearUrls(); toast.success('Cleared'); } }}>Clear</Button>
              </>
            )}
          </div>
        }
      />

      {/* Stats */}
      {(extractedUrls.length > 0 || failedUrls.length > 0) && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total" value={extractedUrls.length + failedUrls.length} />
          <StatCard label="Successful" value={extractedUrls.length} color="text-emerald-400" />
          <StatCard label="Failed" value={failedUrls.length} color="text-red-400" />
          <StatCard label="Unique Domains" value={uniqueDomains} color="text-purple-400" />
        </div>
      )}

      {/* Successful */}
      {extractedUrls.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Successful ({extractedUrls.length})</h3>
          {extractedUrls.map((u, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3 hover:border-white/[0.1] transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-200 truncate">{u.title}</span>
                  <Badge variant="blue" size="sm">{u.domain}</Badge>
                </div>
                <code className="text-xs text-slate-500 block truncate">{generateMarkdownLink(u, urlSettings.linkFormat)}</code>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => { navigator.clipboard.writeText(generateMarkdownLink(u, urlSettings.linkFormat)); toast.success('Copied!'); }} className="p-1.5 hover:bg-white/[0.06] rounded-lg text-slate-500 hover:text-indigo-400 cursor-pointer transition-colors" title="Copy">
                  <Copy size={13} />
                </button>
                <a href={u.url} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-white/[0.06] rounded-lg text-slate-500 hover:text-indigo-400 transition-colors" title="Open">
                  <ExternalLink size={13} />
                </a>
                <button onClick={() => removeUrl(u.url)} className="p-1.5 hover:bg-red-500/15 rounded-lg text-slate-500 hover:text-red-400 cursor-pointer transition-colors" title="Remove">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Failed */}
      {failedUrls.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-red-400/80 mb-3">Failed ({failedUrls.length})</h3>
          {failedUrls.map((u, i) => (
            <div key={i} className="bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-400 truncate block">{u.url}</span>
                {u.error && <span className="text-xs text-red-400/70">{u.error}</span>}
              </div>
              <button onClick={() => removeUrl(u.url)} className="p-1.5 hover:bg-red-500/15 rounded-lg text-slate-500 hover:text-red-400 cursor-pointer transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {extractedUrls.length === 0 && failedUrls.length === 0 && (
        <EmptyState icon={<History size={24} />} title="No conversion history" description="Convert some URLs to see them here" />
      )}
    </div>
  );
}
