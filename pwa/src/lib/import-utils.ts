/**
 * Import Utilities
 *
 * Helper functions for import process including error handling,
 * progress persistence, and file validation
 */

/**
 * User-friendly error messages mapping
 */
export const IMPORT_ERROR_MESSAGES: Record<string, { title: string; message: string; suggestion?: string }> = {
  'file_too_large': {
    title: 'File Too Large',
    message: 'The file you selected exceeds the maximum size limit of 100MB.',
    suggestion: 'Try exporting a smaller date range of conversations.',
  },
  'invalid_file_type': {
    title: 'Invalid File Type',
    message: 'Only .zip files from ChatGPT exports are supported.',
    suggestion: 'Export your conversations from ChatGPT settings and upload the .zip file.',
  },
  'invalid_format': {
    title: 'Invalid File Format',
    message: 'The file does not appear to be a valid ChatGPT export.',
    suggestion: 'Please re-export your conversations from ChatGPT and try again.',
  },
  'no_conversations': {
    title: 'No Conversations Found',
    message: 'No valid conversations were found in the file.',
    suggestion: 'Make sure you exported conversations, not just chat history or settings.',
  },
  'network_error': {
    title: 'Connection Error',
    message: 'Could not connect to the server. Please check your internet connection.',
    suggestion: 'Try refreshing the page and uploading again.',
  },
  'scan_failed': {
    title: 'Scan Failed',
    message: 'Failed to scan the file. Please try again.',
    suggestion: 'If the problem persists, try re-exporting your conversations.',
  },
  'import_failed': {
    title: 'Import Failed',
    message: 'An error occurred while importing your conversations.',
    suggestion: 'Some conversations may have been imported. Check your library.',
  },
  'duplicate_import': {
    title: 'Duplicate Import',
    message: 'This file has already been imported.',
    suggestion: 'Check your library for the imported conversations.',
  },
  'file_expired': {
    title: 'File Expired',
    message: 'The scanned file has expired. Please re-scan and try again.',
  },
  'unauthorized': {
    title: 'Unauthorized',
    message: 'You need to be logged in to import conversations.',
    suggestion: 'Please log in and try again.',
  },
};

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: any): {
  title: string;
  message: string;
  suggestion?: string;
} {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorLower = errorMessage.toLowerCase();

  // Match error to known patterns
  for (const [key, value] of Object.entries(IMPORT_ERROR_MESSAGES)) {
    if (errorLower.includes(key)) {
      return value;
    }
  }

  // Default error handling
  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return IMPORT_ERROR_MESSAGES.network_error;
  }

  if (errorLower.includes('timeout')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete.',
      suggestion: 'Try uploading a smaller file or check your connection.',
    };
  }

  if (errorLower.includes('permission') || errorLower.includes('access denied')) {
    return IMPORT_ERROR_MESSAGES.unauthorized;
  }

  // Generic fallback
  return {
    title: 'Import Error',
    message: errorMessage,
    suggestion: 'If the problem persists, please contact support.',
  };
}

/**
 * Progress storage keys
 */
const STORAGE_KEYS = {
  JOB_ID: 'import_job_id',
  JOB_STATUS: 'import_job_status',
  JOB_PROGRESS: 'import_job_progress',
  JOB_START_TIME: 'import_job_start_time',
  FILE_NAME: 'import_file_name',
  TOTAL_CONVERSATIONS: 'import_total_conversations',
};

/**
 * Save import job state to localStorage
 */
export function saveImportJobState(job: {
  id: string;
  status: string;
  progress: number;
  fileName: string;
  totalConversations: number;
}) {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(STORAGE_KEYS.JOB_ID, job.id);
    localStorage.setItem(STORAGE_KEYS.JOB_STATUS, job.status);
    localStorage.setItem(STORAGE_KEYS.JOB_PROGRESS, job.progress.toString());
    localStorage.setItem(STORAGE_KEYS.FILE_NAME, job.fileName);
    localStorage.setItem(STORAGE_KEYS.TOTAL_CONVERSATIONS, job.totalConversations.toString());
    localStorage.setItem(STORAGE_KEYS.JOB_START_TIME, Date.now().toString());
  } catch (error) {
    console.error('Failed to save import job state:', error);
  }
}

