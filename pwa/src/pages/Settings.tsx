import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Info,
  LogOut,
  Trash2,
  ChevronRight,
  Terminal,
  Brain,
  Smartphone,
  Monitor,
  Tablet,
  RotateCcw,
  Moon,
  Sun,
  Sparkles,
  Lock,
  Cpu,
  Settings as SettingsIcon,
  AlertTriangle,
  XCircle,
  Calendar,
  Fingerprint,
  Upload
} from 'lucide-react';

/* Services & Utils */
import { useAuth } from '../lib/auth-context';
import { getStorage } from '../lib/storage-v2';
import { loginWithGoogle, getAccountInfo, requestAccountDeletion, cancelAccountDeletion, type AccountInfo } from '../lib/auth-api';
import { useIOSToast, toast as toastHelper } from '../components/ios';
import { cn } from '../lib/utils';

/* Components */
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Totem } from '../components/sovereignty/Totem';

export const Settings: React.FC = () => {
  const [did, setDid] = useState<string>('');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { toast } = useIOSToast();
  const { user: googleUser, logout } = useAuth();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const storage = getStorage();
      const identity = await storage.getIdentity();
      setDid(identity || '');

      const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('darkMode') === 'true';
      setDarkMode(isDark);

      if (googleUser) {
        const info = await getAccountInfo();
        setAccountInfo(info);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [googleUser]);

  const handleToggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
    document.documentElement.classList.toggle('dark', newValue);
    toast(toastHelper.success(`Theme switched to ${newValue ? 'dark' : 'light'} mode`));
  };

  const handleOpenDebug = () => {
    window.dispatchEvent(new CustomEvent('openscroll:open-debug'));
    toast(toastHelper.info('Debug Console Toggled'));
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      indexedDB.deleteDatabase('OpenScrollDB');
      toast(toastHelper.success('Data cleared'));
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleLogout = async () => {
    if (googleUser) {
      await logout();
    } else {
      toast(toastHelper.info('Logged out'));
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await requestAccountDeletion({ immediate: false, exportData: true });
      if (result.success) {
        toast(toastHelper.success('Account deletion scheduled (30 day grace period)'));
        await loadData();
        setShowDeleteConfirm(false);
      } else {
        toast(toastHelper.error(result.error || 'Failed to request deletion'));
      }
    } catch (error) {
      toast(toastHelper.error('An error occurred'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelAccountDeletion();
      if (result.success) {
        toast(toastHelper.success('Account deletion cancelled'));
        await loadData();
      } else {
        toast(toastHelper.error(result.error || 'Failed to cancel deletion'));
      }
    } catch (error) {
      toast(toastHelper.error('An error occurred'));
    } finally {
      setIsCancelling(false);
    }
  };

  const settingsGroups = [
    {
      title: 'Preferences',
      items: [
        {
          label: 'Notifications',
          value: notifications ? 'On' : 'Off',
          icon: <Bell className="w-5 h-5 text-amber-500" />,
          onClick: () => {
            setNotifications(!notifications);
            toast(toastHelper.success('Notifications updated'));
          }
        },
        {
          label: 'Appearance',
          value: darkMode ? 'Dark Mode' : 'Light Mode',
          icon: darkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-orange-400" />,
          onClick: handleToggleDarkMode,
        }
      ]
    },
    {
      title: 'AI & Personalization',
      items: [
        {
          label: 'AI Providers',
          value: 'BYOK, Models & API Keys',
          icon: <Sparkles className="w-5 h-5 text-orange-500" />,
          onClick: () => navigate('/settings/providers'),
        },
        {
          label: 'Context Recipes',
          value: 'L0-L7 Context layers',
          icon: <Brain className="w-5 h-5 text-purple-500" />,
          onClick: () => navigate('/settings/ai'),
        },
        {
          label: 'Chat Tools',
          value: 'Configure triggers',
          icon: <Terminal className="w-5 h-5 text-emerald-500" />,
          onClick: () => toast(toastHelper.info('Coming soon')),
        }
      ]
    },
    {
      title: 'Privacy & Sovereignty',
      items: [
        {
          label: 'Identity Dashboard',
          value: 'DID, Keys & Proofs',
          icon: <Lock className="w-5 h-5 text-indigo-500" />,
          onClick: () => navigate('/identity'),
        }
      ]
    },
    {
      title: 'Import & Export',
      items: [
        {
          label: 'Import Conversations',
          value: 'ChatGPT, Claude exports',
          icon: <Upload className="w-5 h-5 text-emerald-500" />,
          onClick: () => navigate('/import'),
        }
      ]
    },
    {
      title: 'System',
      items: [
        {
          label: 'Storage',
          value: 'Manage local data',
          icon: <Database className="w-5 h-5 text-cyan-500" />,
          onClick: () => navigate('/storage'),
        },
        {
          label: 'Admin Panel',
          value: 'Developer tools',
          icon: <Cpu className="w-5 h-5 text-gray-500" />,
          onClick: () => navigate('/admin'),
        },
        {
          label: 'Advanced Core Settings',
          value: 'WASM, Network & API Base',
          icon: <SettingsIcon className="w-5 h-5 text-slate-500" />,
          onClick: () => navigate('/settings/advanced'),
        },
        {
          label: 'Debug Console',
          value: 'Real-time log stream',
          icon: <Terminal className="w-5 h-5 text-red-500" />,
          onClick: handleOpenDebug,
        }
      ]
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 lg:pb-10">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-border/50 p-8 shadow-xl shadow-primary/5">
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="relative">
            {accountInfo?.avatarUrl ? (
              <img
                src={accountInfo.avatarUrl}
                alt={accountInfo.displayName || 'User'}
                className="w-24 h-24 rounded-2xl border-4 border-background shadow-2xl object-cover"
              />
            ) : (
              <Totem 
                did={did || accountInfo?.did || 'unknown'} 
                size={96} 
                className="rounded-2xl border-4 border-background shadow-2xl" 
              />
            )}
            <div className="absolute -bottom-2 -right-2 bg-success text-success-foreground text-[10px] font-bold px-2 py-1 rounded-full border-2 border-background">
              LVL {accountInfo?.verificationLevel || 0}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight mb-1">{accountInfo?.displayName || googleUser?.displayName || 'Identity Genesis'}</h1>
            <p className="text-muted-foreground mb-3">{accountInfo?.email || googleUser?.email || 'Self-Sovereign Node'}</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                <Shield className="w-3 h-3" />
                Trust Score: {accountInfo?.trustScore || 0}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
                accountInfo?.status === 'ACTIVE' 
                  ? "bg-success/10 text-success border-success/20" 
                  : "bg-warning/10 text-warning border-warning/20"
              )}>
                {accountInfo?.status || 'LOCAL'}
              </span>
            </div>
          </div>

          {!googleUser && (
            <Button variant="primary" size="sm" onClick={loginWithGoogle}>
              Connect Cloud
            </Button>
          )}
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>
      </div>

      {/* Account Deletion Warning */}
      {accountInfo?.pendingDeletion && (
        <Card className="border-warning/50 bg-warning/5 overflow-hidden">
          <div className="p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-warning-foreground">Account Scheduled for Deletion</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your account will be permanently deleted on {new Date(accountInfo.deletionDate!).toLocaleDateString()}.
              </p>
              <div className="flex gap-3 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelDeletion}
                  disabled={isCancelling}
                  className="border-warning/20 hover:bg-warning/10"
                >
                  {isCancelling ? <RotateCcw className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  Cancel Deletion
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Settings Groups */}
      <div className="space-y-6">
        {/* Account Details Group */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Account Protocol</h3>
          <Card variant="glass" className="overflow-hidden border-none shadow-sm divide-y divide-border/50">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm text-indigo-500">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">DID</p>
                  <p className="text-[10px] font-mono text-muted-foreground break-all max-w-[200px] md:max-w-sm">{did || accountInfo?.did || 'None'}</p>
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm text-slate-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Member Since</p>
                  <p className="text-xs text-muted-foreground">{accountInfo ? new Date(accountInfo.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {settingsGroups.map((group, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">{group.title}</h3>
            <Card variant="glass" className="overflow-hidden border-none shadow-sm">
              <div className="divide-y divide-border/50">
                {group.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={item.onClick}
                    className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.value}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-destructive px-1">Danger Zone</h3>
        <Card variant="glass" className="overflow-hidden border-destructive/10 bg-destructive/5 shadow-sm divide-y divide-destructive/10">
          {!accountInfo?.pendingDeletion && googleUser && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-destructive/10 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm text-destructive">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-destructive">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Schedule account for permanent deletion</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={handleClearData}
            className="w-full flex items-center justify-between p-4 hover:bg-destructive/10 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm text-destructive">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-destructive">Clear Local Data</p>
                <p className="text-xs text-muted-foreground">Wipe all IndexedDB caches & local settings</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </Card>
      </div>

      <div className="space-y-4 pt-4 border-t border-border/50">
        <Button 
          variant="secondary" 
          fullWidth 
          size="lg" 
          className="rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Log Out
        </Button>
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">VIVIM v1.0.0 • Distributed AI Memory</p>
        {did && <p className="text-[9px] font-mono text-muted-foreground/50 mt-2 truncate max-w-xs mx-auto">DID: {did}</p>}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full shadow-2xl border-destructive/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-destructive">Delete Account?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-muted-foreground">
                Your account will be scheduled for deletion. You will have <span className="font-bold text-foreground">30 days</span> to cancel this action. All your conversations will be exported to a local file first.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  variant="destructive" 
                  fullWidth 
                  size="lg" 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Scheduling..." : "Schedule Deletion"}
                </Button>
                <Button 
                  variant="ghost" 
                  fullWidth 
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Keep My Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;
