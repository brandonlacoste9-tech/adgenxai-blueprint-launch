import type { HistoryEntry } from "./history";
import JSZip from "jszip";

export type ExportFormat = "txt" | "md" | "json" | "html";

/**
 * Sanitize filename by removing invalid characters and handling Unicode
 */
export const sanitizeFilename = (filename: string): string => {
  // Replace invalid characters with underscore
  // Keep: letters, numbers, spaces, hyphens, underscores, periods
  const sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-_.]/g, "");
  
  // Limit length to 255 characters (common filesystem limit)
  return sanitized.substring(0, 255);
};

/**
 * Generate consistent filename format: content-{YYYY-MM-DD-HHmmss}-{index}.{ext}
 */
export const generateFilename = (
  timestamp: number,
  format: ExportFormat,
  index?: number
): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  const dateStr = `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
  const suffix = index !== undefined ? `-${index}` : "";
  
  const extensions: Record<ExportFormat, string> = {
    txt: "txt",
    md: "md",
    json: "json",
    html: "html",
  };
  
  return sanitizeFilename(`content-${dateStr}${suffix}.${extensions[format]}`);
};

/**
 * Strip HTML tags from content
 */
const stripHtmlTags = (html: string): string => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

/**
 * Format metadata header for plain text
 */
const formatPlainTextMetadata = (entry: HistoryEntry): string => {
  const date = new Date(entry.timestamp).toLocaleString();
  return `Generated: ${date}
Language: ${entry.language === "en" ? "English" : "Français"}
Format: ${entry.format === "longcat" ? "LongCat" : "Emu"}
Style: ${entry.style}
Tone: ${entry.tone}
Characters: ${entry.characterCount}
Words: ${entry.wordCount}

`;
};

/**
 * Export entry as Plain Text
 */
export const exportAsPlainText = (entry: HistoryEntry): string => {
  const metadata = formatPlainTextMetadata(entry);
  const content = stripHtmlTags(entry.content);
  const prompt = `Prompt: ${entry.prompt}\n\n`;
  
  return `${metadata}${prompt}Content:\n${content}\n`;
};

/**
 * Export entry as Markdown
 */
export const exportAsMarkdown = (entry: HistoryEntry): string => {
  const date = new Date(entry.timestamp).toISOString();
  const frontMatter = `---
generated: ${date}
language: ${entry.language}
format: ${entry.format}
style: ${entry.style}
tone: ${entry.tone}
characters: ${entry.characterCount}
words: ${entry.wordCount}
---

`;

  const content = entry.content
    .replace(/```/g, "\\`\\`\\`") // Escape code blocks in content
    .split("\n")
    .map((line) => {
      // Preserve formatting
      if (line.trim().startsWith("#")) return line; // Headers
      if (line.trim().startsWith("-") || line.trim().startsWith("*")) return line; // Lists
      return line;
    })
    .join("\n");

  const prompt = `## Prompt\n\n${entry.prompt}\n\n`;
  const contentSection = `## Content\n\n${content}\n`;

  return `${frontMatter}${prompt}${contentSection}`;
};

/**
 * Export entry as JSON
 */
export const exportAsJSON = (entry: HistoryEntry): string => {
  const jsonData = {
    id: entry.id,
    timestamp: entry.timestamp,
    generated: new Date(entry.timestamp).toISOString(),
    prompt: entry.prompt,
    content: entry.content,
    language: entry.language,
    style: entry.style,
    tone: entry.tone,
    format: entry.format,
    characterCount: entry.characterCount,
    wordCount: entry.wordCount,
  };
  
  return JSON.stringify(jsonData, null, 2);
};

/**
 * Export entry as HTML
 */
