/**
 * VIVIM Core API Client
 * 
 * Interfaces with the Rust Core backend for:
 * - FTS5 Full-Text Search
 * - ACU-based content retrieval
 * - P2P Sharing operations
 * - Conversation sync
 */

import { log } from './logger';

// ============================================================================
// Configuration
// ============================================================================

const getCoreApiBaseUrl = () => {
  const override = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('VIVIM_API_OVERRIDE')
    : null;
  const baseUrl = override || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  const root = baseUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${root}/api/v1/core`;
};

const getApiKey = () => {
  const storedApiKey = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('VIVIM_API_KEY')
    : null;
  if (storedApiKey) return storedApiKey;
  
  const envApiKey = import.meta.env.VITE_API_KEY || import.meta.env.REACT_APP_API_KEY;
  if (envApiKey) return envApiKey;
  
  return 'sk-vivim-dev-key-123456789';
};

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getApiKey()}`,
  'X-API-Key': getApiKey()
});

// ============================================================================
// Types
// ============================================================================

export interface CoreSearchResult {
  id: string;
  title: string;
  provider: string;
  sourceUrl: string;
  createdAt: string;
  rank?: number;
}

export interface CoreConversation {
  id: string;
  title: string;
  provider: string;
  sourceUrl: string;
  model?: string;
  stats: {
    messageCount: number;
    userMessageCount: number;
    assistantMessageCount: number;
    wordCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CoreACU {
  id: string;
  category: 'SystemGenerated' | 'UserGenerated';
  content: string;
  kind: 'Statement' | 'Question' | 'Answer' | 'CodeSnippet' | 'Reasoning' | 'Decision' | 'Reference' | 'Unknown';
  language?: string;
  provenance: {
    conversationId: string;
    messageId: string;
    createdAt: string;
    sourceProvider: string;
  };
}

export interface SharingPolicy {
  id: string;
  conversationId: string;
  recipientDid: string;
  allowReshare: boolean;
  expireAt?: string;
  createdAt: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Check if Rust Core is available
 */
export async function checkCoreStatus(): Promise<{ available: boolean; version?: string; error?: string }> {
  try {
    const response = await fetch(`${getCoreApiBaseUrl()}/status`, { headers: headers() });
    if (!response.ok) {
      return { available: false, error: `Status ${response.status}` };
    }
    const data = await response.json();
    return { available: data.success, version: data.version };
  } catch (error) {
    log.api.warn('Core status check failed', error);
    return { available: false, error: (error as Error).message };
  }
}

/**
 * Full-text search across conversations using FTS5
 */
export async function searchConversations(
  query: string, 
  options?: { limit?: number }
): Promise<CoreSearchResult[]> {
  const params = new URLSearchParams({ q: query });
  if (options?.limit) params.set('limit', String(options.limit));
  
  try {
    const response = await fetch(`${getCoreApiBaseUrl()}/search?${params}`, { 
      headers: headers() 
    });
    
    if (!response.ok) {
      log.api.error('Core search failed', new Error(`Status ${response.status}`));
      return [];
    }
    
    const result = await response.json();
    log.api.debug(`Core search: "${query}" → ${result.count} results`);
    return result.data || [];
  } catch (error) {
    log.api.error('Core search error', error as Error);
    return [];
  }
}

/**
 * Get conversation by ID from Rust Core
 */
export async function getConversation(id: string): Promise<CoreConversation | null> {
  try {
    const response = await fetch(`${getCoreApiBaseUrl()}/conversations/${id}`, { 
      headers: headers() 
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Status ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    log.api.error('Get conversation error', error as Error);
    return null;
  }
}

/**
 * Get conversation by source URL
 */
export async function getConversationByUrl(url: string): Promise<CoreConversation | null> {
  try {
    const params = new URLSearchParams({ url });
    const response = await fetch(`${getCoreApiBaseUrl()}/conversations/by-url?${params}`, { 
      headers: headers() 
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Status ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    log.api.error('Get conversation by URL error', error as Error);
    return null;
  }
}

/**
 * List conversations with pagination
 */
export async function listConversations(options?: { 
  limit?: number; 
  offset?: number 
}): Promise<{ data: CoreConversation[]; pagination: { limit: number; offset: number } }> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    
    const response = await fetch(`${getCoreApiBaseUrl()}/conversations?${params}`, { 
      headers: headers() 
    });
    
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    log.api.error('List conversations error', error as Error);
    return { data: [], pagination: { limit: 20, offset: 0 } };
  }
}

/**
 * Delete a conversation from Rust Core
 */
export async function deleteConversation(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${getCoreApiBaseUrl()}/conversations/${id}`, { 
      method: 'DELETE',
      headers: headers() 
    });
    
    return response.ok;
  } catch (error) {
    log.api.error('Delete conversation error', error as Error);
    return false;
  }
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<unknown[]> {
  try {
    const response = await fetch(`${getCoreApiBaseUrl()}/conversations/${conversationId}/messages`, { 
      headers: headers() 
    });
    
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    log.api.error('Get messages error', error as Error);
    return [];
  }
}

// ============================================================================
// P2P Sharing API (Future - when backend endpoints are added)
// ============================================================================

/**
 * Create a sharing policy for a conversation
 * Note: Requires backend endpoint /api/v1/core/sharing to be implemented
 */
export async function createSharingPolicy(
  conversationId: string,
  recipientDid: string,
  options?: { allowReshare?: boolean; expireAt?: string }
): Promise<SharingPolicy | null> {
  try {
    const response = await fetch(`${getCoreApiBaseUrl()}/sharing`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        conversationId,
        recipientDid,
        allowReshare: options?.allowReshare ?? false,
        expireAt: options?.expireAt
      })
    });
    
    if (!response.ok) {
      log.api.warn('Create sharing policy failed - endpoint may not exist yet');
      return null;
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    log.api.error('Create sharing policy error', error as Error);
    return null;
  }
}

/**
 * Get sharing policies for a conversation
 */
export async function getSharingPolicies(conversationId: string): Promise<SharingPolicy[]> {
  try {
    const response = await fetch(`${getCoreApiBaseUrl()}/sharing/${conversationId}`, { 
      headers: headers() 
    });
    
    if (!response.ok) return [];
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    log.api.error('Get sharing policies error', error as Error);
    return [];
  }
}

export default {
  checkCoreStatus,
  searchConversations,
  getConversation,
  getConversationByUrl,
  listConversations,
  deleteConversation,
  getMessages,
  createSharingPolicy,
  getSharingPolicies
};

// CoreApi wrapper for backwards compatibility
export const CoreApi = {
  checkCoreStatus,
  search: searchConversations,
  getConversation,
  getConversationByUrl,
  listConversations,
  deleteConversation,
  getMessages,
  createSharingPolicy,
  getSharingPolicies
};
