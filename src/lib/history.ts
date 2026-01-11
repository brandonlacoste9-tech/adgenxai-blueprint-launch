export type ContentFormat = "longcat" | "emu" | "landing-page";

export interface HistoryEntry {
  id: string;
  timestamp: number; // Unix timestamp in milliseconds
  prompt: string;
  content: string;
  language: "en" | "fr";
  style: string;
  tone: string;
  format: ContentFormat;
  characterCount: number;
  wordCount: number;
  // Landing page specific fields
  landingPageData?: {
    businessName: string;
    templateId: string;
    deployedUrl?: string;
    previewUrl?: string;
  };
}

const HISTORY_STORAGE_KEY = "creator_studio_history";
const MAX_HISTORY_ENTRIES = 100;

/**
 * Get all history entries from localStorage
 */
export const getHistoryEntries = (): HistoryEntry[] => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    
    const entries: HistoryEntry[] = JSON.parse(stored);
    // Sort by timestamp descending (most recent first)
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error loading history:", error);
    return [];
  }
};

/**
 * Save a new history entry
 */
export const saveHistoryEntry = (
  prompt: string,
  content: string,
  language: "en" | "fr",
  style: string,
  tone: string,
  format: ContentFormat
): void => {
  try {
    const entries = getHistoryEntries();
    
    // Create new entry
    const newEntry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      prompt,
      content,
      language,
      style,
      tone,
      format,
      characterCount: content.length,
      wordCount: content.split(/\s+/).filter((word) => word.length > 0).length,
    };
    
    // Add new entry at the beginning
    entries.unshift(newEntry);
    
    // Limit to MAX_HISTORY_ENTRIES
    const limitedEntries = entries.slice(0, MAX_HISTORY_ENTRIES);
    
    // Save back to localStorage
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedEntries));
  } catch (error) {
    console.error("Error saving history:", error);
    // Handle quota exceeded error gracefully
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded. Clearing old entries and retrying...");
      // Keep only the 50 most recent entries
      const entries = getHistoryEntries().slice(0, 50);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
      
      // Retry saving
      try {
        const entries = getHistoryEntries();
        const newEntry: HistoryEntry = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          prompt,
          content,
          language,
          style,
          tone,
          format,
          characterCount: content.length,
          wordCount: content.split(/\s+/).filter((word) => word.length > 0).length,
        };
        entries.unshift(newEntry);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY_ENTRIES)));
      } catch (retryError) {
        console.error("Error saving history after quota cleanup:", retryError);
      }
    }
  }
};

/**
 * Delete a specific history entry by ID
 */
export const deleteHistoryEntry = (id: string): void => {
  try {
    const entries = getHistoryEntries();
    const filtered = entries.filter((entry) => entry.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting history entry:", error);
  }
};

/**
 * Clear all history entries
 */
export const clearAllHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing history:", error);
  }
};

/**
 * Filter history entries
 */
export const filterHistoryEntries = (
  entries: HistoryEntry[],
  filters: {
    language?: "en" | "fr";
    format?: ContentFormat;
    search?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
  }
): HistoryEntry[] => {
  let filtered = [...entries];

  // Filter by language
  if (filters.language) {
    filtered = filtered.filter((entry) => entry.language === filters.language);
  }

  // Filter by format
  if (filters.format) {
    filtered = filtered.filter((entry) => entry.format === filters.format);
  }

  // Filter by search term (searches in content and prompt)
  if (filters.search && filters.search.trim()) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (entry) =>
        entry.content.toLowerCase().includes(searchLower) ||
        entry.prompt.toLowerCase().includes(searchLower)
    );
  }

  // Filter by date range
  if (filters.dateRange) {
    filtered = filtered.filter((entry) => {
      const entryDate = new Date(entry.timestamp);
      return (
        entryDate >= filters.dateRange!.start &&
        entryDate <= filters.dateRange!.end
      );
    });
  }

  return filtered;
};

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  if (weeks < 4) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  return `${years} ${years === 1 ? "year" : "years"} ago`;
};

/**
 * Get history entry by ID
 */
export const getHistoryEntryById = (id: string): HistoryEntry | undefined => {
  const entries = getHistoryEntries();
  return entries.find((entry) => entry.id === id);
};
