import React, { useState } from 'react';
import { Shield, RefreshCw, Trash2, Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../unified/Card';
import { Button } from '../unified/Button';
import { adminApiService } from '../../lib/admin-api';

interface SystemAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: 'maintenance' | 'cleanup' | 'sync' | 'backup' | 'restore';
  requiresConfirmation: boolean;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

interface ActionsPanelProps {
  onLoadingChange?: (loading: boolean) => void;
}

export const ActionsPanel: React.FC<ActionsPanelProps> = ({ onLoadingChange }) => {
  const [actions, setActions] = useState<SystemAction[]>([
    {
      id: 'clear-cache',
      name: 'Clear System Cache',
      description: 'Clear all cached data and temporary files',
      icon: <Trash2 className="w-5 h-5" />,
      type: 'cleanup',
      requiresConfirmation: true,
      status: 'idle'
    },
    {
      id: 'sync-all',
      name: 'Sync All Data',
      description: 'Force synchronization of all data across nodes',
      icon: <RefreshCw className="w-5 h-5" />,
      type: 'sync',
      requiresConfirmation: true,
      status: 'idle'
    },
    {
      id: 'backup-db',
      name: 'Backup Database',
      description: 'Create a complete backup of the database',
      icon: <Download className="w-5 h-5" />,
      type: 'backup',
      requiresConfirmation: true,
      status: 'idle'
    },
    {
      id: 'restore-db',
      name: 'Restore Database',
      description: 'Restore database from a previous backup',
      icon: <Upload className="w-5 h-5" />,
      type: 'restore',
      requiresConfirmation: true,
      status: 'idle'
    },
    {
      id: 'maintenance-mode',
      name: 'Toggle Maintenance Mode',
      description: 'Enable or disable system maintenance mode',
      icon: <Shield className="w-5 h-5" />,
      type: 'maintenance',
      requiresConfirmation: true,
      status: 'idle'
    }
  ]);

  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    action: SystemAction;
    onConfirm: () => void;
  } | null>(null);

  const executeAction = async (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    // Update action status to running
    setActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, status: 'running' } : a
    ));
    onLoadingChange?.(true);

    try {
      await adminApiService.executeSystemAction(actionId);

      // Update action status to completed
      setActions(prev => prev.map(a =>
        a.id === actionId ? { ...a, status: 'completed' } : a
      ));

      // Reset status after 2 seconds
      setTimeout(() => {
        setActions(prev => prev.map(a =>
          a.id === actionId ? { ...a, status: 'idle' } : a
        ));
      }, 2000);

    } catch (error) {
      console.error(`Failed to execute action ${actionId}:`, error);
      
      // Update action status to failed
      setActions(prev => prev.map(a =>
        a.id === actionId ? { ...a, status: 'failed' } : a
      ));

      // Reset status after 2 seconds
      setTimeout(() => {
        setActions(prev => prev.map(a =>
          a.id === actionId ? { ...a, status: 'idle' } : a
        ));
      }, 2000);
    } finally {
      onLoadingChange?.(false);
    }
  };

  const handleActionClick = (action: SystemAction) => {
    if (action.requiresConfirmation) {
      setShowConfirmDialog({
        action,
        onConfirm: () => {
          executeAction(action.id);
          setShowConfirmDialog(null);
        }
      });
    } else {
      executeAction(action.id);
    }
  };

  const getStatusColor = (status: SystemAction['status']) => {
    switch (status) {
      case 'running': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'completed': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'failed': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getTypeColor = (type: SystemAction['type']) => {
    switch (type) {
      case 'maintenance': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'cleanup': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'sync': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'backup': return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
      case 'restore': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>System Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {action.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(action.type)}`}>
                        {action.type}
                      </span>
                      {action.status !== 'idle' && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                          {action.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant={action.status === 'running' ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  disabled={action.status === 'running'}
                  className="flex-shrink-0"
                >
                  {action.status === 'running' ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {action.status === 'running' ? 'Running...' : 'Execute'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Confirm Action
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to execute "{showConfirmDialog.action.name}"? 
              This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <Button
                variant="primary"
                onClick={showConfirmDialog.onConfirm}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};