/**
 * Load import job state from localStorage
 */
export function loadImportJobState(): {
  id: string | null;
  status: string | null;
  progress: number;
  fileName: string | null;
  totalConversations: number;
  startTime: number | null;
} | null {
  try {
    if (typeof localStorage === 'undefined') return null;

    const jobId = localStorage.getItem(STORAGE_KEYS.JOB_ID);
    if (!jobId) return null;

    // Check if job is too old (> 24 hours)
    const startTime = parseInt(localStorage.getItem(STORAGE_KEYS.JOB_START_TIME) || '0');
    const age = Date.now() - startTime;
    if (age > 24 * 60 * 60 * 1000) {
      clearImportJobState();
      return null;
    }

    return {
      id: jobId,
      status: localStorage.getItem(STORAGE_KEYS.JOB_STATUS),
      progress: parseInt(localStorage.getItem(STORAGE_KEYS.JOB_PROGRESS) || '0'),
      fileName: localStorage.getItem(STORAGE_KEYS.FILE_NAME),
      totalConversations: parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_CONVERSATIONS) || '0'),
      startTime,
    };
  } catch (error) {
    console.error('Failed to load import job state:', error);
    return null;
  }
}

/**
 * Update import job progress
 */
export function updateImportJobProgress(progress: number, status?: string) {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(STORAGE_KEYS.JOB_PROGRESS, progress.toString());
    if (status) {
      localStorage.setItem(STORAGE_KEYS.JOB_STATUS, status);
    }
  } catch (error) {
    console.error('Failed to update import job progress:', error);
  }
}

/**
 * Clear import job state from localStorage
 */
export function clearImportJobState() {
  try {
    if (typeof localStorage === 'undefined') return;

    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear import job state:', error);
  }
}

/**
 * Check if there's an active import job
 */
export function hasActiveImportJob(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    return !!localStorage.getItem(STORAGE_KEYS.JOB_ID);
  } catch (error) {
    return false;
  }
}

/**
 * Validate ZIP file using magic numbers
 */
export async function validateZipFile(file: File): Promise<{
  valid: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer || buffer.byteLength < 4) {
          resolve({ valid: false, error: 'File is too small to be a valid ZIP file' });
          return;
        }

        const header = new Uint8Array(buffer.slice(0, 4));
        // ZIP file magic number: 0x50 0x4B 0x03 0x04 or 0x50 0x4B 0x05 0x06
        const isValidZip =
          (header[0] === 0x50 && header[1] === 0x4B) &&
          (header[2] === 0x03 || header[2] === 0x05);

        if (!isValidZip) {
          resolve({
            valid: false,
            error: 'File does not appear to be a valid ZIP archive',
          });
          return;
        }

        // Check for conversations.json inside (requires full file read)
        // This is a basic validation; for full validation, the backend handles it
        resolve({ valid: true });
      } catch (error) {
        resolve({
          valid: false,
          error: 'Failed to validate file format',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        valid: false,
        error: 'Failed to read file for validation',
      });
    };

    reader.readAsArrayBuffer(file.slice(0, 100)); // Read first 100 bytes for magic number check
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  }
  return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}

/**
 * Estimate import time based on conversation count
 */
export function estimateImportTime(conversationCount: number): string {
  // Base estimates: ~100ms per conversation for TIER_0
  const baseTimeMs = conversationCount * 100;

  // Add time for enabled tiers
  const tier1Time = conversationCount * 400; // ACU generation
  const tier2Time = conversationCount * 600; // Memory extraction
  const tier3Time = conversationCount * 800; // Context enrichment
  const tier4Time = conversationCount * 200; // Index building

  const totalTimeMs = baseTimeMs + tier1Time + tier2Time + tier3Time + tier4Time;

  return formatDuration(totalTimeMs / 1000);
}

/**
 * Calculate import progress percentage
 */
export function calculateProgress(
  processed: number,
  total: number,
  currentTier: number = 0,
  totalTiers: number = 5
): number {
  if (total === 0) return 0;

  const tierWeight = 100 / totalTiers;
  const currentTierProgress = (processed / total) * tierWeight;
  const completedTiersProgress = currentTier * tierWeight;

  return Math.min(Math.round(completedTiersProgress + currentTierProgress), 100);
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
