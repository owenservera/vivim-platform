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
    <div className="fixed inset-0 z-[1060] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      <IOSCard 
        variant="elevated" 
        padding="none" 
        className="relative w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col rounded-3xl shadow-2xl border border-white/10"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {mode === 'share' ? 'Select Circle' : 'Circles'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Collaborative Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'manage' && (
          <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800/50 mx-5 mt-4 rounded-2xl shrink-0">
            {(['my-circles', 'discover', 'create'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2 text-xs font-bold rounded-xl transition-all capitalize tracking-tight',
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                )}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 ios-scrollbar-hide">
          {(activeTab === 'my-circles' || mode === 'share') && (
            <div className="space-y-5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  placeholder="Filter your circles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>

              {myCircles.length === 0 ? (
                <div className="py-12 text-center opacity-40">
                  <Users size={48} className="mx-auto mb-4" />
                  <p className="text-sm font-bold">No Circles Detected</p>
                  <p className="text-xs mt-1">Create or join a circle to begin</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myCircles.map((circle) => (
                    <button
                      key={circle.id}
                      onClick={() => mode === 'share' && handleShare(circle.id)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group',
                        mode === 'share' 
                          ? 'border-transparent hover:border-blue-500/30 bg-gray-50 dark:bg-gray-800/50' 
                          : 'border-transparent bg-gray-50 dark:bg-gray-800/50'
                      )}
                    >
                      <IOSAvatar
                        initials={circle.name.slice(0, 2).toUpperCase()}
                        size="md"
                        className="shadow-sm flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">
                            {circle.name}
                          </h3>
                          {circle.visibility === 'private' && <Lock className="w-3 h-3 text-gray-400" />}
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter mt-0.5">
                          {circle.memberCount} Members · {circle.acuCount} Knowledge Nodes
                        </p>
                      </div>
                      {mode === 'share' ? (
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                          <Plus className="w-4 h-4" />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLeaveCircle?.(circle.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'discover' && mode === 'manage' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
                  Access Key
                </label>
                <div className="flex gap-2">
                  <input
                    placeholder="Enter invite code..."
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <IOSButton
                    variant="primary"
                    onClick={handleJoinCircle}
                    className="rounded-2xl px-6"
                  >
                    Join
                  </IOSButton>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
                  Public Communities
                </h3>
                {discoverCircles.length === 0 ? (
                  <div className="py-12 text-center opacity-40">
                    <Globe size={40} className="mx-auto mb-3" />
                    <p className="text-xs font-bold">No public circles found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {discoverCircles.map((circle) => (
                      <div
                        key={circle.id}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                      >
                        <IOSAvatar
                          initials={circle.name.slice(0, 2).toUpperCase()}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">
                            {circle.name}
                          </h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {circle.memberCount} Members
                          </p>
                        </div>
                        <IOSButton
                          variant="secondary"
                          size="sm"
                          onClick={() => onJoinCircle?.(circle.id)}
                          className="rounded-xl px-4"
                        >
                          Join
                        </IOSButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'create' && mode === 'manage' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
                  Identity
                </label>
                <input
                  placeholder="Name your circle..."
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
                  Description
                </label>
                <textarea
                  placeholder="What is the purpose of this circle?"
                  value={newCircleDescription}
                  onChange={(e) => setNewCircleDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none min-h-[100px]"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
                  Visibility Protocol
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setNewCircleVisibility('public')}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
                      newCircleVisibility === 'public'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", newCircleVisibility === 'public' ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500")}>
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">Public</p>
                      <p className="text-[10px] text-gray-500">Discoverable by the network</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setNewCircleVisibility('private')}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
                      newCircleVisibility === 'private'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", newCircleVisibility === 'private' ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500")}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">Private</p>
                      <p className="text-[10px] text-gray-500">Restricted access protocol</p>
                    </div>
                  </button>
                </div>
              </div>

              <IOSButton
                variant="primary"
                fullWidth
                onClick={handleCreateCircle}
                icon={<Plus className="w-5 h-5" />}
                className="h-14 rounded-2xl text-lg shadow-xl shadow-blue-500/20 mt-4"
              >
                Establish Circle
              </IOSButton>
            </div>
          )}
        </div>
      </IOSCard>
    </div>
  );
};

export default CircleManager;
