export interface DocumentViewerConfig {
  /** Whether to show the toolbar */
  showToolbar?: boolean;
  /** Whether to show download button */
  showDownload?: boolean;
  /** Whether to show zoom controls */
  showZoom?: boolean;
  /** Whether to show rotation controls */
  showRotation?: boolean;
  /** Whether to show fullscreen toggle */
  showFullscreen?: boolean;
  /** Whether to show "Open in New Tab" button */
  showInNewTab?: boolean;
  /** Whether to show page navigation for PDFs */
  showPagination?: boolean;
  /** Whether to show view mode toggle for PDFs */
  showViewModeToggle?: boolean;
  /** Custom class name for the viewer */
  className?: string;
  /** Custom height for the viewer */
  height?: string;
  /** Custom width for the viewer */
  width?: string;
  /** Whether the viewer is embedded (removes some controls) */
  embedded?: boolean;
  /** Initial zoom level (default: 100) */
  initialZoom?: number;
  /** Maximum zoom level (default: 300) */
  maxZoom?: number;
  /** Minimum zoom level (default: 50) */
  minZoom?: number;
  /** View mode for PDF documents */
  viewMode?: 'single' | 'continuous';
  /** Modal size for fullscreen */
  modalSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** Custom style for modal */
  customStyle?: string;
  /** Custom proxy URL to bypass CORS and help with type detection */
  proxyUrl?: string;
  /** Fallback document type if auto-detection fails */
  fallbackType?: DocumentType;
}

export type DocumentType = 'pdf' | 'image' | 'unknown';

export interface DocumentInfo {
  type: DocumentType;
  totalPages?: number;
  fileName?: string;
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface ViewerState {
  currentPage: number;
  totalPages: number;
  zoom: number;
  rotation: number;
  loading: boolean;
  error: string | null;
  fullscreen: boolean;
  documentInfo: DocumentInfo | null;
  viewMode: 'single' | 'continuous';
}

export interface DocumentViewerProps {
  /** URL of the document to display */
  documentUrl: string;
  /** Type of document (optional - will be auto-detected if not provided) */
  documentType?: DocumentType;
  /** Custom title for the document */
  title?: string;
  /** Configuration object */
  config?: DocumentViewerConfig;
  /** Callback when document fails to load */
  onError?: (error: string) => void;
  /** Callback when document loads successfully */
  onLoad?: (info: DocumentInfo) => void;
  /** Callback when zoom changes */
  onZoomChange?: (zoom: number) => void;
  /** Callback when rotation changes */
  onRotationChange?: (rotation: number) => void;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
}

export interface PDFPageInfo {
  pageNumber: number;
  scale: number;
  rotation: number;
  width: number;
  height: number;
}

export interface ImageInfo {
  naturalWidth: number;
  naturalHeight: number;
  src: string;
  alt: string;
}

export interface ToolbarAction {
  id: string;
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  tooltip?: string;
}

export interface CORSProxyConfig {
  enabled: boolean;
  proxies: string[];
  timeout: number;
  retryAttempts: number;
}

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
}
