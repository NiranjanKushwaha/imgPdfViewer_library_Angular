import { Component } from '@angular/core';
import { DocumentViewerConfig, DocumentInfo } from 'projects/img-pdf-viewer/src/lib/types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  // New modern API configuration
  config: DocumentViewerConfig = {
    showToolbar: true,
    showDownload: true,
    showZoom: true,
    showRotation: true,
    showFullscreen: true,
    showInNewTab: true,
    showPagination: true,
    showViewModeToggle: true,
    height: '100vh', // Full viewport height
    width: '100%',
    embedded: false,
    initialZoom: 100,
    maxZoom: 300,
    minZoom: 50,
    viewMode: 'single',
    modalSize: 'lg',
    className: 'customClass'
  };

  // Legacy configuration for backward compatibility
  docPreviewConfig = {
    close: false,
    customStyle: 'customClass',
    modalSize: 'lg',
    docScreenWidth: '100%',
  };

  //1. pdf url with .pdf extension
  url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  // 2. pdf url with no extension (should now work!)
  // url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy';

  //1. image url with .jpg extension (should work without proxy)
  // url = 'https://www.interactivesearchmarketing.com/wp-content/uploads/2014/06/png-vs-jpeg.jpg';

  // No document sending
  // url = '';

  onDocumentLoad(info: DocumentInfo): void {
    console.log('Document loaded successfully:', info);
  }

  onDocumentError(error: string): void {
    console.error('Document loading error:', error);
  }
}
