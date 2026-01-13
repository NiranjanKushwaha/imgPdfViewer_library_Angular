import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Components
import { ImgPdfViewerComponent } from './img-pdf-viewer.component';
import { PdfViewerComponent } from './pdf-viewer.component';
import { ImageViewerComponent } from './image-viewer.component';
import { ToolbarComponent } from './toolbar.component';
import { CustomModalComponent } from './modal/modal.component';

// Services
import { ImgPdfViewerService } from './img-pdf-viewer.service';
import { ErrorBoundaryService } from './error-boundary.service';
import { SafeHtmlPipe } from './safe-html.pipe';

@NgModule({
  declarations: [
    ImgPdfViewerComponent,
    PdfViewerComponent,
    ImageViewerComponent,
    ToolbarComponent,
    CustomModalComponent,
    SafeHtmlPipe,
  ],
  imports: [CommonModule, FormsModule],
  providers: [ImgPdfViewerService, ErrorBoundaryService],
  exports: [
    ImgPdfViewerComponent,
    PdfViewerComponent,
    ImageViewerComponent,
    ToolbarComponent,
  ],
})
export class ImgPdfViewerModule {}
