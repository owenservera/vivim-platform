import './Settings.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IOSSettingsPage,
  IOSButton,
  IOSToastProvider,
  useIOSToast,
  toast as toastHelper,
} from '../components/ios';
import { getStorage } from '../lib/storage-v2';
import { loginWithGoogle, getAccountInfo, requestAccountDeletion, type AccountInfo } from '../lib/auth-api';
import { useAuth } from '../lib/auth-context';
import { useDeviceContext } from '../lib/device-context';
import { DeviceType } from '../lib/device-detection';
import { Smartphone, Monitor, Tablet, RotateCcw } from 'lucide-react';
import { User, Bell, Shield, Database, Palette, Info, LogOut, Trash2, ChevronRight } from 'lucide-react';

export const Settings: React.FC = () => {
  const [did, setDid] = useState<string>('');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useIOSToast();
  const { user: googleUser, logout } = useAuth();
  const { deviceType, forceDeviceType, resetDeviceType, isForced } = useDeviceContext();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const storage = getStorage();
        const identity = await storage.getIdentity();
        setDid(identity || '');

        const isDark = localStorage.getItem('darkMode') === 'true';
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
    loadData();
  }, [googleUser]);

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
      window.location.reload();
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
      title: loading ? 'Loading...' : (googleUser ? 'Account' : 'Sign In'),
      items: loading ? [] : googleUser ? [
        {
          id: 'view-account',
          label: 'View Account Details',
          value: 'Manage your profile',
          icon: <User className="w-5 h-5" />,
          type: 'action' as const,
          onClick: () => navigate('/account'),
        },
        {
          id: 'google-email',
          label: 'Email',
          value: googleUser.email,
          icon: <ChevronRight className="w-5 h-5" />,
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
          value: (googleUser as any)?.displayName || (did ? `${did.slice(0, 8)}...${did.slice(-4)}` : 'Not set'),
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
        {
          id: 'deviceType',
          label: 'Device Type',
          icon: deviceType === 'mobile' ? <Smartphone className="w-5 h-5" /> :
                 deviceType === 'tablet' ? <Tablet className="w-5 h-5" /> :
                 <Monitor className="w-5 h-5" />,
          type: 'navigation' as const,
          value: isForced ? `${deviceType} (Forced)` : deviceType,
          onClick: () => {
            const nextType: DeviceType = deviceType === 'mobile' ? 'desktop' :
                                   deviceType === 'desktop' ? 'tablet' : 'mobile';
            forceDeviceType(nextType);
            toast(toastHelper.success(`Switched to ${nextType} view`));
          },
        },
        ...(isForced ? [{
          id: 'resetDeviceType',
          label: 'Reset Device Type',
          icon: <RotateCcw className="w-5 h-5" />,
          type: 'action' as const,
          onClick: () => {
            resetDeviceType();
            toast(toastHelper.success('Device type reset to auto-detect'));
          },
        }] : []),
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

export default SettingsWithProvider;
