// lib/api/sharing-api.ts - VIVIM Sharing/Network API Client
// Connects to backend as specified in VIVIM.docs/NETWORK/.current/07-API-ENDPOINTS.md

import { useSettingsStore } from '../stores/settings.store';
import { useIdentityStore } from '../stores/identity.store';

// API Base URL
const getBaseUrl = () => {
  const settings = useSettingsStore.getState();
  return settings.apiBaseUrl || 'http://localhost:3000/api/v1';
};

// Auth headers
const getAuthHeaders = () => {
  const identity = useIdentityStore.getState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (identity.did) {
    headers['Authorization'] = `Bearer ${identity.did}`;
  }
  
  return headers;
};

// Types matching API spec
export interface SharingIntent {
  id: string;
  authorDid: string;
  content: {
    type: 'conversation' | 'acu' | 'collection' | 'annotation';
    ids: string[];
    scope?: 'full' | 'partial' | 'summary' | 'preview';
    includeACUs?: string[];
    excludeACUs?: string[];
  };
  audience: {
    type: 'public' | 'circle' | 'users' | 'link';
    circleIds?: string[];
    userDids?: string[];
  };
  permissions: {
    view: boolean;
    copy?: boolean;
    annotate?: boolean;
    remix?: boolean;
    share?: boolean;
    download?: boolean;
  };
  status: 'draft' | 'active' | 'expired' | 'revoked';
  schedule?: {
    publishAt?: string;
    expiresAt?: string;
  };
  transformations?: Record<string, boolean>;
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ShareLink {
  id: string;
  intentId: string;
  code: string;
  url: string;
  maxUses?: number;
  expiresAt?: string;
  uses: number;
  createdAt: string;
}

export interface ContentSummary {
  contentId: string;
  ownerDid: string;
  type: string;
  title?: string;
  description?: string;
  preview?: string;
  createdAt: string;
  audience: string;
}

export interface CircleShare {
  id: string;
  circleId: string;
  contentId: string;
  permissions: Record<string, boolean>;
  sharedAt: string;
  sharedBy: string;
}

export interface UserSharingMetrics {
  totalShares: number;
  activeShares: number;
  totalViews: number;
  totalCopies: number;
  reach: number;
}

export interface ContentSharingMetrics {
  views: number;
  copies: number;
  shares: number;
  uniqueViewers: number;
}

export interface NetworkStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  nodeCount: number;
  activeConnections: number;
  contentCount: number;
  latency: {
    avg: number;
    p50: number;
    p99: number;
  };
}

