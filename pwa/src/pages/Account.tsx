import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { getAccountInfo, requestAccountDeletion, cancelAccountDeletion, type AccountInfo } from '../lib/auth-api';
import { IOSButton, IOSSettingsGroup, IOSSettingsSection, IOSSettingsAction } from '../components/ios';
import { AccountLoadingScreen, LoadingButton } from '../components/auth';
import { toast } from '../components/ios';

export function AccountPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadAccountInfo();
  }, []);

  const loadAccountInfo = async () => {
    setIsLoading(true);
    try {
      const info = await getAccountInfo();
      setAccount(info);
    } catch (error) {
      toast.error('Failed to load account information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await requestAccountDeletion({ immediate: false, exportData: true });
      if (result.success) {
        toast.success('Account deletion scheduled. You have 30 days to cancel.');
        await loadAccountInfo();
        setShowDeleteConfirm(false);
      } else {
        toast.error(result.error || 'Failed to request deletion');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelAccountDeletion();
      if (result.success) {
        toast.success('Account deletion cancelled');
        await loadAccountInfo();
      } else {
        toast.error(result.error || 'Failed to cancel deletion');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
        <AccountLoadingScreen
          variant="card"
          userName={user?.displayName || undefined}
          avatarUrl={user?.avatarUrl}
        />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Failed to load account</p>
          <IOSButton onClick={loadAccountInfo}>Retry</IOSButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 pb-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-white/80 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        
        <div className="flex items-center gap-4">
          {account.avatarUrl ? (
            <img
              src={account.avatarUrl}
              alt={account.displayName || 'User'}
              className="w-20 h-20 rounded-full border-4 border-white/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/20">
              {(account.displayName || account.email).charAt(0).toUpperCase()}
            </div>
          )}
          
          <div>
            <h1 className="text-2xl font-bold">{account.displayName || 'User'}</h1>
            <p className="text-white/80">{account.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                Level {account.verificationLevel}
              </span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                Trust: {account.trustScore}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6">
        <IOSSettingsGroup>
          <IOSSettingsSection title="Account Status">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className={account.status === 'ACTIVE' ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                  {account.status}
                </span>
              </div>
              
              {account.pendingDeletion && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                    Account scheduled for deletion
                  </p>
                  {account.deletionDate && (
                    <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                      Will be deleted on {new Date(account.deletionDate).toLocaleDateString()}
                    </p>
                  )}
                  <LoadingButton
                    isLoading={isCancelling}
                    loadingText="Cancelling..."
                    onClick={handleCancelDeletion}
                    className="mt-3 w-full text-sm"
                  >
                    Cancel Deletion
                  </LoadingButton>
                </div>
              )}
            </div>
          </IOSSettingsSection>

          <IOSSettingsSection title="Account Details">
            <IOSSettingsAction label="DID" value={account.did} />
            <IOSSettingsAction label="Member Since" value={new Date(account.createdAt).toLocaleDateString()} />
            <IOSSettingsAction label="Last Active" value={account.lastSeenAt ? new Date(account.lastSeenAt).toLocaleDateString() : 'Unknown'} />
          </IOSSettingsSection>
        </IOSSettingsGroup>

        <IOSSettingsGroup className="mt-6">
          <IOSSettingsSection title="Actions">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
            
            {!account.pendingDeletion && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 border-t border-gray-200 dark:border-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Account
              </button>
            )}
          </IOSSettingsSection>
        </IOSSettingsGroup>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Account?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your account will be scheduled for deletion. You have 30 days to cancel this action. 
              Your data will be exported before deletion.
            </p>
            <div className="flex gap-3">
              <IOSButton
                variant="secondary"
                fullWidth
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </IOSButton>
              <LoadingButton
                isLoading={isDeleting}
                loadingText="Deleting..."
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountPage;
