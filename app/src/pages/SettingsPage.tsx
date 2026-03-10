import { Settings, Key, Link, Database, Cpu, Server } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SectionHeader, Toggle } from '../components/UI';
import { useApp } from '../store/AppContext';
import { checkHealth, setBackendBase } from '../utils/api';

export default function SettingsPage() {
  const { settings, updateSettings } = useApp();

  const testBackend = async () => {
    setBackendBase(settings.backendUrl);
    const ok = await checkHealth();
    if (ok) toast.success('Backend connected!');
    else toast.error('Backend offline');
  };

  const clearData = () => {
    if (confirm('Clear all local storage data?')) {
      localStorage.clear();
      toast.success('Local data cleared');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionHeader title="Settings" subtitle="Customize your extraction experience" icon={<Settings size={18} />} />

      {/* API config */}
      <section className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Key size={15} className="text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">YouTube Data API</span>
        </div>
        <Input
          label="Custom API Key (optional)"
          type="password"
          value={settings.customApiKey}
          onChange={e => updateSettings({ customApiKey: e.target.value })}
          placeholder="AIza..."
        />
        <p className="text-xs text-slate-500">Leave blank to use the default key. For high-volume use, add your own Google API key.</p>
      </section>

      {/* Display */}
      <section className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Link size={15} className="text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Display Options</span>
        </div>
        <div className="space-y-4">
          <Toggle
            checked={settings.obsidianUrls}
            onChange={v => updateSettings({ obsidianUrls: v })}
            label="Obsidian-friendly URLs (use [title](url) format)"
          />
          <Toggle
            checked={settings.stitchedMode}
            onChange={v => updateSettings({ stitchedMode: v })}
            label="Stitched mode (group 2-3 lines into paragraphs)"
          />
          <Toggle
            checked={settings.includeTimestamps}
            onChange={v => updateSettings({ includeTimestamps: v })}
            label="Include timestamps in exports"
          />
        </div>
      </section>

      {/* Processing */}
      <section className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Cpu size={15} className="text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Processing</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Default max videos (bulk)"
            type="number"
            value={settings.defaultMaxVideos}
            onChange={e => updateSettings({ defaultMaxVideos: parseInt(e.target.value) || 25 })}
            min={1}
            max={100}
          />
        </div>
        <Toggle checked={settings.autoIncludeDescription} onChange={v => updateSettings({ autoIncludeDescription: v })} label="Auto-include descriptions" />
        <Toggle checked={settings.autoIncludeStats} onChange={v => updateSettings({ autoIncludeStats: v })} label="Auto-include view/like stats" />
        <Toggle checked={settings.detectDuplicates} onChange={v => updateSettings({ detectDuplicates: v })} label="Detect & skip duplicate videos" />
      </section>

      {/* Backend */}
      <section className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Server size={15} className="text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Backend Configuration</span>
        </div>
        <div className="flex gap-3">
          <Input
            label="Backend URL"
            value={settings.backendUrl}
            onChange={e => updateSettings({ backendUrl: e.target.value })}
            placeholder="/api or http://localhost:5002/api"
            className="flex-1"
          />
          <div className="flex items-end">
            <Button size="md" variant="secondary" onClick={testBackend}>Test</Button>
          </div>
        </div>
      </section>

      {/* Data */}
      <section className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Database size={15} className="text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Data & Privacy</span>
        </div>
        <p className="text-xs text-slate-500">All data is stored in your browser session. Nothing is sent to external servers except the YouTube/URL you request.</p>
        <Button variant="danger" size="sm" onClick={clearData}>Clear Local Storage</Button>
      </section>
    </div>
  );
}
