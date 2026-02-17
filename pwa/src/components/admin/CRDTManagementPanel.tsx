import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Users, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../unified/Card';
import { Button } from '../unified/Button';
import { adminApiService, CRDTDocument } from '../../lib/admin-api';

interface CRDTManagementPanelProps {
  onLoadingChange?: (loading: boolean) => void;
}

export const CRDTManagementPanel: React.FC<CRDTManagementPanelProps> = ({ onLoadingChange }) => {
  const [documents, setDocuments] = useState<CRDTDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCRDTDocuments();
  }, []);

  const loadCRDTDocuments = async () => {
    setIsLoading(true);
    onLoadingChange?.(true);
    
    try {
      const crdtDocuments = await adminApiService.getCRDTDocuments();
      setDocuments(crdtDocuments);
    } catch (error) {
      console.error('Failed to load CRDT documents:', error);
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  const syncDocument = async (documentId: string) => {
    try {
      // Update document status to syncing
      setDocuments(prev => prev.map(doc =>
        doc.id === documentId ? { ...doc, status: 'syncing' as const } : doc
      ));

      await adminApiService.syncCRDTDocument(documentId);

      // Update document status to synced
      setDocuments(prev => prev.map(doc =>
        doc.id === documentId ? {
          ...doc,
          status: 'synced' as const,
          lastSync: new Date().toISOString(),
          version: doc.version + 1
        } : doc
      ));
    } catch (error) {
      console.error(`Failed to sync document ${documentId}:`, error);
      
      // Update document status to indicate error
      setDocuments(prev => prev.map(doc =>
        doc.id === documentId ? { ...doc, status: 'conflict' as const } : doc
      ));
    }
  };

  const resolveConflict = async (documentId: string) => {
    try {
      // Update document status to syncing
      setDocuments(prev => prev.map(doc =>
        doc.id === documentId ? { ...doc, status: 'syncing' as const } : doc
      ));

      await adminApiService.resolveCRDTConflict(documentId);

      // Update document status to synced
      setDocuments(prev => prev.map(doc =>
        doc.id === documentId ? {
          ...doc,
          status: 'synced' as const,
          lastSync: new Date().toISOString(),
          version: doc.version + 1
        } : doc
      ));
    } catch (error) {
      console.error(`Failed to resolve conflict for document ${documentId}:`, error);
    }
  };

  const getStatusColor = (status: CRDTDocument['status']) => {
    switch (status) {
      case 'synced': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'syncing': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'conflict': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'offline': return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getTypeIcon = (type: CRDTDocument['type']) => {
    switch (type) {
      case 'conversation': return <FileText className="w-4 h-4" />;
      case 'circle': return <Users className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      case 'group': return <Users className="w-4 h-4" />;
      case 'follow': return <Activity className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>CRDT Document Management</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={loadCRDTDocuments}
              disabled={isLoading}
              className="ml-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {documents.length}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Synced</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {documents.filter(d => d.status === 'synced').length}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <RefreshCw className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Syncing</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {documents.filter(d => d.status === 'syncing').length}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Conflicts</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {documents.filter(d => d.status === 'conflict').length}
              </div>
            </div>
          </div>

          {/* Document List */}
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  {getTypeIcon(doc.type)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {doc.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {doc.type} • v{doc.version} • {doc.collaborators} collaborators • {formatSize(doc.size)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Last sync: {new Date(doc.lastSync).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {doc.status === 'conflict' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => resolveConflict(doc.id)}
                    >
                      Resolve
                    </Button>
                  )}
                  
                  {(doc.status === 'offline' || doc.status === 'conflict') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncDocument(doc.id)}
                      disabled={doc.status === 'syncing'}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${doc.status === 'syncing' ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};