import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Intelligently extract URLs from any text input (CSV, whitespace, lines, etc.)
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  
  // Regex for standard URLs
  const urlRegex = /https?:\/\/[^\s,;"']+/g;
  const matches = text.match(urlRegex) || [];
  
  // Cleanup matches (remove trailing punctuation that might be caught)
  return Array.from(new Set(matches.map(url => {
    // Remove trailing dots, commas, parens often included in regex matches from text
    return url.replace(/[.,;)]+$/, '');
  })));
}