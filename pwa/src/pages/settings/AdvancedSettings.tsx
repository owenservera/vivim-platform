import React from 'react';
import { useSettingsStore } from '../../stores/settings.store';
import { useIOSToast, toast as toastHelper } from '../../components/ios';
import { 
  Cpu, 
  Globe, 
  Zap, 
  Link, 
  ChevronLeft,
  Shield,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

const AdvancedSettings: React.FC = () => {
  const { 
    apiBaseUrl, setApiBaseUrl,
    useRustCore, setUseRustCore,
    autoCapture, setAutoCapture,
    region, setRegion 
  } = useSettingsStore();
  
  const { toast } = useIOSToast();
  const navigate = useNavigate();

  const handleSave = () => {
    toast(toastHelper.success('Advanced settings saved'));
    navigate('/settings');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 lg:pb-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-secondary rounded-xl transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Advanced</h1>
          <p className="text-muted-foreground">Core engine and system configuration.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Core Engine */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Core Engine</h3>
          <Card variant="glass" className="overflow-hidden border-none shadow-sm divide-y divide-border/50">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Use Rust Core</p>
                  <p className="text-xs text-muted-foreground">Enable high-performance WASM engine</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={useRustCore}
                onChange={(e) => setUseRustCore(e.target.checked)}
                className="w-5 h-5 accent-primary"
              />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Auto-Capture</p>
                  <p className="text-xs text-muted-foreground">Automatically index new conversations</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={autoCapture}
                onChange={(e) => setAutoCapture(e.target.checked)}
                className="w-5 h-5 accent-primary"
              />
            </div>
          </Card>
        </div>

        {/* Network */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Network</h3>
          <Card variant="glass" className="overflow-hidden border-none shadow-sm p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Link className="w-4 h-4 text-muted-foreground" />
                API Base URL
              </label>
              <input 
                type="text" 
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                Data Region
              </label>
              <select 
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="GLOBAL">Global (Auto)</option>
                <option value="US_EAST">North America (East)</option>
                <option value="US_WEST">North America (West)</option>
                <option value="EU_CENTRAL">Europe (Central)</option>
                <option value="ASIA_SOUTH">Asia (South)</option>
              </select>
            </div>
          </Card>
        </div>

        {/* Danger Zone */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 px-1">Danger Zone</h3>
          <Card variant="glass" className="overflow-hidden border-red-500/20 shadow-sm p-4 bg-red-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-red-600 dark:text-red-400">Reset Engine State</p>
                <p className="text-xs text-muted-foreground">Clear internal caches and re-initialise</p>
              </div>
              <Button variant="outline" size="sm" className="text-red-500 border-red-500/20 hover:bg-red-500/10">
                Reset
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="pt-4">
        <Button 
          variant="primary" 
          fullWidth 
          size="lg" 
          className="rounded-xl"
          onClick={handleSave}
        >
          Save Advanced Changes
        </Button>
      </div>
    </div>
  );
};

export default AdvancedSettings;
