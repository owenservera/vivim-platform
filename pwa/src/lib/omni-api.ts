// apps/pwa/src/lib/omni-api.ts

import type { TriggerType, SuggestionItem } from '../components/SuggestionMenu';

// Re-map icon strings from server to React components in the UI component
// For the API client, we just return the raw data

export interface OmniSearchResult {
  id: string;
  label: string;
  subLabel?: string;
  value: string;
  type: TriggerType;
  icon?: string; // server returns string name of icon
}

const getApiBaseUrl = () => {
  const override = typeof localStorage !== 'undefined' ? localStorage.getItem('OPENSCROLL_API_OVERRIDE') : null;
  const baseUrl = override || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  const root = baseUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${root}/api/v1`;
};

export async function searchOmni(trigger: TriggerType, query: string): Promise<OmniSearchResult[]> {
  const apiBaseUrl = getApiBaseUrl();
  
  // Clean query (remove the trigger char if present)
  const cleanQuery = query.startsWith(trigger) ? query.slice(1) : query;

  try {
    const response = await fetch(`${apiBaseUrl}/omni/search?trigger=${encodeURIComponent(trigger)}&query=${encodeURIComponent(cleanQuery)}`);
    
    if (!response.ok) {
      throw new Error(`Omni search failed: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    console.error('Omni search error:', error);
    return [];
  }
}