export interface ProviderInfo {
  id: string;
  name: string;
  location: string;
  reliability: number;
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

interface ApiError {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================
// Sharing Intent API
// ============================================

export async function createIntent(intent: {
  content: SharingIntent['content'];
  audience: SharingIntent['audience'];
  permissions: SharingIntent['permissions'];
  schedule?: SharingIntent['schedule'];
  transformations?: SharingIntent['transformations'];
  metadata?: SharingIntent['metadata'];
}): Promise<SharingIntent> {
  const response = await fetch(`${getBaseUrl()}/sharing/intents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(intent),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<SharingIntent> = await response.json();
  return result.data;
}

export async function getIntent(intentId: string): Promise<SharingIntent> {
  const response = await fetch(`${getBaseUrl()}/sharing/intents/${intentId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<SharingIntent> = await response.json();
  return result.data;
}

export async function updateIntent(
  intentId: string,
  updates: Partial<{
    audience: SharingIntent['audience'];
    permissions: SharingIntent['permissions'];
    schedule: SharingIntent['schedule'];
    metadata: SharingIntent['metadata'];
  }>
): Promise<SharingIntent> {
  const response = await fetch(`${getBaseUrl()}/sharing/intents/${intentId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<SharingIntent> = await response.json();
  return result.data;
}

export async function listIntents(params?: {
  status?: string;
  contentType?: string;
  audienceType?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ intents: SharingIntent[]; pagination: ApiResponse<never>['meta']['pagination'] }> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.contentType) searchParams.set('contentType', params.contentType);
  if (params?.audienceType) searchParams.set('audienceType', params.audienceType);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  
  const response = await fetch(`${getBaseUrl()}/sharing/intents?${searchParams}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<SharingIntent[]> = await response.json();
  return {
    intents: result.data,
    pagination: result.meta?.pagination,
  };
}

export async function publishIntent(intentId: string): Promise<{
  success: boolean;
  contentId: string;
  distribution: { providers: string[]; replicas: number };
  publishedAt: string;
}> {
  const response = await fetch(`${getBaseUrl()}/sharing/intents/${intentId}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  return response.json();
}

export async function revokeIntent(
  intentId: string,
  reason?: string,
  notifyRecipients?: boolean
): Promise<{ success: boolean }> {
  const response = await fetch(`${getBaseUrl()}/sharing/intents/${intentId}/revoke`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason, notifyRecipients }),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  return response.json();
}

// ============================================
// Share Links API
// ============================================

export async function createShareLink(intentId: string, options?: {
  maxUses?: number;
  expiresAt?: string;
  password?: string;
}): Promise<ShareLink> {
  const response = await fetch(`${getBaseUrl()}/sharing/links`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ intentId, ...options }),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<ShareLink> = await response.json();
  return result.data;
}

export async function getShareLink(linkCode: string): Promise<{
  content: {
    contentId: string;
    preview: Record<string, unknown>;
    permissions: Record<string, boolean>;
  };
  requiresPassword: boolean;
}> {
  const response = await fetch(`${getBaseUrl()}/sharing/links/${linkCode}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<never> = await response.json();
  return result.data as never;
}

export async function accessShareLink(linkCode: string, password: string): Promise<{
  content: Record<string, unknown>;
}> {
  const response = await fetch(`${getBaseUrl()}/sharing/links/${linkCode}/access`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ password }),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  return response.json();
}

// ============================================
// Content API
// ============================================

export async function getContent(contentId: string): Promise<{
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  permissions: Record<string, unknown>;
}> {
  const response = await fetch(`${getBaseUrl()}/content/${contentId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<never> = await response.json();
  return result.data as never;
}

export async function queryContent(params?: {
  q?: string;
  ownerDid?: string;
  contentType?: string;
  tags?: string;
  audience?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ results: ContentSummary[]; pagination: ApiResponse<never>['meta']['pagination'] }> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.ownerDid) searchParams.set('ownerDid', params.ownerDid);
  if (params?.contentType) searchParams.set('contentType', params.contentType);
  if (params?.tags) searchParams.set('tags', params.tags);
  if (params?.audience) searchParams.set('audience', params.audience);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  
  const response = await fetch(`${getBaseUrl()}/content?${searchParams}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<ContentSummary[]> = await response.json();
  return {
    results: result.data,
    pagination: result.meta?.pagination,
  };
}

// ============================================
// Circle API
// ============================================

export async function shareToCircle(
  circleId: string,
  contentId: string,
  permissions: { view: boolean; annotate?: boolean; copy?: boolean; share?: boolean },
  notifyMembers?: boolean
): Promise<CircleShare> {
  const response = await fetch(`${getBaseUrl()}/circles/${circleId}/shares`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ contentId, permissions, notifyMembers }),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<CircleShare> = await response.json();
  return result.data;
}

export async function getCircleShares(circleId: string): Promise<{
  shares: CircleShare[];
  stats: { totalShares: number; totalViews: number; activeMembers: number };
}> {
  const response = await fetch(`${getBaseUrl()}/circles/${circleId}/shares`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<never> = await response.json();
  return result.data as never;
}

// ============================================
// Analytics API
// ============================================

export async function getUserAnalytics(userDid: string): Promise<{
  metrics: UserSharingMetrics;
  trends: unknown[];
  topContent: unknown[];
}> {
  const response = await fetch(`${getBaseUrl()}/analytics/user/${userDid}/sharing`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<never> = await response.json();
  return result.data as never;
}

export async function getContentAnalytics(contentId: string): Promise<{
  metrics: ContentSharingMetrics;
  reach: unknown;
  timeline: unknown;
  viewers: unknown[];
}> {
  const response = await fetch(`${getBaseUrl()}/analytics/content/${contentId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<never> = await response.json();
  return result.data as never;
}

export async function getActivityLog(params?: {
  startDate?: string;
  endDate?: string;
  eventTypes?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ events: unknown[]; pagination: ApiResponse<never>['meta']['pagination'] }> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  if (params?.eventTypes) searchParams.set('eventTypes', params.eventTypes);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  
  const response = await fetch(`${getBaseUrl()}/analytics/activity?${searchParams}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<unknown[]> = await response.json();
  return {
    events: result.data,
    pagination: result.meta?.pagination,
  };
}

// ============================================
// Network API
// ============================================

export async function getNetworkStatus(): Promise<NetworkStatus> {
  const response = await fetch(`${getBaseUrl()}/network/status`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<NetworkStatus> = await = await response.json response.json();
  return result.data;
}

export async function getContentProviders(contentId: string): Promise<{
  contentId: string;
  providers: ProviderInfo[];
  replicaCount: number;
  availability: 'high' | 'medium' | 'low';
}> {
  const response = await fetch(`${getBaseUrl()}/network/content/${contentId}/providers`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<never> = await response.json();
  return result.data as never;
}

export async function requestContent(contentId: string): Promise<{
  requestId: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  estimatedTime?: number;
}> {
  const response = await fetch(`${getBaseUrl()}/network/content/${contentId}/request`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  return response.json();
}

// ============================================
// Permissions API
// ============================================

export async function checkPermission(
  contentId: string,
  userDid: string,
  permission: string
): Promise<{
  allowed: boolean;
  permission: Record<string, unknown>;
  expiresAt?: string;
  reason?: string;
}> {
  const searchParams = new URLSearchParams({ userDid, permission });
  const response = await fetch(`${getBaseUrl()}/permissions/${contentId}/check?${searchParams}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<never> = await response.json();
  return result.data as never;
}

export async function getEffectivePermissions(
  contentId: string,
  userDid: string
): Promise<Record<string, unknown>> {
  const searchParams = new URLSearchParams({ userDid });
  const response = await fetch(`${getBaseUrl()}/permissions/${contentId}/effective?${searchParams}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
  
  const result: ApiResponse<Record<string, unknown>> = await response.json();
  return result.data;
}
