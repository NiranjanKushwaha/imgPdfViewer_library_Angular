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
      // For URLs without extension, we'll detect based on content-type
      // This will be handled by the async detection in the component
      return 'unknown';
  }
}

/**
 * Detect document type from content-type header
 */
export function detectDocumentTypeFromContentType(contentType: string): DocumentType {
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
async function detectDocumentTypeBySignature(url: string): Promise<DocumentType> {
  try {
    const proxiedUrl = await tryLoadWithProxy(url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(proxiedUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Range': 'bytes=0-1023' // Only fetch first 1KB
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Check for PDF signature (%PDF)
      if (uint8Array.length >= 4 && 
          uint8Array[0] === 0x25 && // %
          uint8Array[1] === 0x50 && // P
          uint8Array[2] === 0x44 && // D
          uint8Array[3] === 0x46) { // F
        console.log('✅ Detected PDF by signature');
        return 'pdf';
      }
      
      // Check for image signatures
      if (uint8Array.length >= 8) {
        // JPEG signature: FF D8 FF
        if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
          console.log('✅ Detected JPEG by signature');
          return 'image';
        }
        
        // PNG signature: 89 50 4E 47 0D 0A 1A 0A
        if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && 
            uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
          console.log('✅ Detected PNG by signature');
          return 'image';
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Signature detection failed:', error);
  }
  
  return 'unknown';
}

/**
 * Async document type detection using content-type header
 */
export async function detectDocumentTypeAsync(url: string): Promise<DocumentType> {
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
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const detectedType = detectDocumentTypeFromContentType(contentType || '');
      
      if (detectedType !== 'unknown') {
        console.log(`✅ Detected document type from content-type (direct): ${detectedType} (${contentType})`);
        return detectedType;
      }
    }
  } catch (error) {
    console.log('⚠️ Direct content-type detection failed, trying proxy:', error);
  }
  
  // If direct access fails due to CORS, try with proxy
  try {
    const proxiedUrl = await tryLoadWithProxy(url);
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
        const detectedType = detectDocumentTypeFromContentType(contentType || '');
        
        if (detectedType !== 'unknown') {
          console.log(`✅ Detected document type from content-type (proxy): ${detectedType} (${contentType})`);
          return detectedType;
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Proxy content-type detection also failed:', error);
  }
  
  // Final fallback: try to detect by file signature using proxy
  const signatureType = await detectDocumentTypeBySignature(url);
  if (signatureType !== 'unknown') {
    return signatureType;
  }
  
  return 'unknown';
}

/**
 * Extract file extension from URL
 */
export function getFileExtension(url: string): string {
  const cleanUrl = url.split('?')[0]; // Remove query parameters
  const parts = cleanUrl.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
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
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    new URL(url, base);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create download link for a document
 */
export function downloadDocument(url: string, filename?: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || getFileName(url);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
export async function tryLoadWithProxy(url: string): Promise<string> {
  // Skip for data URLs or internal URLs
  if (url.startsWith('data:') || !isExternalUrl(url)) {
    return url;
  }

  // For images, try direct access first without CORS mode
  const documentType = detectDocumentType(url);
  if (documentType === 'image') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        // Don't use CORS mode for images - they usually work without it
      });

      clearTimeout(timeoutId);
      if (response.ok) {
        console.log('✅ Direct image access successful:', url);
        return url;
      }
    } catch (e) {
      console.log('⚠️ Direct image access failed, trying CORS mode:', e);
    }
  }

  // Try direct URL with CORS mode first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors',
    });

    clearTimeout(timeoutId);
    if (response.ok) {
      console.log('✅ Direct URL access successful:', url);
      return url;
    }
  } catch (e) {
    console.log('⚠️ Direct URL access failed, trying proxies:', e);
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
        console.log(`✅ Proxy ${i + 1} successful:`, proxiedUrl);
        return proxiedUrl;
      }
    } catch (e) {
      console.log(`❌ Proxy ${i + 1} failed:`, e);
      // Try next proxy
      continue;
    }
  }

  console.log('❌ All proxies failed, returning original URL');
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
    console.error('Failed to convert data URL to blob URL:', error);
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