export const exportAsHTML = (entry: HistoryEntry): string => {
  const date = new Date(entry.timestamp).toLocaleString();
  const content = entry.content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html lang="${entry.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Export - ${date}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #0a0f1a 0%, #1a1a2e 100%);
      color: #e0e0e0;
      padding: 2rem;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #67e5a1, #8beeff, #ffcaff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 1rem;
      font-size: 0.875rem;
    }
    .metadata-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-en {
      background: rgba(59, 130, 246, 0.2);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .badge-fr {
      background: rgba(147, 51, 234, 0.2);
      color: #c4b5fd;
      border: 1px solid rgba(147, 51, 234, 0.3);
    }
    .badge-longcat {
      background: rgba(20, 184, 166, 0.2);
      color: #5eead4;
      border: 1px solid rgba(20, 184, 166, 0.3);
    }
    .badge-emu {
      background: rgba(244, 114, 182, 0.2);
      color: #f9a8d4;
      border: 1px solid rgba(244, 114, 182, 0.3);
    }
    section {
      margin-top: 2rem;
    }
    h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      color: #67e5a1;
    }
    .content-box {
      background: rgba(0, 0, 0, 0.2);
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .prompt-box {
      background: rgba(59, 130, 246, 0.1);
      border-left: 3px solid rgba(59, 130, 246, 0.5);
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      font-style: italic;
    }
    @media (max-width: 640px) {
      body {
        padding: 1rem;
      }
      .container {
        padding: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Content Export</h1>
      <div class="metadata">
        <div class="metadata-item">
          <span class="badge badge-${entry.language}">${entry.language === "en" ? "English" : "Français"}</span>
        </div>
        <div class="metadata-item">
          <span class="badge badge-${entry.format}">${entry.format === "longcat" ? "LongCat" : "Emu"}</span>
        </div>
        <div class="metadata-item">
          <strong>Style:</strong> ${entry.style}
        </div>
        <div class="metadata-item">
          <strong>Tone:</strong> ${entry.tone}
        </div>
        <div class="metadata-item">
          <strong>Generated:</strong> ${date}
        </div>
        <div class="metadata-item">
          <strong>Characters:</strong> ${entry.characterCount} | <strong>Words:</strong> ${entry.wordCount}
        </div>
      </div>
    </header>
    
    <section>
      <h2>Prompt</h2>
      <div class="prompt-box">${entry.prompt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </section>
    
    <section>
      <h2>Generated Content</h2>
      <div class="content-box">${content}</div>
    </section>
  </div>
</body>
</html>`;
};

/**
 * Download file using Blob API
 */
export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string,
  addBOM = false
): void => {
  try {
    // Add UTF-8 BOM if requested (for text files)
    const bom = addBOM ? "\uFEFF" : "";
    const blobContent = bom + content;
    
    // Create Blob with appropriate MIME type
    const blob = new Blob([blobContent], { type: mimeType });
    
    // Create temporary URL
    const url = URL.createObjectURL(blob);
    
    // Create temporary anchor element
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL after a delay to ensure download started
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("Error downloading file:", error);
    throw new Error("Failed to download file. Please try again.");
  }
};

/**
 * Export single entry
 */
export const exportEntry = (
  entry: HistoryEntry,
  format: ExportFormat
): void => {
  let content: string;
  let mimeType: string;
  let addBOM = false;
  
  switch (format) {
    case "txt":
      content = exportAsPlainText(entry);
      mimeType = "text/plain;charset=utf-8";
      addBOM = true;
      break;
    case "md":
      content = exportAsMarkdown(entry);
      mimeType = "text/markdown;charset=utf-8";
      addBOM = true;
      break;
    case "json":
      content = exportAsJSON(entry);
      mimeType = "application/json;charset=utf-8";
      break;
    case "html":
      content = exportAsHTML(entry);
      mimeType = "text/html;charset=utf-8";
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  const filename = generateFilename(entry.timestamp, format);
  downloadFile(content, filename, mimeType, addBOM);
};

/**
 * Combine multiple entries into a single file
 */
export const exportMultipleAsSingle = (
  entries: HistoryEntry[],
  format: ExportFormat
): string => {
  switch (format) {
    case "txt":
      return entries
        .map((entry, index) => {
          const separator = `\n${"=".repeat(80)}\nEntry ${index + 1} of ${entries.length}\n${"=".repeat(80)}\n\n`;
          return separator + exportAsPlainText(entry);
        })
        .join("\n");
    
    case "md":
      return entries
        .map((entry, index) => {
          const separator = `\n\n---\n\n## Entry ${index + 1} of ${entries.length}\n\n`;
          return separator + exportAsMarkdown(entry);
        })
        .join("\n");
    
    case "json":
      return JSON.stringify(entries, null, 2);
    
    case "html":
      // Combine HTML exports with separators
      const htmlEntries = entries.map((entry) => {
        const htmlContent = exportAsHTML(entry);
        // Extract body content from each HTML
        const bodyMatch = htmlContent.match(/<body>([\s\S]*)<\/body>/);
        return bodyMatch ? bodyMatch[1] : "";
      });
      
      // Create combined HTML document
      const combinedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Batch Export - ${entries.length} entries</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0f1a 0%, #1a1a2e 100%);
      color: #e0e0e0;
      padding: 2rem;
    }
    .entry-separator {
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(103, 229, 161, 0.5), transparent);
      margin: 3rem 0;
    }
  </style>
