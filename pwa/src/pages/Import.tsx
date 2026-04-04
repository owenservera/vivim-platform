/**
 * ImportPage.tsx
 *
 * One-click import page for ChatGPT and other AI platform exports
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileBox,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  FileUp,
  Zap,
  Info,
  ArrowLeft,
  RefreshCw,
  Settings,
  Play,
  Pause,
  ChevronRight,
  Cpu,
  Brain,
  Network,
  Database,
} from 'lucide-react';
import { useIOSToast, toast } from '../components/ios';
import { apiClient, csrfAwareFetch } from '../lib/api';
import type {
  ImportPhase,
  ImportJob,
  ImportScanResult,
  ImportTierConfig,
  TierProgress,
  ImportTier,
} from '../types/import';
import {
  DEFAULT_TIER_CONFIG,
  TIER_LABELS,
  TIER_DESCRIPTIONS,
} from '../types/import';

export const ImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast: showToast } = useIOSToast();
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [fileToken, setFileToken] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ImportScanResult | null>(null);
  const [tierConfig, setTierConfig] = useState<ImportTierConfig>(DEFAULT_TIER_CONFIG);
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingErrorCountRef = useRef<number>(0);

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await apiClient.get(`/import/jobs/${jobId}`);
      const job = response.data.job;

      setImportJob(job);

      if (job.status === 'COMPLETED') {
        setPhase('completed');
        showToast({
          title: 'Import Complete',
          message: `${job.processedConversations} conversations imported successfully`,
          variant: 'success',
        });
      } else if (job.status === 'FAILED') {
        setPhase('error');
        setError(job.errors?.[0]?.message || 'Import failed');
        showToast({
          title: 'Import Failed',
          message: job.errors?.[0]?.message || 'Something went wrong',
          variant: 'error',
        });
      } else if (job.status === 'CANCELLED' || job.status === 'PAUSED') {
        setPhase('idle');
        showToast({
          title: job.status === 'PAUSED' ? 'Import Paused' : 'Import Cancelled',
          variant: 'info',
        });
      } else {
        pollingTimeoutRef.current = setTimeout(() => pollJobStatus(jobId), 2000);
      }
    } catch (err) {
      console.error('Failed to poll job status:', err);
      // Stop polling on repeated errors after 3 attempts
      pollingErrorCountRef.current = (pollingErrorCountRef.current || 0) + 1;
      if (pollingErrorCountRef.current >= 3) {
        setPhase('error');
        setError('Failed to check import status. Please try again.');
        showToast({
          title: 'Connection Error',
          message: 'Could not reach the server. Please check your connection and try again.',
          variant: 'error',
        });
      } else {
        // Retry after a longer delay on error
        pollingTimeoutRef.current = setTimeout(() => pollJobStatus(jobId), 5000);
      }
    }
  }, [showToast]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith('.zip')) {
      showToast({
        title: 'Invalid File',
        message: 'Please select a .zip file',
        variant: 'error',
      });
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      showToast({
        title: 'File Too Large',
        message: 'Maximum file size is 100MB',
        variant: 'error',
      });
      return;
    }

    setFile(selectedFile);
    setError(null);
  }, [showToast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setPhase('scanning');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const localStorageOverride = typeof localStorage !== 'undefined' ? localStorage.getItem('VIVIM_API_OVERRIDE') : null;
      const apiBaseUrl = (localStorageOverride || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1')
        .replace(/\/api\/v1\/?$/, '')
        .replace(/\/api\/?$/, '')
        .replace(/\/$/, '');
      const scanUrl = `${apiBaseUrl}/api/v1/import/scan`;

      console.log('[Import] Starting scan:', scanUrl);
      console.log('[Import] File:', file.name, file.size, 'bytes');
      
      const response = await csrfAwareFetch(scanUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('[Import] Scan response:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Scan failed with status ${response.status}`);
      }

      const data = await response.json();
      
      setScanResult(data.scan);
      setFileToken(data.fileToken);
      
      if (data.recommendedConfig) {
        setTierConfig(prev => ({
          ...prev,
          ...data.recommendedConfig,
        }));
      }

      setPhase('configure');
      
      showToast({
        title: 'Scan Complete',
        message: `Found ${data.scan.totalConversations} conversations`,
        variant: 'success',
      });
    } catch (err: any) {
      console.error('Scan failed:', err);
      setPhase('error');
      setError(err.message || 'Scan failed');
      showToast({
        title: 'Scan Failed',
        message: err.message || 'Something went wrong',
        variant: 'error',
      });
    }
  };

  const handleStartImport = async () => {
    if (!fileToken) {
      showToast({
        title: 'Error',
        message: 'File token not found. Please scan the file again.',
        variant: 'error',
      });
      return;
    }

    setPhase('processing');
    setError(null);

    try {
      const localStorageOverride = typeof localStorage !== 'undefined' ? localStorage.getItem('VIVIM_API_OVERRIDE') : null;
      const apiBaseUrl = (localStorageOverride || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1')
        .replace(/\/api\/v1\/?$/, '')
        .replace(/\/api\/?$/, '')
        .replace(/\/$/, '');
      const startUrl = `${apiBaseUrl}/api/v1/import/start`;

      const response = await csrfAwareFetch(startUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileToken,
          tierConfig,
          intelligentOptions: { prioritizeRecent: false },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Start failed with status ${response.status}`);
      }

      const data = await response.json();

      showToast({
        title: 'Import Started',
        message: 'Processing your conversations...',
        variant: 'success',
      });

      setImportJob({
        id: data.jobId,
        status: data.status,
        currentTier: data.currentTier,
        fileName: file?.name || 'import.zip',
        totalConversations: scanResult?.totalConversations || 0,
        processedConversations: 0,
        failedConversations: 0,
        progress: 0,
        tierProgress: {},
        createdAt: new Date().toISOString(),
        errors: [],
      });

      setPhase('processing');
      pollJobStatus(data.jobId);
    } catch (err: any) {
      console.error('Start failed:', err);
      setPhase('error');
      setError(err.message || 'Import failed');
      showToast({
        title: 'Import Failed',
        message: err.message || 'Something went wrong',
        variant: 'error',
      });
    }
  };

  const handleCancel = async () => {
    if (!importJob?.id) return;

    try {
      await apiClient.post(`/import/jobs/${importJob.id}/cancel`);
      setPhase('idle');
      setFile(null);
      setFileToken(null);
      setScanResult(null);
      setImportJob(null);
      showToast({
        title: 'Import Cancelled',
        variant: 'info',
      });
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  const handleRetry = () => {
    setFile(null);
    setFileToken(null);
    setScanResult(null);
    setImportJob(null);
    setError(null);
    setPhase('idle');
    // Reset polling state
    pollingErrorCountRef.current = 0;
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Import Conversations
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* IDLE STATE - Upload Zone */}
          {phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Info Card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">How to export from ChatGPT:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
                    <li>Go to chatgpt.com/settings/data-controls</li>
                    <li>Click "Export Data"</li>
                    <li>Download the .zip file when ready</li>
                    <li>Upload it here to import your conversations</li>
                  </ol>
                </div>
              </div>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer
                  transition-all duration-300 ease-in-out
                  ${isDragging
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.02]'
                    : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-4">
                  <div className={`
                    w-20 h-20 rounded-2xl flex items-center justify-center
                    ${isDragging
                      ? 'bg-indigo-100 dark:bg-indigo-900/40'
                      : 'bg-gray-100 dark:bg-gray-800'
                    }
                  `}>
                    <Upload className={`
                      w-10 h-10
                      ${isDragging
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-400 dark:text-gray-500'
                      }
                    `} />
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {isDragging ? 'Drop to upload' : 'Drop your .zip file here'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      or click to browse (max 100MB)
                    </p>
                  </div>

                  {file && (
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
                      <FileBox className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  )}

                  {file && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpload();
                      }}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                    >
                      <FileUp className="w-5 h-5" />
                      Start Import
                    </button>
                  )}
                </div>
              </div>

              {/* Supported Formats */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Supported Formats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <span className="text-lg">🤖</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">ChatGPT</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Export from settings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl opacity-50">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <span className="text-lg">✨</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Claude</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCANNING STATE */}
          {phase === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-spin mb-6" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Scanning file...
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {file?.name}
              </p>
            </motion.div>
          )}

          {/* CONFIGURE STATE */}
          {phase === 'configure' && scanResult && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Scan Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Import Summary
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {scanResult.totalConversations}
                    </p>
                    <p className="text-sm text-gray-500">Conversations</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {scanResult.totalMessages.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Messages</p>
                  </div>
                </div>
              </div>

              {/* Tier Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Import Options
                </h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tierConfig.tier1?.enabled ?? false}
                      onChange={(e) => setTierConfig(prev => ({
                        ...prev,
                        tier1: { ...prev.tier1, enabled: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded text-indigo-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">ACU Generation</p>
                      <p className="text-sm text-gray-500">Extract knowledge units from messages</p>
                    </div>
                    <Cpu className="w-5 h-5 text-gray-400" />
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tierConfig.tier2?.enabled ?? false}
                      onChange={(e) => setTierConfig(prev => ({
                        ...prev,
                        tier2: { ...prev.tier2, enabled: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded text-indigo-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Memory Extraction</p>
                      <p className="text-sm text-gray-500">Extract facts and preferences</p>
                    </div>
                    <Brain className="w-5 h-5 text-gray-400" />
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tierConfig.tier3?.enabled ?? false}
                      onChange={(e) => setTierConfig(prev => ({
                        ...prev,
                        tier3: { ...prev.tier3, enabled: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded text-indigo-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Context Enrichment</p>
                      <p className="text-sm text-gray-500">Build knowledge graph</p>
                    </div>
                    <Network className="w-5 h-5 text-gray-400" />
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tierConfig.tier4?.enabled ?? false}
                      onChange={(e) => setTierConfig(prev => ({
                        ...prev,
                        tier4: { ...prev.tier4, enabled: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded text-indigo-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Index Building</p>
                      <p className="text-sm text-gray-500">Build search indexes</p>
                    </div>
                    <Database className="w-5 h-5 text-gray-400" />
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartImport}
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Import
                </button>
              </div>
            </motion.div>
          )}

          {/* PROCESSING STATE */}
          {phase === 'processing' && importJob && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Progress Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Processing Import
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {importJob.fileName}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {importJob.processedConversations} / {importJob.totalConversations} conversations
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {importJob.progress}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${importJob.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {importJob.processedConversations}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Processed</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {importJob.failedConversations}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {importJob.totalConversations - importJob.processedConversations - importJob.failedConversations}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                  </div>
                </div>

                {/* Cancel Button */}
                <button
                  onClick={handleCancel}
                  className="w-full mt-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                >
                  Cancel Import
                </button>
              </div>

              {/* Info */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                  <p className="font-semibold mb-1">Importing in background</p>
                  <p>You can navigate away - the import will continue processing.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* COMPLETED STATE */}
          {phase === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Import Complete!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-8 max-w-md">
                {importJob?.processedConversations} conversations have been imported to your library.
                ACU generation and memory extraction will continue in the background.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                >
                  View Conversations
                </button>
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Import More
                </button>
              </div>
            </motion.div>
          )}

          {/* ERROR STATE */}
          {phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Import Failed
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-8 max-w-md">
                {error || 'Something went wrong during the import process.'}
              </p>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ImportPage;
