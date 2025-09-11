import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { DocumentType, ViewerState, ToolbarAction } from './types';
import { supportsPagination, supportsZoom, supportsRotation } from './utils';

@Component({
  selector: 'ngx-document-toolbar',
  template: `
    <div class="document-toolbar" [class.embedded]="embedded">
      <!-- Main toolbar with action buttons -->
      <div class="toolbar-main">
        <!-- Left section - Page navigation and view mode toggle -->
        <div class="toolbar-section toolbar-left">
          <!-- Page Navigation -->
          <div *ngIf="canPaginate" class="page-navigation">
            <button
              class="toolbar-btn"
              [disabled]="state.currentPage <= 1 || state.viewMode === 'continuous'"
              (click)="handlePreviousPage()"
              [attr.aria-label]="'Previous page'"
              title="Previous page"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            
            <div class="page-info">
              <span class="current-page">{{ state.currentPage || 1 }}</span>
              <span class="separator">/</span>
              <span class="total-pages">{{ state.totalPages || 1 }}</span>
            </div>
            
            <button
              class="toolbar-btn"
              [disabled]="state.currentPage >= state.totalPages || state.viewMode === 'continuous'"
              (click)="handleNextPage()"
              [attr.aria-label]="'Next page'"
              title="Next page"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>

          <!-- View Mode Toggle - Only for PDFs -->
          <button
            *ngIf="documentType === 'pdf' && showViewModeToggle"
            class="toolbar-btn view-mode-btn"
            (click)="handleToggleViewMode()"
            [attr.aria-label]="state.viewMode === 'single' ? 'Switch to continuous scroll' : 'Switch to single page'"
            [title]="state.viewMode === 'single' ? 'Switch to continuous scroll' : 'Switch to single page'"
          >
            <i class="fas" [class.fa-th-large]="state.viewMode === 'single'" [class.fa-list]="state.viewMode === 'continuous'"></i>
          </button>
        </div>

        <!-- Center section - Zoom controls -->
        <div *ngIf="canZoom && showZoom" class="toolbar-section toolbar-center">
          <div class="zoom-controls">
            <button
              class="toolbar-btn"
              [disabled]="state.zoom <= 25"
              (click)="handleZoomOut()"
              [attr.aria-label]="'Zoom out'"
              title="Zoom out"
            >
              <i class="fas fa-minus"></i>
            </button>
            
            <button
              class="toolbar-btn zoom-display"
              (click)="handleZoomReset()"
              [attr.aria-label]="'Reset zoom'"
              title="Reset zoom"
            >
              {{ Math.round(state.zoom) }}%
            </button>
            
            <button
              class="toolbar-btn"
              [disabled]="state.zoom >= 300"
              (click)="handleZoomIn()"
              [attr.aria-label]="'Zoom in'"
              title="Zoom in"
            >
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>

        <!-- Right section - Action buttons -->
        <div class="toolbar-section toolbar-right">
          <!-- Rotation controls -->
          <div *ngIf="canRotate && showRotation" class="rotation-controls">
            <button
              class="toolbar-btn"
              (click)="handleRotateLeft()"
              [attr.aria-label]="'Rotate left'"
              title="Rotate left"
            >
              <i class="fas fa-undo"></i>
            </button>
            
            <button
              class="toolbar-btn"
              (click)="handleRotateRight()"
              [attr.aria-label]="'Rotate right'"
              title="Rotate right"
            >
              <i class="fas fa-redo"></i>
            </button>
          </div>

          <!-- Divider -->
          <div *ngIf="canRotate && showRotation && (showDownload || showInNewTab || showFullscreen)" class="divider"></div>

          <!-- Download button -->
          <button
            *ngIf="showDownload"
            class="toolbar-btn download-btn"
            (click)="handleDownload()"
            [attr.aria-label]="'Download document'"
            title="Download document"
          >
            <i class="fas fa-download"></i>
          </button>

          <!-- Open in new tab button -->
          <button
            *ngIf="showInNewTab"
            class="toolbar-btn new-tab-btn"
            (click)="handleOpenInNewTab()"
            [attr.aria-label]="'Open in new tab'"
            title="Open in new tab"
          >
            <i class="fas fa-external-link-alt"></i>
          </button>

          <!-- Fullscreen button -->
          <button
            *ngIf="showFullscreen"
            class="toolbar-btn fullscreen-btn"
            (click)="handleFullscreen()"
            [attr.aria-label]="state.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
            [title]="state.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          >
            <i class="fas" [class.fa-expand]="!state.fullscreen" [class.fa-compress]="state.fullscreen"></i>
          </button>
        </div>
      </div>

      <!-- Filename display -->
      <div *ngIf="state.documentInfo && !embedded" class="filename-display">
        <i class="fas fa-file-alt file-icon"></i>
        <span class="filename" [title]="state.documentInfo.fileName || 'Document'">
          {{ state.documentInfo.fileName || 'Document' }}
        </span>
      </div>
    </div>
  `,
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit, OnChanges {
  @Input() state!: ViewerState;
  @Input() documentType!: DocumentType;
  @Input() showDownload: boolean = true;
  @Input() showInNewTab: boolean = true;
  @Input() showZoom: boolean = true;
  @Input() showRotation: boolean = true;
  @Input() showFullscreen: boolean = true;
  @Input() showViewModeToggle: boolean = true;
  @Input() embedded: boolean = false;

  @Output() onDownload = new EventEmitter<void>();
  @Output() onOpenInNewTab = new EventEmitter<void>();
  @Output() onZoomIn = new EventEmitter<void>();
  @Output() onZoomOut = new EventEmitter<void>();
  @Output() onZoomReset = new EventEmitter<void>();
  @Output() onRotateLeft = new EventEmitter<void>();
  @Output() onRotateRight = new EventEmitter<void>();
  @Output() onPreviousPage = new EventEmitter<void>();
  @Output() onNextPage = new EventEmitter<void>();
  @Output() onFullscreen = new EventEmitter<void>();
  @Output() onToggleViewMode = new EventEmitter<void>();

  canZoom = false;
  canRotate = false;
  canPaginate = false;
  Math = Math; // Make Math available in template

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateCapabilities();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documentType'] || changes['state']) {
      this.updateCapabilities();
    }
  }

  private updateCapabilities(): void {
    if (this.documentType) {
      this.canZoom = supportsZoom(this.documentType);
      this.canRotate = supportsRotation(this.documentType);
      this.canPaginate = supportsPagination(this.documentType);
    }
  }

  // Event handlers
  handleDownload(): void {
    this.onDownload.emit();
  }

  handleOpenInNewTab(): void {
    this.onOpenInNewTab.emit();
  }

  handleZoomIn(): void {
    this.onZoomIn.emit();
  }

  handleZoomOut(): void {
    this.onZoomOut.emit();
  }

  handleZoomReset(): void {
    this.onZoomReset.emit();
  }

  handleRotateLeft(): void {
    this.onRotateLeft.emit();
  }

  handleRotateRight(): void {
    this.onRotateRight.emit();
  }

  handlePreviousPage(): void {
    this.onPreviousPage.emit();
  }

  handleNextPage(): void {
    this.onNextPage.emit();
  }

  handleFullscreen(): void {
    this.onFullscreen.emit();
  }

  handleToggleViewMode(): void {
    this.onToggleViewMode.emit();
  }
}
