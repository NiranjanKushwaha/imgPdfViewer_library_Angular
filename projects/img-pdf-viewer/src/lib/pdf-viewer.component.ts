import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { DocumentType, PDFPageInfo, ErrorInfo } from './types';
import { ErrorBoundaryService } from './error-boundary.service';
import { isExternalUrl, tryLoadWithProxy, createBlobFromDataUrl, revokeBlobUrl } from './utils';
import { defaultPdfOptions } from './pdf-config';

@Component({
  selector: 'ngx-pdf-viewer',
  template: `
    <div class="pdf-viewer-container" [class.fullscreen]="fullscreen" [style.height]="height" [style.width]="width">
      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">
          <p>Loading PDF...</p>
          <p *ngIf="totalPages > 0" class="page-info">Page {{ currentPage }} of {{ totalPages }}</p>
          <p class="renderer-info">Using PDF.js renderer</p>
          <p *ngIf="isExternal" class="proxy-info">Trying CORS proxies for external document...</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !loading" class="error-container">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <h3>Failed to Load PDF</h3>
          <p>{{ error }}</p>
          <div *ngIf="isCorsError" class="cors-tip">
            <strong>Tip:</strong> This PDF is hosted on a server that doesn't allow cross-origin access. 
            You can try opening it in a new tab or downloading it directly.
          </div>
          <div class="error-actions">
            <button (click)="retry()" class="btn btn-outline">Retry</button>
            <button (click)="openInNewTab()" class="btn btn-outline">Open in New Tab</button>
            <button (click)="download()" class="btn btn-outline">Download</button>
          </div>
        </div>
      </div>

      <!-- PDF Content -->
      <div *ngIf="!loading && !error" class="pdf-content" [class.continuous]="viewMode === 'continuous'">
        <!-- Single Page Mode -->
        <div *ngIf="viewMode === 'single'" class="single-page-container">
          <canvas
            #pdfCanvas
            class="pdf-canvas"
            [style.transform]="'rotate(' + rotation + 'deg)'"
            [style.transform-origin]="'center'"
          ></canvas>
        </div>

        <!-- Continuous Mode -->
        <div *ngIf="viewMode === 'continuous'" class="continuous-pages">
          <div
            *ngFor="let page of pages; let i = index"
            class="page-container"
            [class.loaded]="loadedPages.has(i + 1)"
          >
            <canvas
              #pageCanvas
              class="pdf-canvas page-canvas"
              [style.transform]="'rotate(' + rotation + 'deg)'"
              [style.transform-origin]="'center'"
            ></canvas>
            <div class="page-number">{{ i + 1 }}</div>
          </div>
        </div>
      </div>

      <!-- Page Info Overlay (Single Page Mode) -->
      <div *ngIf="!loading && !error && viewMode === 'single' && totalPages > 0" class="page-info-overlay">
        {{ currentPage }} / {{ totalPages }}
      </div>
    </div>
  `,
  styleUrls: ['./pdf-viewer.component.css']
})
export class PdfViewerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() src: string = '';
  @Input() currentPage: number = 1;
  @Input() zoom: number = 100;
  @Input() rotation: number = 0;
  @Input() viewMode: 'single' | 'continuous' = 'single';
  @Input() height: string = '100%';
  @Input() width: string = '100%';
  @Input() fullscreen: boolean = false;

  @Output() onLoad = new EventEmitter<{ totalPages: number }>();
  @Output() onError = new EventEmitter<string>();
  @Output() onPageChange = new EventEmitter<number>();

  @ViewChild('pdfCanvas', { static: false }) pdfCanvas!: ElementRef<HTMLCanvasElement>;

  loading = true;
  error: string | null = null;
  totalPages = 0;
  pages: number[] = [];
  loadedPages = new Set<number>();
  pdfDocument: PDFDocumentProxy | null = null;
  proxiedSrc = '';
  isExternal = false;
  isCorsError = false;

  private containerWidth = 0;
  private abortController: AbortController | null = null;
  private timeoutId: number | null = null;
  private heartbeatId: number | null = null;
  private lastActivity = Date.now();
  private renderTasks = new Map<number, any>(); // Track active render tasks

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private errorBoundary: ErrorBoundaryService
  ) {}

  ngOnInit(): void {
    this.initializePdf();
    
    // Listen for window resize events to handle DPR changes
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && !changes['src'].firstChange) {
      this.initializePdf();
    }
    if (changes['currentPage'] && !changes['currentPage'].firstChange) {
      this.renderCurrentPage();
    }
    if (changes['zoom'] && !changes['zoom'].firstChange) {
      this.renderCurrentPage();
    }
    if (changes['rotation'] && !changes['rotation'].firstChange) {
      this.renderCurrentPage();
    }
    if (changes['viewMode'] && !changes['viewMode'].firstChange) {
      this.renderAllPages();
    }
  }

  ngOnDestroy(): void {
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.cleanup();
  }

  private onWindowResize(): void {
    // Re-render on window resize to handle DPR changes
    if (this.pdfDocument && !this.loading) {
      setTimeout(() => {
        if (this.viewMode === 'continuous') {
          this.renderAllPages();
        } else {
          this.renderCurrentPage();
        }
      }, 100); // Small delay to ensure resize is complete
    }
  }

  private async initializePdf(): Promise<void> {
    this.cleanup();
    this.loading = true;
    this.error = null;
    this.totalPages = 0;
    this.pages = [];
    this.loadedPages.clear();

    if (!this.src) {
      this.setError('No PDF source provided');
      return;
    }

    try {
      // Check network connectivity
      if (!navigator.onLine) {
        this.setError('No internet connection. Please check your network and try again.');
        return;
      }

      // Handle different URL types
      if (this.src.startsWith('blob:') || this.src.startsWith('data:')) {
        this.proxiedSrc = this.src;
        this.isExternal = false;
      } else if (isExternalUrl(this.src)) {
        this.isExternal = true;
        this.proxiedSrc = await tryLoadWithProxy(this.src);
      } else {
        this.proxiedSrc = this.src;
        this.isExternal = false;
      }

      // Convert data URL to blob if needed
      if (this.proxiedSrc.startsWith('data:application/pdf;base64,')) {
        const blobUrl = createBlobFromDataUrl(this.proxiedSrc);
        if (blobUrl) {
          this.proxiedSrc = blobUrl;
        }
      }

      await this.loadPdfDocument();
    } catch (error) {
      this.setError(`Failed to load PDF: ${error}`);
    }
  }

  private async loadPdfDocument(): Promise<void> {
    try {
      this.abortController = new AbortController();
      
      // Set loading timeout
      this.timeoutId = window.setTimeout(() => {
        if (this.loading) {
          this.setError('PDF loading timeout');
        }
      }, 30000); // Increased timeout to 30 seconds

      const loadingTask = pdfjsLib.getDocument({
        url: this.proxiedSrc,
        ...defaultPdfOptions
      });

      this.pdfDocument = await loadingTask.promise;
      
      // Clear timeout on successful load
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      
      this.totalPages = this.pdfDocument.numPages;
      this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

      this.loading = false;
      this.error = null;

      this.ngZone.run(() => {
        this.onLoad.emit({ totalPages: this.totalPages });
        this.cdr.detectChanges();
      });

      // Start heartbeat monitoring
      this.startHeartbeat();

      // Render pages based on view mode
      if (this.viewMode === 'continuous') {
        this.renderAllPages();
      } else {
        this.renderCurrentPage();
      }

    } catch (error: any) {
      // Clear timeout on error
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      
      this.setError(`Failed to load PDF document: ${error.message}`);
    }
  }

  private async renderCurrentPage(): Promise<void> {
    if (!this.pdfDocument || this.loading) return;

    try {
      // Cancel any existing render task for current page
      if (this.renderTasks.has(this.currentPage)) {
        this.renderTasks.get(this.currentPage)?.cancel();
        this.renderTasks.delete(this.currentPage);
      }

      const page = await this.pdfDocument.getPage(this.currentPage);
      const canvas = this.pdfCanvas?.nativeElement;
      
      if (!canvas) {
        console.error('Canvas element not found');
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Could not get 2D context from canvas');
        return;
      }

      // Get device pixel ratio for high-DPI displays
      const devicePixelRatio = window.devicePixelRatio || 1;
      const scale = this.zoom / 100;
      const viewport = page.getViewport({ scale, rotation: this.rotation });

      // Set canvas dimensions with device pixel ratio
      const scaledWidth = viewport.width * devicePixelRatio;
      const scaledHeight = viewport.height * devicePixelRatio;

      // Set canvas internal size (actual pixels)
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      // Set canvas display size (CSS pixels)
      canvas.style.width = viewport.width + 'px';
      canvas.style.height = viewport.height + 'px';

      // Scale the context to match device pixel ratio
      context.scale(devicePixelRatio, devicePixelRatio);

      // Clear canvas before rendering
      context.clearRect(0, 0, viewport.width, viewport.height);

      // Enable high-quality image rendering
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      };

      console.log('Rendering PDF page:', {
        pageNumber: this.currentPage,
        scale,
        devicePixelRatio,
        viewport: { width: viewport.width, height: viewport.height },
        canvas: { width: canvas.width, height: canvas.height },
        displaySize: { width: canvas.style.width, height: canvas.style.height }
      });

      // Store the render task
      const renderTask = page.render(renderContext);
      this.renderTasks.set(this.currentPage, renderTask);

      await renderTask.promise;
      this.loadedPages.add(this.currentPage);
      
      // Remove completed task
      this.renderTasks.delete(this.currentPage);
      this.updateActivity();

      console.log('PDF page rendered successfully');

    } catch (error: any) {
      console.error('Error rendering PDF page:', error);
      this.errorBoundary.reportError(error, 'PDF page rendering');
    }
  }

  private async renderAllPages(): Promise<void> {
    if (!this.pdfDocument || this.loading || this.viewMode !== 'continuous') return;

    try {
      const canvasElements = document.querySelectorAll('.page-canvas') as NodeListOf<HTMLCanvasElement>;
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // Cancel any existing render tasks
      this.cancelAllRenderTasks();
      
      // Render pages sequentially to avoid canvas conflicts
      for (let i = 0; i < this.pages.length; i++) {
        const pageNumber = i + 1;
        const canvas = canvasElements[i];
        
        if (!canvas) continue;

        try {
          const page = await this.pdfDocument.getPage(pageNumber);
          const context = canvas.getContext('2d');
          
          if (!context) continue;

          const scale = this.zoom / 100;
          const viewport = page.getViewport({ scale, rotation: this.rotation });

          // Set canvas dimensions with device pixel ratio
          const scaledWidth = viewport.width * devicePixelRatio;
          const scaledHeight = viewport.height * devicePixelRatio;

          // Set canvas internal size (actual pixels)
          canvas.width = scaledWidth;
          canvas.height = scaledHeight;

          // Set canvas display size (CSS pixels)
          canvas.style.width = viewport.width + 'px';
          canvas.style.height = viewport.height + 'px';

          // Scale the context to match device pixel ratio
          context.scale(devicePixelRatio, devicePixelRatio);

          // Clear the canvas before rendering
          context.clearRect(0, 0, viewport.width, viewport.height);

          // Enable high-quality image rendering
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            canvas: canvas
          };

          // Store the render task
          const renderTask = page.render(renderContext);
          this.renderTasks.set(pageNumber, renderTask);

          await renderTask.promise;
          this.loadedPages.add(pageNumber);
          this.updateActivity();
          
          // Remove completed task
          this.renderTasks.delete(pageNumber);
        } catch (error) {
          console.error(`Error rendering page ${pageNumber}:`, error);
          this.renderTasks.delete(pageNumber);
        }
      }
    } catch (error: any) {
      console.error('Error rendering all pages:', error);
      this.errorBoundary.reportError(error, 'PDF all pages rendering');
    }
  }

  private setError(message: string): void {
    this.loading = false;
    this.error = message;
    this.isCorsError = message.toLowerCase().includes('cors');
    
    this.ngZone.run(() => {
      this.onError.emit(message);
      this.cdr.detectChanges();
    });
  }

  retry(): void {
    console.log('Retrying PDF load...');
    this.stopHeartbeat();
    this.initializePdf();
  }

  openInNewTab(): void {
    window.open(this.src, '_blank', 'noopener,noreferrer');
  }

  download(): void {
    const link = document.createElement('a');
    link.href = this.src;
    link.download = this.getFileName();
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private getFileName(): string {
    const parts = this.src.split('/');
    return parts[parts.length - 1] || 'document.pdf';
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastActivity = Date.now();
    
    this.heartbeatId = window.setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivity;
      
      // If no activity for 60 seconds, consider the document unresponsive
      if (timeSinceLastActivity > 60000) {
        console.warn('PDF document appears unresponsive, attempting recovery...');
        this.retry();
      }
    }, 10000); // Check every 10 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatId) {
      clearInterval(this.heartbeatId);
      this.heartbeatId = null;
    }
  }

  private updateActivity(): void {
    this.lastActivity = Date.now();
  }

  private cancelAllRenderTasks(): void {
    this.renderTasks.forEach((task, pageNumber) => {
      try {
        task.cancel();
      } catch (error) {
        console.log(`Could not cancel render task for page ${pageNumber}:`, error);
      }
    });
    this.renderTasks.clear();
  }

  private cleanup(): void {
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Clear timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Abort any ongoing requests
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Cancel all active render tasks
    this.cancelAllRenderTasks();

    // Clean up PDF document
    if (this.pdfDocument) {
      try {
        this.pdfDocument.destroy();
      } catch (error) {
        console.warn('Error destroying PDF document:', error);
      }
      this.pdfDocument = null;
    }

    // Clean up blob URLs
    if (this.proxiedSrc && this.proxiedSrc.startsWith('blob:')) {
      revokeBlobUrl(this.proxiedSrc);
    }

    // Reset state
    this.loadedPages.clear();
    this.loading = false;
    this.error = null;
  }
}
