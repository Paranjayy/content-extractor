import { useState } from 'react';
import { FileText, Search, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { Textarea } from '../components/Input';
import { SectionHeader, EmptyState, Badge } from '../components/UI';
import { useApp } from '../store/AppContext';
import { extractUrlMetadata } from '../utils/api';
import { generateMarkdownLink } from '../utils/helpers';

export default function ExtractFromText() {
  const { addUrl, urlSettings } = useApp();
  const [text, setText] = useState('');
  const [extractedUrls, setExtractedUrls] = useState<string[]>([]);
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState<{ url: string; title: string; md: string }[]>([]);
  const [removeDupes, setRemoveDupes] = useState(true);

  const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

  const extract = () => {
    if (!text.trim()) { toast.error('Enter some text first'); return; }
    const found = text.match(URL_REGEX) || [];
    const urls = removeDupes ? [...new Set(found)] : found;
    setExtractedUrls(urls);
    setConverted([]);
    if (!urls.length) toast.error('No URLs found in text');
    else toast.success(`Found ${urls.length} URL${urls.length !== 1 ? 's' : ''}!`);
  };

  const convertAll = async () => {
    if (!extractedUrls.length) { toast.error('Extract URLs first'); return; }
    setConverting(true);
    const results: { url: string; title: string; md: string }[] = [];

    for (const url of extractedUrls) {
      try {
        const data = await extractUrlMetadata(url, true, false);
        addUrl(data);
        results.push({ url, title: data.title, md: generateMarkdownLink(data, urlSettings.linkFormat) });
      } catch {
        results.push({ url, title: new URL(url).hostname, md: `[${new URL(url).hostname}](${url})` });
      }
      await new Promise(r => setTimeout(r, urlSettings.requestDelay));
    }

    setConverted(results);
    setConverting(false);
    toast.success(`Converted ${results.length} URLs!`);
  };

  const copyAll = async () => {
    const md = converted.map(c => c.md).join('\n');
    await navigator.clipboard.writeText(md);
    toast.success('All links copied!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader title="Extract from Text" subtitle="Auto-detect URLs in pasted text and convert them" icon={<FileText size={18} />} />

      <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste any text containing URLs here. They'll be automatically detected and converted to Markdown links.&#10;&#10;Example: Check out https://example.com and also https://another.com for more info."
          className="min-h-[140px]"
          label="Text with embedded URLs"
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" checked={removeDupes} onChange={e => setRemoveDupes(e.target.checked)} />
            Remove duplicates
          </label>
          <Button onClick={extract} icon={<Search size={15} />} variant="secondary">
            Extract URLs
          </Button>
          {extractedUrls.length > 0 && (
            <Button onClick={convertAll} loading={converting} icon={<FileText size={15} />}>
              Convert All ({extractedUrls.length})
            </Button>
          )}
        </div>
      </div>

      {extractedUrls.length > 0 && (
        <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">{extractedUrls.length} URL{extractedUrls.length !== 1 ? 's' : ''} found</span>
            {converted.length > 0 && <Button size="sm" variant="secondary" icon={<Copy size={12} />} onClick={copyAll}>Copy All MD</Button>}
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2">
            {extractedUrls.map((url, i) => {
              const conv = converted.find(c => c.url === url);
              return (
                <div key={i} className="flex items-center gap-3 py-2 px-3 bg-white/[0.02] rounded-lg">
                  <Badge variant={conv ? 'green' : 'indigo'}>{new URL(url).hostname}</Badge>
                  <span className="flex-1 text-xs text-slate-400 font-mono truncate">{conv ? conv.md : url}</span>
                  <a href={url} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-indigo-400 transition-colors">
                    <ExternalLink size={12} />
                  </a>
                  {conv && (
                    <button onClick={() => { navigator.clipboard.writeText(conv.md); toast.success('Copied!'); }} className="text-slate-600 hover:text-indigo-400 cursor-pointer">
                      <Copy size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!extractedUrls.length && (
        <EmptyState icon={<Search size={24} />} title="No URLs extracted yet" description="Paste text with URLs above and click 'Extract URLs'" />
      )}
    </div>
  );
}
