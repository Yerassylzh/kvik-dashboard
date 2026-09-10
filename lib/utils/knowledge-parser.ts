import { KnowledgeEntry } from "@/types/niche";

/**
 * Formats byte size into human-readable Russian string (e.g. 1.5 МБ, 350 КБ).
 */
export function formatBytes(size?: number | null): string {
  if (!size) return "";
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

/**
 * Returns a suitable emoji icon for a given file name.
 */
export function getFileIcon(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "📕";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "📊";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "📘";
  return "📄";
}

/**
 * Extracts structured text/markdown from multiple possible data fields in KnowledgeEntry.
 */
export function extractStructuredText(entry: KnowledgeEntry): string | null {
  const d = (entry.data || {}) as Record<string, unknown>;
  const candidates = [
    d.structuredText,
    (entry as unknown as Record<string, unknown>).structuredText,
    d.content,
    d.text,
    d.rawText,
    d.description,
    d.note,
    d.markdown,
    d.summary,
  ];

  for (const val of candidates) {
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return null;
}

export interface ParsedServiceItem {
  name?: string;
  price?: string;
  duration?: string;
  category?: string;
}

/**
 * Extracts normalized services list array from a KnowledgeEntry payload.
 */
export function extractServicesList(
  entry: KnowledgeEntry
): ParsedServiceItem[] | null {
  const d = (entry.data || {}) as Record<string, unknown>;
  if (Array.isArray(d.services) && d.services.length > 0) return d.services as ParsedServiceItem[];
  if (Array.isArray(d.items) && d.items.length > 0) return d.items as ParsedServiceItem[];
  if (Array.isArray(d.priceList) && d.priceList.length > 0) return d.priceList as ParsedServiceItem[];
  return null;
}

/**
 * Cleans up raw titles from scraped sources (e.g. removing numeric 2GIS hashes, cleaning manual notes).
 */
export function cleanEntryTitle(
  entry: KnowledgeEntry,
  default2gisLabel: string,
  defaultNoteLabel: string,
  defaultWebsiteLabel: string
): string {
  if (entry.type === "MANUAL_NOTE") {
    const d = (entry.data || {}) as Record<string, unknown>;
    if (entry.title && entry.title.length < 50 && !entry.title.includes("\n")) return entry.title;
    if (typeof d.title === "string" && d.title.length < 50 && !d.title.includes("\n")) return d.title;
    return defaultNoteLabel;
  }

  if (entry.type === "WEBSITE_CONTENT") {
    if (entry.sourceUrl) {
      try {
        const hostname = new URL(entry.sourceUrl).hostname.replace(/^www\./, "");
        if (hostname) return `${defaultWebsiteLabel} (${hostname})`;
      } catch {
        // Fallback to default
      }
    }
    return defaultWebsiteLabel;
  }

  const data = (entry.data || {}) as Record<string, unknown>;
  const rawTitle =
    (typeof entry.title === "string" ? entry.title : "") ||
    (typeof data.name === "string" ? data.name : "") ||
    (typeof data.title === "string" ? data.title : "") ||
    (typeof data.fileName === "string" ? data.fileName : "") ||
    "";

  if (
    /^2GIS Catalog/i.test(rawTitle) ||
    /^2GIS Каталог/i.test(rawTitle) ||
    !rawTitle
  ) {
    if (
      typeof data.businessName === "string" &&
      !/^2GIS/i.test(data.businessName)
    ) {
      return data.businessName;
    }
    if (
      typeof data.name === "string" &&
      !/^2GIS/i.test(data.name)
    ) {
      return data.name;
    }
    return default2gisLabel;
  }

  return rawTitle.replace(/\s*\(\d{8,}\)$/, "").trim() || default2gisLabel;
}
