import { Injectable } from '@angular/core';
import { DocumentType } from './types';
import {
  downloadDocument,
  getFileName,
  detectDocumentType,
  isValidUrl,
  createBlobFromDataUrl,
  revokeBlobUrl,
} from './utils';

@Injectable({
  providedIn: 'root',
})
export class ImgPdfViewerService {
  constructor() {}

  /**
   * Download a blob URL
   */
  downloadBlob(blob: string, fileName: string): void {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = blob;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Download a resource from URL
   */
  async downloadResource(url: string, fileName: string = ''): Promise<void> {
    if (!url) {
      return;
    }

    if (!fileName) {
      fileName = this.getFileName(url);
    }

    // Use the utility function for better error handling
    await downloadDocument(url, fileName);
  }

  /**
   * Get file name from URL
   */
  getFileName(url: string): string {
    return getFileName(url);
  }

  /**
   * Check file type from URL or filename
   */
  fileTypeChecker(file: string): DocumentType {
    if (!file) {
      return 'unknown';
    }

    const extension = file.split('.').pop()?.toLowerCase();
    if (!extension) {
      return 'unknown';
    }

    const imageExtensions = [
      'png',
      'jpeg',
      'jpg',
      'gif',
      'webp',
      'svg',
      'bmp',
      'tiff',
      'ico',
      'apng',
    ];

    if (extension === 'pdf') {
      return 'pdf';
    } else if (imageExtensions.includes(extension)) {
      return 'image';
    } else {
      return 'unknown';
    }
  }

  /**
   * Open blob in new window
   */
  openBlobInNewWindow(url: string): void {
    if (!url) {
      return;
    }

    // For data URLs, convert to blob URL first
    if (url.startsWith('data:')) {
      const blobUrl = createBlobFromDataUrl(url);
      if (blobUrl) {
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
        // Clean up blob URL after a delay
        setTimeout(() => revokeBlobUrl(blobUrl), 1000);
        return;
      }
    }

    // For regular URLs, try to fetch and create blob
    fetch(url, {
      headers: new Headers({
        Origin: location.origin,
      }),
      mode: 'cors',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
        // Clean up blob URL after a delay
        setTimeout(() => revokeBlobUrl(blobUrl), 1000);
      })
      .catch((error) => {
        // Fallback: try to open the original URL
        window.open(url, '_blank', 'noopener,noreferrer');
      });
  }

  /**
   * Validate URL
   */
  isValidUrl(url: string): boolean {
    return isValidUrl(url);
  }

  /**
   * Detect document type
   */
  detectDocumentType(url: string): DocumentType {
    return detectDocumentType(url);
  }

  /**
   * Get file size from URL (if accessible)
   */
  async getFileSize(url: string): Promise<number | null> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get MIME type from URL
   */
  async getMimeType(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.headers.get('content-type');
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if URL is accessible
   */
  async isUrlAccessible(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
