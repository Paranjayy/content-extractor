import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Play, CheckCircle, XCircle, Copy, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { Textarea, Input } from '../components/Input';
import { SectionHeader, ProgressBar, StatCard, EmptyState, Badge } from '../components/UI';
import { useApp } from '../store/AppContext';
import { extractUrlMetadata } from '../utils/api';
import { isValidUrl, generateMarkdownLink, exportUrlsAsZip } from '../utils/helpers';
import type { UrlData } from '../types';

type FilterType = 'all' | 'success' | 'error' | 'duplicate';

export default function BulkUrlsPage() {
  const { addUrl, extractedUrls, urlSettings } = useApp();
  const [input, setInput] = useState('');
  const [maxUrls, setMaxUrls] = useState(25);
  const [includeDesc, setIncludeDesc] = useState(true);
  const [autoRetry, setAutoRetry] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<(UrlData & { status: 'success' | 'error' | 'duplicate' })[]>([]);
  const [stats, setStats] = useState({ processed: 0, successful: 0, failed: 0, duplicates: 0 });
  const [filter, setFilter] = useState<FilterType>('all');

  const processAll = async () => {
    const urls = input.split('\n').map(u => u.trim()).filter(u => isValidUrl(u)).slice(0, maxUrls);
    if (!urls.length) { toast.error('No valid URLs found'); return; }

    setProcessing(true);
    setResults([]);
    setProgress(0);
    const s = { processed: 0, successful: 0, failed: 0, duplicates: 0 };

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (extractedUrls.some(u => u.url === url)) {
        s.duplicates++;
        setResults(p => [...p, { url, title: url, description: '', domain: new URL(url).hostname, success: false, error: 'Already converted', convertedAt: new Date().toISOString(), status: 'duplicate' }]);
      } else {
        try {
          await new Promise(r => setTimeout(r, urlSettings.requestDelay));
          const data = await extractUrlMetadata(url, includeDesc, true);
          addUrl(data);
          if (data.success) s.successful++;
          else s.failed++;
          setResults(p => [...p, { ...data, status: data.success ? 'success' : 'error' }]);
        } catch {
          s.failed++;
          setResults(p => [...p, { url, title: new URL(url).hostname, description: '', domain: new URL(url).hostname, success: false, error: 'Fetch failed', convertedAt: new Date().toISOString(), status: 'error' }]);
        }
      }
      s.processed++;
      setStats({ ...s });
      setProgress(((i + 1) / urls.length) * 100);
    }

    setProcessing(false);
    toast.success(`Done! ${s.successful} converted`);
  };

  const copyAll = async () => {
    const successful = results.filter(r => r.status === 'success');
    if (!successful.length) { toast.error('No successful conversions'); return; }
    const md = successful.map(u => generateMarkdownLink(u, urlSettings.linkFormat)).join('\n');
    await navigator.clipboard.writeText(md);
    toast.success(`Copied ${successful.length} links!`);
  };

  const downloadZip = async () => {
    const successful = results.filter(r => r.status === 'success');
    if (!successful.length) { toast.error('No successful conversions'); return; }
    await exportUrlsAsZip(successful, urlSettings.linkFormat);
    toast.success('ZIP downloaded!');
  };

  const filtered = results.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader title="Bulk URLs" subtitle="Convert multiple URLs to Markdown links" icon={<List size={18} />} />

      <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter URLs, one per line:&#10;https://example.com&#10;https://another.com"
          label="URLs"
        />
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-36">
            <Input label="Max URLs" type="number" value={maxUrls} onChange={e => setMaxUrls(parseInt(e.target.value) || 25)} min={1} max={50} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" checked={includeDesc} onChange={e => setIncludeDesc(e.target.checked)} />
            Include descriptions
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" checked={autoRetry} onChange={e => setAutoRetry(e.target.checked)} />
            Auto-retry failures
          </label>
          <Button onClick={processAll} loading={processing} icon={<Play size={15} />} className="ml-auto">
            Process All
          </Button>
        </div>
        {processing && <ProgressBar value={progress} label={`Processing ${stats.processed} of ${input.split('\n').filter(u => isValidUrl(u.trim())).length} URLs`} />}
      </div>

      <AnimatePresence>
        {stats.processed > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-3">
            <StatCard label="Processed" value={stats.processed} icon={<List size={12} />} color="text-slate-300" />
            <StatCard label="Success" value={stats.successful} icon={<CheckCircle size={12} />} color="text-emerald-400" />
            <StatCard label="Failed" value={stats.failed} icon={<XCircle size={12} />} color="text-red-400" />
            <StatCard label="Dupes" value={stats.duplicates} icon={<List size={12} />} color="text-yellow-400" />
          </motion.div>
        )}
      </AnimatePresence>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['all', 'success', 'error', 'duplicate'] as FilterType[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white/[0.04] text-slate-400 hover:text-slate-200'}`}>
                  {f} ({results.filter(r => f === 'all' || r.status === f).length})
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={<Copy size={12} />} onClick={copyAll}>Copy All</Button>
              <Button size="sm" variant="secondary" icon={<Package size={12} />} onClick={downloadZip}>ZIP</Button>
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map((r, i) => (
              <div key={i} className={`bg-white/[0.02] border rounded-xl px-4 py-3 ${r.status === 'success' ? 'border-emerald-500/15' : r.status === 'duplicate' ? 'border-yellow-500/15' : 'border-red-500/15'}`}>
                <div className="flex items-start gap-3">
                  {r.status === 'success' ? <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" /> : r.status === 'duplicate' ? <XCircle size={14} className="text-yellow-400 mt-0.5 shrink-0" /> : <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-200 truncate">{r.title}</span>
                      <Badge variant="blue" size="sm">{r.domain}</Badge>
                    </div>
                    {r.status === 'success' && (
                      <code className="text-xs text-slate-500 mt-1 block truncate">{generateMarkdownLink(r, urlSettings.linkFormat)}</code>
                    )}
                    {r.error && <p className="text-xs text-slate-500 mt-0.5">{r.error}</p>}
                  </div>
                  {r.status === 'success' && (
                    <button onClick={() => { navigator.clipboard.writeText(generateMarkdownLink(r, urlSettings.linkFormat)); toast.success('Copied!'); }} className="text-slate-600 hover:text-indigo-400 transition-colors cursor-pointer shrink-0">
                      <Copy size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !processing && (
        <EmptyState icon={<List size={24} />} title="No results yet" description="Enter URLs above and click Process All" />
      )}
    </div>
  );
}
