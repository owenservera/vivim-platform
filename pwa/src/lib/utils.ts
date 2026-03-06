import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract URLs from text input
 * Handles:
 * - Single URLs
 * - Multiple URLs separated by whitespace or newlines
 * - Comma-separated URLs
 */
export function extractUrls(input: string): string[] {
  if (!input || typeof input !== 'string') {
    return [];
  }

  // Split by whitespace, newlines, or commas
  const candidates = input.split(/[\s\n,]+/).filter(Boolean);
  
  // Validate and clean each URL
  const urls: string[] = [];
  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (trimmed && isValidUrl(trimmed)) {
      urls.push(trimmed);
    }
  }
  
  return urls;
}

/**
 * Validate if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    // Add protocol if missing
    let urlToTest = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlToTest = `https://${url}`;
    }
    
    new URL(urlToTest);
    return true;
  } catch {
    return false;
  }
}
