import { NgModule } from '@angular/core';
import { ImgPdfViewerComponent } from './img-pdf-viewer.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [ImgPdfViewerComponent],
  imports: [PdfViewerModule, NgbModule, FormsModule, CommonModule],
  exports: [ImgPdfViewerComponent],
})
export class ImgPdfViewerModule {}
