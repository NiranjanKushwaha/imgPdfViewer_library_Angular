import {
  Component,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
  ChangeDetectorRef,
  NgZone,
  Inject,
  Optional
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CommonConstant } from './Common.constant';
import { DocumentViewerConfig, DocumentType, DocumentInfo, ViewerState } from './types';
import { ImgPdfViewerService } from './img-pdf-viewer.service';
import { ErrorBoundaryService } from './error-boundary.service';
import { detectDocumentType, detectDocumentTypeAsync, isValidUrl, enterFullscreen, exitFullscreen, isFullscreen } from './utils';

@Component({
  selector: 'ngx-imgPdf-viewer',
  templateUrl: './img-pdf-viewer.component.html',
  styleUrls: ['./img-pdf-viewer.component.css'],
})
export class ImgPdfViewerComponent implements OnInit, OnDestroy, OnChanges {
  // Inputs - New API
  @Input() documentUrl: string = '';
  @Input() documentType?: DocumentType;
  @Input() title?: string;
  @Input() config?: DocumentViewerConfig;

  // Legacy inputs for backward compatibility
  @Input() documentURL: string = '';
  @Input() docPreviewConfig: any = {};

  // Outputs
  @Output() onError = new EventEmitter<string>();
  @Output() onLoad = new EventEmitter<DocumentInfo>();
  @Output() onZoomChange = new EventEmitter<number>();
  @Output() onRotationChange = new EventEmitter<number>();
  @Output() onPageChange = new EventEmitter<number>();

  // ViewChild references
  @ViewChild('containerRef', { static: false }) containerRef!: ElementRef<HTMLDivElement>;

  // Component state
  state: ViewerState = {
    currentPage: 1,
    totalPages: 1,
    zoom: 100,
    rotation: 0,
    loading: true,
    error: null,
    fullscreen: false,
    documentInfo: null,
    viewMode: 'single'
  };

  // Computed properties
  get effectiveDocumentUrl(): string {
    return this.documentUrl || this.documentURL;
  }

  get detectedDocumentType(): DocumentType {
    return this.documentType || detectDocumentType(this.effectiveDocumentUrl);
  }

  // Async document type detection for URLs without extensions
  async getDetectedDocumentTypeAsync(): Promise<DocumentType> {
    if (this.documentType) {
      return this.documentType;
    }
    
    const url = this.effectiveDocumentUrl;
    if (!url) {
      return 'unknown';
    }
    
    return await detectDocumentTypeAsync(url);
  }

  get mergedConfig(): DocumentViewerConfig {
    // Start with defaults
    const defaultConfig: DocumentViewerConfig = {
      showToolbar: true,
      showDownload: true,
      showZoom: true,
      showRotation: true,
      showFullscreen: true,
      showInNewTab: true,
      showPagination: true,
      showViewModeToggle: true,
      height: '100vh', // Full viewport height by default
      width: '100%',
      embedded: false,
      initialZoom: 100,
      maxZoom: 300,
      minZoom: 50,
      viewMode: 'single',
      modalSize: 'lg'
    };

    // Merge with new API config
    const newApiConfig = this.config || {};

    // Merge with legacy config if present
    const legacyConfig: DocumentViewerConfig = {};
    if (this.docPreviewConfig) {
      legacyConfig.showToolbar = this.docPreviewConfig.zoomIn !== false || this.docPreviewConfig.zoomOut !== false || this.docPreviewConfig.rotate !== false;
      legacyConfig.showDownload = this.docPreviewConfig.download !== false;
      legacyConfig.showZoom = this.docPreviewConfig.zoomIn !== false || this.docPreviewConfig.zoomOut !== false;
      legacyConfig.showRotation = this.docPreviewConfig.rotate !== false;
      legacyConfig.showFullscreen = this.docPreviewConfig.openModal !== false;
      legacyConfig.showPagination = this.docPreviewConfig.pageIndicator !== false;
      legacyConfig.height = this.docPreviewConfig.docScreenWidth || '100%';
      legacyConfig.modalSize = this.docPreviewConfig.modalSize || 'lg';
      legacyConfig.className = this.docPreviewConfig.customStyle || '';
    }

    return { ...defaultConfig, ...legacyConfig, ...newApiConfig };
  }

