import { Settings, Link, Clock, AlignLeft, AlertTriangle } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SectionHeader, Toggle, Select } from '../components/UI';
import { useApp } from '../store/AppContext';

export default function UrlSettingsPage() {
  const { urlSettings, updateUrlSettings, extractedUrls, failedUrls, clearUrls } = useApp();

  const retryFailed = async () => {
    // This would trigger retry of all failed URLs - for now just toast
    console.log('Retry failed not implemented in this view - use Bulk URLs tab');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionHeader title="URL Settings" subtitle="Configure URL conversion behavior" icon={<Settings size={18} />} />

      {/* Processing */}
      <section className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Link size={15} className="text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Processing Options</span>
        </div>
        <Toggle checked={urlSettings.useAdvancedScraping} onChange={v => updateUrlSettings({ useAdvancedScraping: v })} label="Use advanced scraping (slower, more metadata)" />
        <Toggle checked={urlSettings.extractSocialMeta} onChange={v => updateUrlSettings({ extractSocialMeta: v })} label="Extract social media metadata (Twitter cards, OG)" />
        <Toggle checked={urlSettings.includeDomainOnFail} onChange={v => updateUrlSettings({ includeDomainOnFail: v })} label="Include domain name as fallback on failure" />
      </section>

      {/* Rate limiting */}
      <section className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={15} className="text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Rate Limiting & Retries</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Request delay (ms)"
            type="number"
            value={urlSettings.requestDelay}
            onChange={e => updateUrlSettings({ requestDelay: parseInt(e.target.value) || 1000 })}
            min={0}
            max={10000}
          />
          <Input
            label="Max retries"
            type="number"
            value={urlSettings.maxRetries}
            onChange={e => updateUrlSettings({ maxRetries: parseInt(e.target.value) || 2 })}
            min={0}
            max={5}
          />
          <Input
            label="Timeout (ms)"
            type="number"
            value={urlSettings.requestTimeout}
            onChange={e => updateUrlSettings({ requestTimeout: parseInt(e.target.value) || 10000 })}
            min={1000}
            max={30000}
          />
        </div>
      </section>

      {/* Output format */}
      <section className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <AlignLeft size={15} className="text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Output Format</span>
        </div>
        <Select
          label="Link format"
          value={urlSettings.linkFormat}
          onChange={v => updateUrlSettings({ linkFormat: v })}
          options={[
            { value: '[title](url)', label: '[title](url) — Standard Markdown' },
            { value: '[[title]](url)', label: '[[title]](url) — Obsidian style' },
            { value: "[title](url 'description')", label: "[title](url 'desc') — With tooltip" },
          ]}
        />
        <Toggle checked={urlSettings.includeOriginalUrl} onChange={v => updateUrlSettings({ includeOriginalUrl: v })} label="Include original URL below the link" />
      </section>

      {/* Danger zone */}
      <section className="bg-white/[0.025] border border-red-500/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={15} className="text-red-400" />
          <span className="text-sm font-semibold text-red-400">Failed URLs</span>
        </div>
        <p className="text-xs text-slate-500">
          {extractedUrls.length} successful, {failedUrls.length} failed URLs in current session
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={retryFailed}>Retry All Failed</Button>
          {(extractedUrls.length > 0 || failedUrls.length > 0) && (
            <Button size="sm" variant="danger" onClick={() => { if (confirm('Clear all URL history?')) clearUrls(); }}>Clear All History</Button>
          )}
        </div>
      </section>
    </div>
  );
}
