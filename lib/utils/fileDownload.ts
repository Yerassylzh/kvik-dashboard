/**
 * File download / open-in-browser helpers.
 *
 * `downloadFile` fetches the file as a blob (with credentials for
 * API-proxied media) and triggers a browser download to the user's
 * default Downloads folder. Falls back to opening the URL in a new tab
 * when blob fetching is impossible (CORS / storage-redirected files).
 */

function filenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    const lastSegment = parsed.pathname.split("/").filter(Boolean).pop();
    return lastSegment ? decodeURIComponent(lastSegment) : "attachment";
  } catch {
    return "attachment";
  }
}

function triggerBlobDownload(blob: Blob, url: string, filename?: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename || filenameFromUrl(url);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke asynchronously so Safari has time to start the download
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
}

export async function downloadFile(url: string, filename?: string): Promise<void> {
  try {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    triggerBlobDownload(blob, url, filename);
  } catch {
    // Fallback: let the browser handle it (downloads if the server
    // sends Content-Disposition, otherwise previews the file)
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/** Opens the file in a new browser tab (native preview for images, PDFs, video, audio). */
export function openFileInBrowser(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