</head>
<body>
  ${htmlEntries.map((html) => html).join('<div class="entry-separator"></div>')}
</body>
</html>`;
      return combinedHTML;
    
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

/**
 * Generate export manifest for batch exports
 */
export const generateExportManifest = (
  entries: HistoryEntry[],
  format: ExportFormat
): string => {
  const manifest = {
    exportDate: new Date().toISOString(),
    format,
    totalEntries: entries.length,
    version: "1.0",
    entries: entries.map((entry) => ({
      id: entry.id,
      filename: generateFilename(entry.timestamp, format),
      timestamp: entry.timestamp,
      generated: new Date(entry.timestamp).toISOString(),
      language: entry.language,
      format: entry.format,
    })),
  };
  
  return JSON.stringify(manifest, null, 2);
};

/**
 * Export multiple entries as zip archive
 */
export const exportMultipleAsZip = async (
  entries: HistoryEntry[],
  format: ExportFormat,
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  try {
    const zip = new JSZip();
    
    // Add each entry as a separate file
    entries.forEach((entry, index) => {
      let content: string;
      
      switch (format) {
        case "txt":
          content = exportAsPlainText(entry);
          break;
        case "md":
          content = exportAsMarkdown(entry);
          break;
        case "json":
          content = exportAsJSON(entry);
          break;
        case "html":
          content = exportAsHTML(entry);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      const filename = generateFilename(entry.timestamp, format, index);
      
      // Add UTF-8 BOM for text files
      if (format === "txt" || format === "md") {
        content = "\uFEFF" + content;
      }
      
      zip.file(filename, content);
      
      if (onProgress) {
        onProgress(index + 1, entries.length);
      }
    });
    
    // Add manifest.json
    const manifest = generateExportManifest(entries, format);
    zip.file("manifest.json", manifest);
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    
    // Generate filename for zip
    const timestamp = Date.now();
    const date = new Date(timestamp);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}-${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;
    const zipFilename = sanitizeFilename(`kolony-export-${dateStr}.zip`);
    
    // Download zip file
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = zipFilename;
    link.style.display = "none";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("Error creating zip archive:", error);
    throw new Error("Failed to create zip archive. Please try again.");
  }
};

/**
 * Copy content to clipboard with format
 */
export const copyAsFormat = async (
  content: string,
  format: "plain" | "markdown" | "html"
): Promise<void> => {
  let formattedContent: string;
  
  switch (format) {
    case "plain":
      formattedContent = stripHtmlTags(content);
      break;
    case "markdown":
      // Convert HTML to markdown if needed, otherwise return as-is
      formattedContent = content;
      break;
    case "html":
      formattedContent = content;
      break;
    default:
      formattedContent = content;
  }
  
  try {
    await navigator.clipboard.writeText(formattedContent);
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    throw new Error("Failed to copy to clipboard. Please try again.");
  }
};

/**
 * Estimate file size for export
 */
export const estimateFileSize = (
  entries: HistoryEntry[],
  format: ExportFormat,
  asZip: boolean
): number => {
  // Rough estimation in bytes
  let totalSize = 0;
  
  entries.forEach((entry) => {
    // Base size includes content and metadata
    let entrySize = entry.content.length + entry.prompt.length + 500; // metadata overhead
    
    // Format-specific multipliers
    switch (format) {
      case "html":
        entrySize *= 2.5; // HTML markup adds overhead
        break;
      case "md":
        entrySize *= 1.2; // Markdown formatting
        break;
      case "json":
        entrySize *= 1.5; // JSON structure
        break;
      case "txt":
        entrySize *= 1.1; // Plain text with metadata
        break;
    }
    
    totalSize += entrySize;
  });
  
  // Zip compression reduces size by ~30-50%
  if (asZip) {
    totalSize = Math.floor(totalSize * 0.6); // Rough estimate
    totalSize += entries.length * 100; // Per-file overhead in zip
    totalSize += 5000; // Manifest and zip structure
  }
  
  return totalSize;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
