import type { LandingPageData } from "./landingPageGenerators";
import type { LandingPageTemplate } from "./landingPageTemplates";
import { saveHistoryEntry, getHistoryEntries, type HistoryEntry } from "./history";

const LANDING_PAGE_HISTORY_KEY = "landing_page_history";

export interface LandingPageHistoryEntry {
  id: string;
  timestamp: number;
  businessName: string;
  businessDescription: string;
  templateId: string;
  templateName: { en: string; fr: string };
  language: "en" | "fr" | "bilingual";
  landingPageData: LandingPageData;
  deployedUrl?: string;
  previewUrl?: string;
  deployedPlatform?: "github" | "vercel" | "netlify";
}

/**
 * Get all landing page history entries
 */
export const getLandingPageHistoryEntries = (): LandingPageHistoryEntry[] => {
  try {
    const stored = localStorage.getItem(LANDING_PAGE_HISTORY_KEY);
    if (!stored) return [];
    
    const entries: LandingPageHistoryEntry[] = JSON.parse(stored);
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error loading landing page history:", error);
    return [];
  }
};

/**
 * Save a landing page to history
 */
export const saveLandingPageHistory = (
  landingPageData: LandingPageData,
  template: LandingPageTemplate,
  deployedUrl?: string,
  deployedPlatform?: "github" | "vercel" | "netlify"
): void => {
  try {
    const entries = getLandingPageHistoryEntries();
    
    const newEntry: LandingPageHistoryEntry = {
      id: landingPageData.id,
      timestamp: landingPageData.metadata.createdAt,
      businessName: landingPageData.businessName,
      businessDescription: landingPageData.businessDescription,
      templateId: template.id,
      templateName: template.name,
      language: landingPageData.language,
      landingPageData,
      deployedUrl,
      deployedPlatform,
    };
    
    // Remove existing entry with same ID if exists
    const filteredEntries = entries.filter(e => e.id !== newEntry.id);
    filteredEntries.unshift(newEntry);
    
    // Limit to 50 entries
    const limitedEntries = filteredEntries.slice(0, 50);
    
    localStorage.setItem(LANDING_PAGE_HISTORY_KEY, JSON.stringify(limitedEntries));
    
    // Also save a simplified version to main history
    const contentPreview = Object.values(landingPageData.sections)
      .map(s => s.en.title || "")
      .filter(Boolean)
      .join(" | ");
    
    saveHistoryEntry(
      `Landing Page: ${landingPageData.businessName}`,
      contentPreview,
      landingPageData.language === "bilingual" ? "en" : landingPageData.language,
      "professional",
      "professional",
      "landing-page"
    );
  } catch (error) {
    console.error("Error saving landing page history:", error);
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      // Clear old entries and retry
      const entries = getLandingPageHistoryEntries().slice(0, 25);
      localStorage.setItem(LANDING_PAGE_HISTORY_KEY, JSON.stringify(entries));
      try {
        saveLandingPageHistory(landingPageData, template, deployedUrl, deployedPlatform);
      } catch (retryError) {
        console.error("Error saving landing page history after cleanup:", retryError);
      }
    }
  }
};

/**
 * Delete a landing page history entry
 */
export const deleteLandingPageHistory = (id: string): void => {
  try {
    const entries = getLandingPageHistoryEntries();
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem(LANDING_PAGE_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting landing page history:", error);
  }
};

/**
 * Update deployment URL for a landing page
 */
export const updateLandingPageDeployment = (
  id: string,
  deployedUrl: string,
  platform: "github" | "vercel" | "netlify"
): void => {
  try {
    const entries = getLandingPageHistoryEntries();
    const entry = entries.find(e => e.id === id);
    if (entry) {
      entry.deployedUrl = deployedUrl;
      entry.deployedPlatform = platform;
      localStorage.setItem(LANDING_PAGE_HISTORY_KEY, JSON.stringify(entries));
    }
  } catch (error) {
    console.error("Error updating landing page deployment:", error);
  }
};

/**
 * Clear all landing page history
 */
export const clearLandingPageHistory = (): void => {
  try {
    localStorage.removeItem(LANDING_PAGE_HISTORY_KEY);
  } catch (error) {
    console.error("Error clearing landing page history:", error);
  }
};
