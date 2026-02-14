import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Settings, 
  Lock, 
  Globe, 
  UserPlus,
  ChevronRight,
  X,
  Check,
  Search
} from 'lucide-react';
import { IOSCard, IOSButton, IOSInput, IOSAvatar, IOSEmptyState } from './index';
import { useIOSToast, toast } from './Toast';
import { cn } from '../../lib/utils';
import type { Circle } from '../../types/features';

interface CircleManagerProps {
  circles: Circle[];
  onCreateCircle?: (name: string, description: string, visibility: 'public' | 'private' | 'secret') => void;
  onJoinCircle?: (inviteCode: string) => void;
  onLeaveCircle?: (circleId: string) => void;
  onShareToCircle?: (circleId: string) => void;
  open: boolean;
  onClose: () => void;
  mode?: 'manage' | 'share';
  conversationId?: string;
}

export const CircleManager: React.FC<CircleManagerProps> = ({
  circles,
  onCreateCircle,
  onJoinCircle,
  onLeaveCircle,
  onShareToCircle,
  open,
  onClose,
  mode = 'manage',
  conversationId,
}) => {
  const [activeTab, setActiveTab] = useState<'my-circles' | 'discover' | 'create'>('my-circles');
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDescription, setNewCircleDescription] = useState('');
  const [newCircleVisibility, setNewCircleVisibility] = useState<'public' | 'private' | 'secret'>('private');
  const [inviteCode, setInviteCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast: showToast } = useIOSToast();

  const handleCreateCircle = () => {
    if (!newCircleName.trim()) {
      showToast(toast.error('Please enter a circle name'));
      return;
    }
    onCreateCircle?.(newCircleName, newCircleDescription, newCircleVisibility);
    showToast(toast.success('Circle created successfully'));
    setNewCircleName('');
    setNewCircleDescription('');
    setActiveTab('my-circles');
  };

  const handleJoinCircle = () => {
    if (!inviteCode.trim()) {
      showToast(toast.error('Please enter an invite code'));
      return;
    }
    onJoinCircle?.(inviteCode);
    showToast(toast.success('Joined circle successfully'));
    setInviteCode('');
  };

  const handleShare = (circleId: string) => {
    onShareToCircle?.(circleId);
    showToast(toast.success('Shared to circle'));
    onClose();
  };

  const filteredCircles = circles.filter(circle =>
    circle.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myCircles = filteredCircles.filter(c => c.isMember);
  const discoverCircles = filteredCircles.filter(c => !c.isMember && c.visibility === 'public');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <IOSCard 
        variant="elevated" 
        padding="none" 
        className="relative w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === 'share' ? 'Share to Circle' : 'Circles'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'manage' && (
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('my-circles')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors',
                activeTab === 'my-circles'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              My Circles
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors',
                activeTab === 'discover'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors',
                activeTab === 'create'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Create
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {(activeTab === 'my-circles' || mode === 'share') && (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <IOSInput
                  placeholder="Search circles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {myCircles.length === 0 ? (
                <IOSEmptyState
                  icon={<Users className="w-12 h-12" />}
                  title="No circles yet"
                  description="Create a circle or join one with an invite code"
                  actionLabel="Create Circle"
                  onAction={() => setActiveTab('create')}
                />
              ) : (
                <div className="space-y-3">
                  {myCircles.map((circle) => (
                    <div
                      key={circle.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                        'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                      )}
                    >
                      <IOSAvatar
                        initials={circle.name.slice(0, 2).toUpperCase()}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {circle.name}
                          </h3>
                          {circle.visibility === 'private' && (
                            <Lock className="w-3.5 h-3.5 text-gray-400" />
                          )}
                          {circle.visibility === 'public' && (
                            <Globe className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {circle.memberCount} members · {circle.acuCount} conversations
                        </p>
                      </div>
                      {mode === 'share' ? (
                        <IOSButton
                          variant="primary"
                          size="sm"
                          onClick={() => handleShare(circle.id)}
                        >
                          Share
                        </IOSButton>
                      ) : (
                        <button
                          onClick={() => onLeaveCircle?.(circle.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'discover' && mode === 'manage' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Join with Invite Code
                </label>
                <div className="flex gap-2">
                  <IOSInput
                    placeholder="Enter invite code..."
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="flex-1"
                  />
                  <IOSButton
                    variant="primary"
                    onClick={handleJoinCircle}
                    icon={<UserPlus className="w-4 h-4" />}
                  >
                    Join
                  </IOSButton>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Public Circles
                </h3>
                {discoverCircles.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No public circles available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {discoverCircles.map((circle) => (
                      <div
                        key={circle.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700"
                      >
                        <IOSAvatar
                          initials={circle.name.slice(0, 2).toUpperCase()}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {circle.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {circle.memberCount} members
                          </p>
                        </div>
                        <IOSButton
                          variant="secondary"
                          size="sm"
                          onClick={() => onJoinCircle?.(circle.id)}
                        >
                          Join
                        </IOSButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'create' && mode === 'manage' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Circle Name *
                </label>
                <IOSInput
                  placeholder="e.g., AI Researchers"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="What is this circle about?"
                  value={newCircleDescription}
                  onChange={(e) => setNewCircleDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibility
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setNewCircleVisibility('public')}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                      newCircleVisibility === 'public'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    )}
                  >
                    <Globe className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Public</p>
                      <p className="text-xs text-gray-500">Anyone can find and join</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setNewCircleVisibility('private')}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                      newCircleVisibility === 'private'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    )}
                  >
                    <Lock className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Private</p>
                      <p className="text-xs text-gray-500">Invite only</p>
                    </div>
                  </button>
                </div>
              </div>

              <IOSButton
                variant="primary"
                fullWidth
                onClick={handleCreateCircle}
                icon={<Plus className="w-4 h-4" />}
              >
                Create Circle
              </IOSButton>
            </div>
          )}
        </div>
      </IOSCard>
    </div>
  );
};

export default CircleManager;
