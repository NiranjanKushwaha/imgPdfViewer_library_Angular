import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// Components
import { ImgPdfViewerComponent } from './img-pdf-viewer.component';
import { PdfViewerComponent } from './pdf-viewer.component';
import { ImageViewerComponent } from './image-viewer.component';
import { ToolbarComponent } from './toolbar.component';

// Services
import { ImgPdfViewerService } from './img-pdf-viewer.service';
import { ErrorBoundaryService } from './error-boundary.service';

@NgModule({
  declarations: [
    ImgPdfViewerComponent,
    PdfViewerComponent,
    ImageViewerComponent,
    ToolbarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule
  ],
  providers: [
    ImgPdfViewerService,
    ErrorBoundaryService
  ],
  exports: [
    ImgPdfViewerComponent,
    PdfViewerComponent,
    ImageViewerComponent,
    ToolbarComponent
  ]
})
export class ImgPdfViewerModule {}
