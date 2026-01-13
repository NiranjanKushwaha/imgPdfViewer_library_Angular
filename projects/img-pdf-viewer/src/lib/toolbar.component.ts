import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { DocumentType, ViewerState, ToolbarAction } from './types';
import { supportsPagination, supportsZoom, supportsRotation } from './utils';
import { Icons } from './icons/icons.constant';

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
              [disabled]="
                state.currentPage <= 1 || state.viewMode === 'continuous'
              "
              (click)="handlePreviousPage()"
              [attr.aria-label]="'Previous page'"
              title="Previous page"
            >
              <div
                class="svg-icon"
                [innerHTML]="icons.prevPage | safeHtml"
              ></div>
            </button>

            <div class="page-info">
              <span class="current-page">{{ state.currentPage || 1 }}</span>
              <span class="separator">/</span>
              <span class="total-pages">{{ state.totalPages || 1 }}</span>
            </div>

            <button
              class="toolbar-btn"
              [disabled]="
                state.currentPage >= state.totalPages ||
                state.viewMode === 'continuous'
              "
              (click)="handleNextPage()"
              [attr.aria-label]="'Next page'"
              title="Next page"
            >
              <div
                class="svg-icon"
                [innerHTML]="icons.nextPage | safeHtml"
              ></div>
            </button>
          </div>

          <!-- View Mode Toggle - Only for PDFs -->
          <button
            *ngIf="documentType === 'pdf' && showViewModeToggle"
            class="toolbar-btn view-mode-btn"
            (click)="handleToggleViewMode()"
            [attr.aria-label]="
              state.viewMode === 'single'
                ? 'Switch to continuous scroll'
                : 'Switch to single page'
            "
            [title]="
              state.viewMode === 'single'
                ? 'Switch to continuous scroll'
                : 'Switch to single page'
            "
          >
            <div
              class="svg-icon"
              [innerHTML]="
                (state.viewMode === 'single'
                  ? icons.viewContinuous
                  : icons.viewSingle
                ) | safeHtml
              "
            ></div>
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
              <div
                class="svg-icon"
                [innerHTML]="icons.zoomOut | safeHtml"
              ></div>
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
              <div class="svg-icon" [innerHTML]="icons.zoomIn | safeHtml"></div>
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
              <div
                class="svg-icon"
                [innerHTML]="icons.rotateLeft | safeHtml"
              ></div>
            </button>

            <button
              class="toolbar-btn"
              (click)="handleRotateRight()"
              [attr.aria-label]="'Rotate right'"
              title="Rotate right"
            >
              <div
                class="svg-icon"
                [innerHTML]="icons.rotateRight | safeHtml"
              ></div>
            </button>
          </div>

          <!-- Divider -->
          <div
            *ngIf="
              canRotate &&
              showRotation &&
              (showDownload || showInNewTab || showFullscreen)
            "
            class="divider"
          ></div>

          <!-- Download button -->
          <button
            *ngIf="showDownload"
            class="toolbar-btn download-btn"
            (click)="handleDownload()"
            [attr.aria-label]="'Download document'"
            title="Download document"
          >
            <div class="svg-icon" [innerHTML]="icons.download | safeHtml"></div>
          </button>

          <!-- Open in new tab button -->
          <button
            *ngIf="showInNewTab"
            class="toolbar-btn new-tab-btn"
            (click)="handleOpenInNewTab()"
            [attr.aria-label]="'Open in new tab'"
            title="Open in new tab"
          >
            <div
              class="svg-icon"
              [innerHTML]="icons.externalLink | safeHtml"
            ></div>
          </button>

          <!-- Fullscreen button -->
          <button
            *ngIf="showFullscreen"
            class="toolbar-btn fullscreen-btn"
            (click)="handleFullscreen()"
            [attr.aria-label]="
              state.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
            "
            [title]="state.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          >
            <div
              class="svg-icon"
              [innerHTML]="
                (state.fullscreen ? icons.fullscreenExit : icons.fullscreen)
                  | safeHtml
              "
            ></div>
          </button>
        </div>
      </div>

      <!-- Filename display -->
      <div *ngIf="state.documentInfo && !embedded" class="filename-display">
        <div
          class="svg-icon file-icon"
          [innerHTML]="icons.file | safeHtml"
        ></div>
        <span
          class="filename"
          [title]="state.documentInfo.fileName || 'Document'"
        >
          {{ state.documentInfo.fileName || 'Document' }}
        </span>
      </div>
    </div>
  `,
  styleUrls: ['./toolbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  @Input() state!: ViewerState;
  @Input() documentType: DocumentType = 'unknown';
  @Input() embedded = false;

  // Feature flags
  @Input() showDownload = true;
  @Input() showInNewTab = true;
  @Input() showZoom = true;
  @Input() showRotation = true;
  @Input() showFullscreen = true;
  @Input() showViewModeToggle = true;

  @Output() onDownload = new EventEmitter<void>();
  @Output() onOpenInNewTab = new EventEmitter<void>();
  @Output() onPrint = new EventEmitter<void>();
  @Output() onZoomIn = new EventEmitter<void>();
  @Output() onZoomOut = new EventEmitter<void>();
  @Output() onZoomReset = new EventEmitter<void>();
  @Output() onRotateLeft = new EventEmitter<void>();
  @Output() onRotateRight = new EventEmitter<void>();
  @Output() onPreviousPage = new EventEmitter<void>();
  @Output() onNextPage = new EventEmitter<void>();
  @Output() onFullscreen = new EventEmitter<void>();
  @Output() onToggleViewMode = new EventEmitter<void>();

  Math = Math;
  icons = Icons;

  constructor(private cdr: ChangeDetectorRef) {}

  get canZoom(): boolean {
    return supportsZoom(this.documentType);
  }

  get canRotate(): boolean {
    return supportsRotation(this.documentType);
  }

  get canPaginate(): boolean {
    return supportsPagination(this.documentType);
  }

  // Handlers
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
    if (this.state.currentPage > 1) {
      this.onPreviousPage.emit();
    }
  }

  handleNextPage(): void {
    if (this.state.currentPage < this.state.totalPages) {
      this.onNextPage.emit();
    }
  }

  handleFullscreen(): void {
    this.onFullscreen.emit();
  }

  handleToggleViewMode(): void {
    this.onToggleViewMode.emit();
  }
}
