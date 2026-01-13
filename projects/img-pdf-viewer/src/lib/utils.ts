import { DocumentType, DocumentInfo } from './types';

/**
 * Detect document type from URL or file extension
 */
export function detectDocumentType(url: string): DocumentType {
  const extension = getFileExtension(url);

  switch (extension.toLowerCase()) {
    case 'pdf':
      return 'pdf';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
    case 'bmp':
    case 'tiff':
    case 'ico':
      return 'image';
    default:
      // Industrial Heuristics: Look for markers anywhere in the path
      if (!url) return 'unknown';
      const lowerUrl = url.toLowerCase().split('?')[0];

      // PDF markers (very likely to be a PDF)
      const isLikelyPdf =
        lowerUrl.includes('/pdf') ||
        lowerUrl.includes('pdf/') ||
        lowerUrl.includes('=pdf') ||
        lowerUrl.includes('format=pdf') ||
        lowerUrl.includes('document/pdf');

      if (isLikelyPdf) return 'pdf';

      // Image markers (likely to be an image)
      const isLikelyImage =
        lowerUrl.includes('/image') ||
        lowerUrl.includes('/img') ||
        lowerUrl.includes('images/') ||
        lowerUrl.includes('format=jpg') ||
        lowerUrl.includes('format=png');

      if (isLikelyImage) return 'image';

      return 'unknown';
  }
}

/**
 * Detect document type from content-type header
 */
export function detectDocumentTypeFromContentType(
  contentType: string
): DocumentType {
  if (!contentType) return 'unknown';

  const type = contentType.toLowerCase();

  if (type.includes('application/pdf')) {
    return 'pdf';
  }

  if (type.includes('image/')) {
    return 'image';
  }

  return 'unknown';
}

/**
 * Detect document type by file signature using proxy
 */
async function detectDocumentTypeBySignature(
  url: string,
  proxyUrl?: string
): Promise<DocumentType> {
  try {
    const proxiedUrl = await tryLoadWithProxy(url, proxyUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(proxiedUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Range: 'bytes=0-1023', // Only fetch first 1KB
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Check for PDF signature (%PDF)
      if (
        uint8Array.length >= 4 &&
        uint8Array[0] === 0x25 && // %
        uint8Array[1] === 0x50 && // P
        uint8Array[2] === 0x44 && // D
        uint8Array[3] === 0x46
      ) {
        // F
        return 'pdf';
      }

      // Check for image signatures
      if (uint8Array.length >= 8) {
        // JPEG signature: FF D8 FF
        if (
          uint8Array[0] === 0xff &&
          uint8Array[1] === 0xd8 &&
          uint8Array[2] === 0xff
        ) {
          return 'image';
        }

        // PNG signature: 89 50 4E 47 0D 0A 1A 0A
        if (
          uint8Array[0] === 0x89 &&
          uint8Array[1] === 0x50 &&
          uint8Array[2] === 0x4e &&
          uint8Array[3] === 0x47
        ) {
          return 'image';
        }
      }
    }
  } catch (error) {
    // Signature detection failed
  }

  return 'unknown';
}

/**
 * Async document type detection using content-type header
 */
export async function detectDocumentTypeAsync(
  url: string,
  proxyUrl?: string
): Promise<DocumentType> {
  // First try extension-based detection
  const extensionType = detectDocumentType(url);
  if (extensionType !== 'unknown') {
    return extensionType;
  }

  // For URLs without extension, try to detect from content-type
  // First try direct access
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors',
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const detectedType = detectDocumentTypeFromContentType(contentType || '');

      if (detectedType !== 'unknown') {
        return detectedType;
      }
    }
  } catch (error) {
    // Direct content-type detection failed
  }

  // If direct access fails due to CORS, try with proxy
  try {
    const proxiedUrl = proxyUrl
      ? `${proxyUrl}${encodeURIComponent(url)}`
      : await tryLoadWithProxy(url);
    if (proxiedUrl !== url) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(proxiedUrl, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const detectedType = detectDocumentTypeFromContentType(
          contentType || ''
        );

        if (detectedType !== 'unknown') {
          return detectedType;
        }
      }
    }
  } catch (error) {
    // Proxy content-type detection failed
  }

  // Final fallback: try to detect by file signature using proxy
  const signatureType = await detectDocumentTypeBySignature(url, proxyUrl);
  if (signatureType !== 'unknown') {
    return signatureType;
  }

  return 'unknown';
}

/**
 * Extract file extension from URL (segment-aware and parameters-safe)
 */
export function getFileExtension(url: string): string {
  if (!url) return '';
  try {
    const urlWithoutParams = url.split('?')[0].split('#')[0];
    const parts = urlWithoutParams.split('/');
    const lastSegment = parts[parts.length - 1];
    const dotIndex = lastSegment.lastIndexOf('.');
    if (dotIndex > 0 && dotIndex < lastSegment.length - 1) {
      return lastSegment.substring(dotIndex + 1).toLowerCase();
    }
  } catch (e) {
    // Fallback to simple split if URL is weird
    const cleanUrl = url.split('?')[0];
    const pieces = cleanUrl.split('.');
    if (pieces.length > 1) return pieces[pieces.length - 1].toLowerCase();
  }
  return '';
}

/**
 * Extract filename from URL
 */
