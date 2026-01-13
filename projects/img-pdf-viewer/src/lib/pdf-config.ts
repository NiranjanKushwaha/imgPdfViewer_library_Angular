import * as pdfjsLib from 'pdfjs-dist';

// Extend Promise interface for withResolvers polyfill
declare global {
  interface PromiseConstructor {
    withResolvers?<T>(): {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => void;
      reject: (reason?: any) => void;
    };
  }
}

// Polyfill for Promise.withResolvers (needed for older browsers)
if (typeof window !== 'undefined' && !Promise.withResolvers) {
  (Promise as any).withResolvers = function <T>() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  };
}

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  // Use CDN for worker in browser - updated for v5+
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

// Default options for PDF documents
export const defaultPdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
  disableAutoFetch: false,
  disableStream: false,
  disableFontFace: false,
  isEvalSupported: true,
  withCredentials: false,
  enableXfa: false,
  useSystemFonts: false,
  maxImageSize: 1024 * 1024, // 1MB
  disableRange: false,
  disableCreateObjectURL: false,
  disableWebGL: false,
  disableWorker: false,
  disableOffscreenCanvas: false,
  disableIsRemotePdfFile: false,
};

export { pdfjsLib };
