import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Copy, Download, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SectionHeader, LoadingSpinner, Badge, CodeBlock, FadeIn } from '../components/UI';
import { useApp } from '../store/AppContext';
import { extractUrlMetadata } from '../utils/api';
import { generateMarkdownLink, downloadBlob, sanitizeFilename } from '../utils/helpers';
import type { UrlData } from '../types';

export default function SingleUrlPage() {
  const { addUrl, urlSettings } = useApp();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UrlData | null>(null);
  const [includeDesc, setIncludeDesc] = useState(true);
  const [includeOg, setIncludeOg] = useState(true);

  const convert = async () => {
    if (!url.trim()) { toast.error('Enter a URL'); return; }
    try { new URL(url); } catch { toast.error('Invalid URL'); return; }

    setLoading(true);
    setResult(null);
    try {
      const data = await extractUrlMetadata(url, includeDesc, includeOg);
      setResult(data);
      addUrl(data);
      if (data.success) toast.success('URL converted!');
      else toast.error(data.error || 'Failed to fetch metadata');
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const mdLink = result ? generateMarkdownLink(result, urlSettings.linkFormat) : '';

  const copy = async () => {
    if (!mdLink) return;
    await navigator.clipboard.writeText(mdLink);
    toast.success('Copied!');
  };

  const copyPlain = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    toast.success('URL copied!');
  };

  const download = () => {
    if (!mdLink || !result) return;
    downloadBlob(mdLink, `${sanitizeFilename(result.title)}.md`, 'text/markdown');
    toast.success('Downloaded!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader
        title="Single URL"
        subtitle="Convert any URL to a Markdown link with metadata"
        icon={<Globe size={18} />}
      />

      <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <div className="flex gap-3">
          <Input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && convert()}
            placeholder="https://example.com/article"
            className="flex-1"
          />
          <Button onClick={convert} loading={loading} icon={<Globe size={15} />} size="lg">
            Convert
          </Button>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" checked={includeDesc} onChange={e => setIncludeDesc(e.target.checked)} />
            Meta description
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" checked={includeOg} onChange={e => setIncludeOg(e.target.checked)} />
            Open Graph data
          </label>
        </div>
      </div>

      <AnimatePresence>
        {loading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><LoadingSpinner text="Fetching metadata…" /></motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {result && !loading && (
          <FadeIn>
            <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl overflow-hidden">
              {result.thumbnail && (
                <div className="h-40 overflow-hidden">
                  <img src={result.thumbnail} alt="" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#13131f]" />
                </div>
              )}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100 leading-snug mb-1">{result.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="blue">{result.domain}</Badge>
                      {result.success ? <Badge variant="green">✓ Success</Badge> : <Badge variant="red">✗ Failed</Badge>}
                    </div>
                  </div>
                  <a href={result.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-400 transition-colors shrink-0">
                    <ExternalLink size={15} />
                  </a>
                </div>
                {result.description && <p className="text-sm text-slate-400 leading-relaxed">{result.description}</p>}
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-medium">Markdown output:</p>
                  <CodeBlock>{mdLink}</CodeBlock>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" icon={<Copy size={12} />} onClick={copy}>Copy MD</Button>
                  <Button size="sm" variant="secondary" icon={<Download size={12} />} onClick={download}>.md file</Button>
                  <Button size="sm" variant="ghost" icon={<Copy size={12} />} onClick={copyPlain}>Copy URL</Button>
                </div>
              </div>
            </div>
          </FadeIn>
        )}
      </AnimatePresence>
    </div>
  );
}
