import React, { useEffect, useState } from 'react';
import {
  IOSSettingsPage,
  IOSButton,
  IOSToastProvider,
  useIOSToast,
  toast as toastHelper,
} from '../components/ios';
import { getStorage } from '../lib/storage-v2';
import { loginWithGoogle, logout, getCurrentUser, getAccountInfo, requestAccountDeletion, type User as AuthUser, type AccountInfo } from '../lib/auth-api';
import { User, Bell, Shield, Database, Palette, Info, LogOut, Trash2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const [did, setDid] = useState<string>('');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [googleUser, setGoogleUser] = useState<AuthUser | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useIOSToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const storage = getStorage();
        const identity = await storage.getIdentity();
        setDid(identity || '');

        const isDark = localStorage.getItem('darkMode') === 'true';
        setDarkMode(isDark);

        const user = await getCurrentUser();
        setGoogleUser(user);

        if (user) {
          const info = await getAccountInfo();
          setAccountInfo(info);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleToggleNotifications = () => {
    setNotifications((prev) => !prev);
    toast(toastHelper.success('Notifications updated'));
  };

  const handleToggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
    document.documentElement.classList.toggle('dark', newValue);
    toast(toastHelper.success('Theme updated'));
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
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const handleDeleteAccount = async () => {
    if (!accountInfo?.email) return;
    
    const confirmed = confirm(
      `Are you sure you want to delete your account?\n\n` +
      `This action cannot be undone. All your data will be permanently deleted.\n\n` +
      `You can cancel deletion within 30 days.`
    );
    
    if (confirmed) {
      const result = await requestAccountDeletion({ exportData: true });
      if (result.success) {
        toast(toastHelper.success('Account deletion scheduled. Check your email.'));
        setAccountInfo({ ...accountInfo, pendingDeletion: true });
      } else {
        toast(toastHelper.error(result.error || 'Failed to request deletion'));
      }
    }
  };

  const settingsGroups = [
    {
      title: loading ? 'Loading...' : (googleUser ? 'Google Account' : 'Sign In'),
      items: loading ? [] : googleUser ? [
        {
          id: 'google-email',
          label: 'Email',
          value: googleUser.email,
          icon: <User className="w-5 h-5" />,
          type: 'default' as const,
        },
        {
          id: 'google-name',
          label: 'Name',
          value: googleUser.displayName || 'Not set',
          icon: <User className="w-5 h-5" />,
          type: 'default' as const,
        },
      ] : [
        {
          id: 'google-login',
          label: 'Sign in with Google',
          value: 'Connect your account',
          icon: <User className="w-5 h-5" />,
          type: 'action' as const,
          onClick: handleGoogleLogin,
        },
        {
          id: 'did',
          label: 'Your DID',
          value: did ? `${did.slice(0, 8)}...${did.slice(-4)}` : 'Not set',
          icon: <User className="w-5 h-5" />,
          type: 'navigation' as const,
        },
        {
          id: 'username',
          label: 'Display Name',
          value: googleUser?.displayName || did ? `${did.slice(0, 8)}...${did.slice(-4)}` : 'Not set',
          icon: <User className="w-5 h-5" />,
          type: 'default' as const,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: <Bell className="w-5 h-5" />,
          type: 'toggle' as const,
          toggleValue: notifications,
          onToggle: handleToggleNotifications,
        },
        {
          id: 'darkMode',
          label: 'Dark Mode',
          icon: <Palette className="w-5 h-5" />,
          type: 'toggle' as const,
          toggleValue: darkMode,
          onToggle: handleToggleDarkMode,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          id: 'privacy',
          label: 'Privacy Settings',
          icon: <Shield className="w-5 h-5" />,
          type: 'navigation' as const,
        },
        {
          id: 'encryption',
          label: 'Encryption Keys',
          icon: <Shield className="w-5 h-5" />,
          type: 'navigation' as const,
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          id: 'storage',
          label: 'Storage Usage',
          value: 'Calculating...',
          icon: <Database className="w-5 h-5" />,
          type: 'navigation' as const,
        },
        {
          id: 'sync',
          label: 'Sync Settings',
          icon: <Database className="w-5 h-5" />,
          type: 'navigation' as const,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          label: 'Version',
          value: '1.0.0',
          icon: <Info className="w-5 h-5" />,
          type: 'default' as const,
        },
        {
          id: 'terms',
          label: 'Terms of Service',
          icon: <Info className="w-5 h-5" />,
          type: 'navigation' as const,
        },
        {
          id: 'privacy-policy',
          label: 'Privacy Policy',
          icon: <Info className="w-5 h-5" />,
          type: 'navigation' as const,
        },
      ],
    },
    ...(accountInfo ? [{
      title: 'Account',
      items: [
        {
          id: 'account-status',
          label: 'Status',
          value: accountInfo.pendingDeletion ? 'Deletion scheduled' : accountInfo.status,
          icon: <User className="w-5 h-5" />,
          type: 'default' as const,
        },
        ...(googleUser && !accountInfo.pendingDeletion ? [{
          id: 'delete-account',
          label: 'Delete Account',
          value: 'Permanently remove your account',
          icon: <Trash2 className="w-5 h-5" />,
          type: 'action' as const,
          onClick: handleDeleteAccount,
          destructive: true,
        }] : []),
      ],
    }] : []),
  ];

  return (
    <IOSSettingsPage
      title="Settings"
      groups={settingsGroups}
      footer={
        <div className="space-y-3">
          <IOSButton
            variant="secondary"
            fullWidth
            icon={<LogOut className="w-5 h-5" />}
            onClick={handleLogout}
          >
            Log Out
          </IOSButton>
          <IOSButton
            variant="ghost"
            fullWidth
            icon={<Trash2 className="w-5 h-5" />}
            onClick={handleClearData}
          >
            Clear All Data
          </IOSButton>
        </div>
      }
    />
  );
};

// Wrap Settings with Toast Provider
export const SettingsWithProvider: React.FC = () => {
  return (
    <IOSToastProvider>
      <Settings />
    </IOSToastProvider>
  );
};