  // Legacy properties for backward compatibility
  get legacyDocPreviewConfig(): any {
    return {
      zoomIn: this.mergedConfig.showZoom,
      zoomOut: this.mergedConfig.showZoom,
      rotate: this.mergedConfig.showRotation,
      pageIndicator: this.mergedConfig.showPagination,
      download: this.mergedConfig.showDownload,
      openModal: this.mergedConfig.showFullscreen,
      close: true,
      docScreenWidth: this.mergedConfig.width,
      modalSize: this.mergedConfig.modalSize,
      customStyle: this.mergedConfig.customStyle || ''
    };
  }

  get legacyDocumentURL(): string {
    return this.documentUrl;
  }

  get fileName(): string {
    return this.title || this.state.documentInfo?.fileName || 'document';
  }

  // Internal state
  private modalRef: NgbModalRef | null = null;
  private fullscreenChangeListener?: () => void;

  constructor(
    private _helper: ImgPdfViewerService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private errorBoundary: ErrorBoundaryService
  ) {}

  ngOnInit(): void {
    this.initializeViewer();
    this.setupFullscreenListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['documentUrl'] && !changes['documentUrl'].firstChange) ||
        (changes['documentURL'] && !changes['documentURL'].firstChange)) {
      this.initializeViewer();
    }
    if (changes['config'] && !changes['config'].firstChange) {
      this.updateConfig();
    }
    if (changes['docPreviewConfig'] && !changes['docPreviewConfig'].firstChange) {
      this.updateConfig();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  async initializeViewer(): Promise<void> {
    if (!this.effectiveDocumentUrl) {
      this.setError('No document URL provided');
      return;
    }

    if (!isValidUrl(this.effectiveDocumentUrl)) {
      this.setError('Invalid document URL provided');
      return;
    }

    this.state = {
      ...this.state,
      loading: true,
      error: null,
      zoom: this.mergedConfig.initialZoom || 100,
      rotation: 0,
      currentPage: 1,
      viewMode: this.mergedConfig.viewMode || 'single'
    };

    // Use async document type detection for better accuracy
    await this.initializeDocumentInfoAsync();
  }

  private initializeDocumentInfo(): void {
    const documentInfo: DocumentInfo = {
      type: this.detectedDocumentType,
      fileName: this.title || this._helper.getFileName(this.effectiveDocumentUrl)
    };

    this.state = {
      ...this.state,
      documentInfo
    };

    this.ngZone.run(() => {
      this.onLoad.emit(documentInfo);
      this.cdr.detectChanges();
    });
  }

  private async initializeDocumentInfoAsync(): Promise<void> {
    try {
      // Use async detection for better accuracy, especially for URLs without extensions
      const detectedType = await this.getDetectedDocumentTypeAsync();
      
      const documentInfo: DocumentInfo = {
        type: detectedType,
        fileName: this.title || this._helper.getFileName(this.effectiveDocumentUrl)
      };

      this.state = {
        ...this.state,
        documentInfo,
        loading: false
      };

      this.ngZone.run(() => {
        this.onLoad.emit(documentInfo);
        this.cdr.detectChanges();
      });

      console.log('Document loaded successfully:', documentInfo);
    } catch (error) {
      console.error('Error detecting document type:', error);
      this.setError('Failed to detect document type');
    }
  }

  private updateConfig(): void {
    // Update state based on new config
    if (this.mergedConfig.initialZoom && this.mergedConfig.initialZoom !== this.state.zoom) {
      this.state.zoom = this.mergedConfig.initialZoom;
    }
    if (this.mergedConfig.viewMode && this.mergedConfig.viewMode !== this.state.viewMode) {
      this.state.viewMode = this.mergedConfig.viewMode;
    }
  }

  private setupFullscreenListener(): void {
    this.fullscreenChangeListener = () => {
      this.state.fullscreen = isFullscreen();
      this.cdr.detectChanges();
    };

    document.addEventListener('fullscreenchange', this.fullscreenChangeListener);
    document.addEventListener('webkitfullscreenchange', this.fullscreenChangeListener);
    document.addEventListener('mozfullscreenchange', this.fullscreenChangeListener);
    document.addEventListener('MSFullscreenChange', this.fullscreenChangeListener);
  }

  private cleanup(): void {
    if (this.fullscreenChangeListener) {
      document.removeEventListener('fullscreenchange', this.fullscreenChangeListener);
      document.removeEventListener('webkitfullscreenchange', this.fullscreenChangeListener);
      document.removeEventListener('mozfullscreenchange', this.fullscreenChangeListener);
      document.removeEventListener('MSFullscreenChange', this.fullscreenChangeListener);
    }

    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  private setError(message: string): void {
    this.state = {
      ...this.state,
      loading: false,
      error: message
    };

    this.ngZone.run(() => {
      this.onError.emit(message);
      this.cdr.detectChanges();
    });

    this.errorBoundary.reportError(message, 'Document viewer');
  }

  // Event handlers
  onDocumentLoad(info: DocumentInfo): void {
    this.state = {
      ...this.state,
      loading: false,
      error: null,
      documentInfo: info
    };

    this.ngZone.run(() => {
      this.onLoad.emit(info);
      this.cdr.detectChanges();
    });
  }

  onDocumentError(error: string): void {
    console.error('Document loading error:', error);
    this.setError(error);
    
    // Auto-retry for timeout errors
    if (error.includes('timeout') || error.includes('network')) {
      setTimeout(() => {
        if (this.state.error) {
          console.log('Auto-retrying document load...');
          this.initializeViewer();
        }
      }, 2000);
    }
  }

  onZoomIn(): void {
    const newZoom = Math.min(this.state.zoom + 25, this.mergedConfig.maxZoom || 300);
    this.updateZoom(newZoom);
  }

  onZoomOut(): void {
    const newZoom = Math.max(this.state.zoom - 25, this.mergedConfig.minZoom || 50);
    this.updateZoom(newZoom);
  }

  onZoomReset(): void {
    this.updateZoom(this.mergedConfig.initialZoom || 100);
  }

  updateZoom(zoom: number): void {
    this.state = { ...this.state, zoom };
    this.ngZone.run(() => {
      this.onZoomChange.emit(zoom);
      this.cdr.detectChanges();
    });
  }

  onRotateLeft(): void {
    this.updateRotation(this.state.rotation - 90);
  }

  onRotateRight(): void {
    this.updateRotation(this.state.rotation + 90);
  }

  updateRotation(rotation: number): void {
    this.state = { ...this.state, rotation };
    this.ngZone.run(() => {
      this.onRotationChange.emit(rotation);
      this.cdr.detectChanges();
    });
  }

  onPreviousPage(): void {
    if (this.state.currentPage > 1) {
      const newPage = this.state.currentPage - 1;
      this.updatePage(newPage);
    }
  }

  onNextPage(): void {
    if (this.state.currentPage < this.state.totalPages) {
      const newPage = this.state.currentPage + 1;
      this.updatePage(newPage);
    }
  }

  updatePage(page: number): void {
    this.state = { ...this.state, currentPage: page };
    this.ngZone.run(() => {
      this.onPageChange.emit(page);
      this.cdr.detectChanges();
    });
  }

  onToggleViewMode(): void {
    const newViewMode = this.state.viewMode === 'single' ? 'continuous' : 'single';
    this.state = { ...this.state, viewMode: newViewMode };
    this.cdr.detectChanges();
  }

  onDownload(): void {
    this._helper.downloadResource(this.effectiveDocumentUrl, this.fileName);
  }

  onOpenInNewTab(): void {
    window.open(this.effectiveDocumentUrl, '_blank', 'noopener,noreferrer');
  }

  async onFullscreen(): Promise<void> {
    if (!this.containerRef?.nativeElement) return;

    try {
      if (this.state.fullscreen) {
        await exitFullscreen();
      } else {
        await enterFullscreen(this.containerRef.nativeElement);
      }
    } catch (error) {
      console.warn('Fullscreen operation failed:', error);
      this.errorBoundary.reportError(error as Error, 'Fullscreen operation');
    }
  }

  // Legacy methods for backward compatibility
  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  downloadFile(): void {
    this.onDownload();
  }

  upDateZoom(zoomType: string): void {
      switch (zoomType) {
      case 'increment':
        this.onZoomIn();
        break;
        case 'decrement':
        this.onZoomOut();
          break;
        default:
        this.onZoomReset();
          break;
      }
    }

  rotateDoc(): void {
    this.onRotateRight();
  }

  viewInFullScreen(): void {
    this.onFullscreen();
  }

  // Legacy getters for backward compatibility
  get zoom_in(): number {
    return this.state.zoom / 100;
  }

  set zoom_in(value: number) {
    this.state.zoom = value * 100;
  }

  get rotation(): number {
    return this.state.rotation;
  }

  set rotation(value: number) {
    this.state.rotation = value;
  }

  get isArchieved(): boolean {
    return !!this.state.error;
  }

  get pdfType(): string {
    return CommonConstant.PDFTYPE;
  }

  get imageType(): string {
    return CommonConstant.IMAGETYPE;
  }

  get inputModelRef(): NgbModalRef | null {
    return this.modalRef;
  }

  set inputModelRef(value: NgbModalRef | null) {
    this.modalRef = value;
  }
}