export function getFileName(url: string): string {
  const cleanUrl = url.split('?')[0];
  const parts = cleanUrl.split('/');
  return parts[parts.length - 1] || 'document';
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if document type supports pagination
 */
export function supportsPagination(type: DocumentType): boolean {
  return ['pdf'].includes(type);
}

/**
 * Check if document type supports zoom
 */
export function supportsZoom(type: DocumentType): boolean {
  return ['pdf', 'image'].includes(type);
}

/**
 * Check if document type supports rotation
 */
export function supportsRotation(type: DocumentType): boolean {
  return ['pdf', 'image'].includes(type);
}

/**
 * Check if URL string is valid
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  // Data URLs (e.g., base64 PDFs)
  if (url.startsWith('data:')) return true;

  // Blob/Object URLs
  if (url.startsWith('blob:')) return true;

  // Absolute http(s) URLs
  if (/^https?:\/\//i.test(url)) return true;

  // Root-relative or relative paths for assets served from public
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../'))
    return true;

  // As a last resort, try URL parsing with current origin if available
  try {
    const base =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost';
    new URL(url, base);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create download link for a document
 */
export async function downloadDocument(
  url: string,
  filename?: string
): Promise<void> {
  try {
    // For cross-origin URLs, fetch as blob first
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || getFileName(url);

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL after a delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
  } catch (error) {
    // Fallback: open in new tab if download fails
    window.open(url, '_blank');
  }
}

/**
 * Enter fullscreen mode
 */
export function enterFullscreen(element: HTMLElement): Promise<void> {
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  } else if ((element as any).webkitRequestFullscreen) {
    return (element as any).webkitRequestFullscreen();
  } else if ((element as any).msRequestFullscreen) {
    return (element as any).msRequestFullscreen();
  } else if ((element as any).mozRequestFullScreen) {
    return (element as any).mozRequestFullScreen();
  }
  return Promise.reject('Fullscreen not supported');
}

/**
 * Exit fullscreen mode
 */
export function exitFullscreen(): Promise<void> {
  if (document.exitFullscreen) {
    return document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    return (document as any).webkitExitFullscreen();
  } else if ((document as any).msExitFullscreen) {
    return (document as any).msExitFullscreen();
  } else if ((document as any).mozCancelFullScreen) {
    return (document as any).mozCancelFullScreen();
  }
  return Promise.reject('Exit fullscreen not supported');
}

/**
 * Check if currently in fullscreen mode
 */
export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).msFullscreenElement ||
    (document as any).mozFullScreenElement
  );
}

/**
 * Check if a URL is external (not from the same origin)
 */
export function isExternalUrl(url: string): boolean {
  // Skip data URLs
  if (url.startsWith('data:')) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const currentOrigin = window.location.origin;
    return urlObj.origin !== currentOrigin;
  } catch (e) {
    // If URL parsing fails, assume it's a relative URL (internal)
    return false;
  }
}

/**
 * Apply a CORS proxy to an external URL
 */
export function applyCorsProxy(url: string, proxyIndex = 0): string {
  const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',
    'https://thingproxy.freeboard.io/fetch/',
    'https://cors.bridged.cc/',
  ];

  // Skip for data URLs or internal URLs
  if (url.startsWith('data:') || !isExternalUrl(url)) {
    return url;
  }

  // Use a proxy service to bypass CORS
  const proxy = CORS_PROXIES[proxyIndex % CORS_PROXIES.length];
  return `${proxy}${encodeURIComponent(url)}`;
}

/**
 * Try loading a URL through different CORS proxies
 */
export async function tryLoadWithProxy(
  url: string,
  customProxyUrl?: string
): Promise<string> {
  // Skip for data URLs or internal URLs
  if (url.startsWith('data:') || !isExternalUrl(url)) {
    return url;
  }

  // Smart Proxy Strategy:
  // 1. Try direct URL with CORS mode first.
  // 2. If it works, we don't need a proxy (avoiding proxy bottlenecks).
  // 3. Only if direct fails, we use the user-provided proxy or public ones.
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Quick check

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors',
    });

    clearTimeout(timeoutId);
    if (response.ok) {
      return url; // Directly accessible!
    }
  } catch (e) {
    // Direct access failed, will proceed to proxy
  }

  // Use custom proxy if provided
  if (customProxyUrl) {
    return `${customProxyUrl}${encodeURIComponent(url)}`;
  }

  // For images, if custom proxy is NOT provided, we have one more trick:
  // Try direct access WITHOUT CORS (img tags often work fine where fetch fails)
  const documentType = detectDocumentType(url);
  if (documentType === 'image') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (response.ok) {
        return url;
      }
    } catch (e) {
      // Direct non-CORS access failed
    }
  }

  // Try each proxy with timeout
  const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',
    'https://thingproxy.freeboard.io/fetch/',
    'https://cors.bridged.cc/',
  ];

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxiedUrl = applyCorsProxy(url, i);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for proxies

      const response = await fetch(proxiedUrl, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors',
      });

      clearTimeout(timeoutId);
      if (response.ok) {
        return proxiedUrl;
      }
    } catch (e) {
      // Proxy failed
      continue;
    }
  }

  // If all proxies fail, return the original URL
  return url;
}

/**
 * Create a blob URL from a data URL
 */
export function createBlobFromDataUrl(dataUrl: string): string | null {
  try {
    const base64Data = dataUrl.split(',')[1];
    const binaryData = atob(base64Data);
    const array = new Uint8Array(binaryData.length);

    for (let i = 0; i < binaryData.length; i++) {
      array[i] = binaryData.charCodeAt(i);
    }

    const blob = new Blob([array], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch (error) {
    return null;
  }
}

/**
 * Revoke a blob URL to prevent memory leaks
 */
export function revokeBlobUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Get document info from URL
 */
export function getDocumentInfo(url: string, type: DocumentType): DocumentInfo {
  return {
    type,
    fileName: getFileName(url),
  };
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
