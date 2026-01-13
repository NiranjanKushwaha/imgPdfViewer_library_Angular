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
  NgZone,
  HostListener,
} from '@angular/core';
import { DocumentType, ImageInfo } from './types';
import { ErrorBoundaryService } from './error-boundary.service';
import { isExternalUrl, tryLoadWithProxy } from './utils';

@Component({
  selector: 'ngx-image-viewer',
  template: `
    <div
      class="image-viewer-container"
      [style.height]="height"
      [style.width]="width"
    >
      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">
          <p>Loading image...</p>
          <p class="renderer-info">Preparing for display</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-container">
        <div class="error-content">
          <div class="error-icon">🖼️</div>
          <h3>Failed to Load Image</h3>
          <p>{{ error }}</p>
          <div class="troubleshooting-tips">
            <p class="tip-title">Troubleshooting:</p>
            <ul>
              <li>Verify the image URL is accessible</li>
              <li>Check if CORS headers allow this domain</li>
              <li>Ensure the image format is supported</li>
            </ul>
          </div>
          <div class="error-actions">
            <button (click)="retry()" class="btn btn-outline">Retry</button>
            <button (click)="openInNewTab()" class="btn btn-outline">
              Open in New Tab
            </button>
            <button (click)="download()" class="btn btn-outline">
              Download
            </button>
          </div>
        </div>
      </div>

      <!-- Image Content -->
      <div
        *ngIf="!error"
        class="image-content"
        [class.dragging]="isDragging"
        (mousedown)="onMouseDown($event)"
        (mousemove)="onMouseMove($event)"
        (mouseup)="onMouseUp()"
        (mouseleave)="onMouseUp()"
        (wheel)="onWheel($event)"
      >
        <img
          *ngIf="proxiedSrc"
          #imageElement
          [src]="proxiedSrc"
          [alt]="imageInfo?.alt || 'Document'"
          class="image-element"
          [class.zoomable]="zoom > 100"
          [class.dragging]="isDragging"
          [style.transform]="getImageTransform()"
          [style.transform-origin]="'center'"
          [style.max-width]="zoom <= 100 ? '100%' : 'none'"
          [style.max-height]="zoom <= 100 ? '100%' : 'none'"
          (load)="onImageLoad($event)"
          (error)="onImageError($event)"
          draggable="false"
        />

        <!-- Image Info Overlay -->
        <div *ngIf="imageInfo && !loading" class="image-info-overlay">
          {{ imageInfo.naturalWidth }} × {{ imageInfo.naturalHeight }}
          <span *ngIf="imageType === 'vector'"> (SVG)</span>
          <span *ngIf="imageType === 'animated'"> (GIF)</span>
        </div>

        <!-- Pan Hint for Zoomed Images -->
        <div *ngIf="zoom > 100 && !loading && !error" class="pan-hint">
          <span class="pan-icon">✋</span>
          Drag to pan
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./image-viewer.component.css'],
})
export class ImageViewerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() src: string = '';
  @Input() zoom: number = 100;
  @Input() rotation: number = 0;
  @Input() height: string = '100%';
  @Input() width: string = '100%';
  @Input() proxyUrl?: string;

  @Output() onLoad = new EventEmitter<ImageInfo>();
  @Output() onError = new EventEmitter<string>();
  @Output() onZoomChange = new EventEmitter<number>();
  @Output() onRotationChange = new EventEmitter<number>();

  @ViewChild('imageElement', { static: false })
  imageElement!: ElementRef<HTMLImageElement>;

  loading = true;
  error: string | null = null;
  imageInfo: ImageInfo | null = null;
  proxiedSrc = '';
  isExternal = false;
  isDragging = false;
  dragStart = { x: 0, y: 0 };
  imagePosition = { x: 0, y: 0 };
  imageType: 'raster' | 'vector' | 'animated' = 'raster';

  private wheelTimeout: number | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private errorBoundary: ErrorBoundaryService
  ) {}

  ngOnInit(): void {
    this.initializeImage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && !changes['src'].firstChange) {
      this.initializeImage();
    }
    if (changes['zoom'] && !changes['zoom'].firstChange) {
      this.resetPositionIfNeeded();
    }
  }

  ngOnDestroy(): void {
    if (this.wheelTimeout) {
      clearTimeout(this.wheelTimeout);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.resetPositionIfNeeded();
  }

  private async initializeImage(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.imageInfo = null;
    this.imagePosition = { x: 0, y: 0 };

    if (!this.src) {
      this.setError('No image source provided');
      return;
    }

    try {
      // Handle different URL types
      if (this.src.startsWith('blob:') || this.src.startsWith('data:')) {
        this.proxiedSrc = this.src;
        this.isExternal = false;
      } else if (isExternalUrl(this.src)) {
        this.isExternal = true;
        this.proxiedSrc = await tryLoadWithProxy(this.src, this.proxyUrl);
      } else {
        this.proxiedSrc = this.src;
        this.isExternal = false;
      }

      // Detect image type
      this.imageType = this.detectImageType(this.src);
      this.cdr.detectChanges();
    } catch (error) {
      this.setError(`Failed to load image: ${error}`);
    }
  }

  private detectImageType(src: string): 'raster' | 'vector' | 'animated' {
    const extension = src.split('.').pop()?.toLowerCase();
    if (['svg'].includes(extension || '')) return 'vector';
    if (['gif'].includes(extension || '')) return 'animated';
    return 'raster';
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;

    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      this.imageInfo = {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        src: this.proxiedSrc,
        alt: img.alt || 'Document',
      };

      this.loading = false;
      this.error = null;

      this.ngZone.run(() => {
        this.onLoad.emit(this.imageInfo!);
        this.cdr.detectChanges();
      });
    } else {
      this.setError('Image has zero dimensions');
    }
  }

  onImageError(event: Event): void {
    const errorMessage = (this.proxiedSrc || this.src).startsWith('blob:')
      ? 'Invalid blob URL'
      : 'Network error or unsupported format';

    this.setError(`Failed to load image: ${errorMessage}`);
  }

  onMouseDown(event: MouseEvent): void {
    if (this.zoom > 100 && !this.loading && !this.error) {
      this.isDragging = true;
      this.dragStart = {
        x: event.clientX - this.imagePosition.x,
        y: event.clientY - this.imagePosition.y,
      };
      event.preventDefault();
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.zoom > 100) {
      this.imagePosition = {
        x: event.clientX - this.dragStart.x,
        y: event.clientY - this.dragStart.y,
      };
    }
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  onWheel(event: WheelEvent): void {
    if (this.wheelTimeout) {
      clearTimeout(this.wheelTimeout);
    }

    this.wheelTimeout = window.setTimeout(() => {
      // Handle zoom with mouse wheel
      const delta = event.deltaY > 0 ? -10 : 10;
      const newZoom = Math.max(50, Math.min(300, this.zoom + delta));

      if (newZoom !== this.zoom) {
        this.ngZone.run(() => {
          this.onZoomChange.emit(newZoom);
        });
      }
    }, 50);

    event.preventDefault();
  }

  private resetPositionIfNeeded(): void {
    if (this.zoom === 100) {
      this.imagePosition = { x: 0, y: 0 };
    }
  }

  getImageTransform(): string {
    return `scale(${this.zoom / 100}) rotate(${this.rotation}deg) translate(${
      this.imagePosition.x
    }px, ${this.imagePosition.y}px)`;
  }

  private setError(message: string): void {
    this.loading = false;
    this.error = message;

    this.ngZone.run(() => {
      this.onError.emit(message);
      this.cdr.detectChanges();
    });

    this.errorBoundary.reportError(message, 'Image loading');
  }

  retry(): void {
    this.initializeImage();
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
    return parts[parts.length - 1] || 'image';
  }
}
