import { Component } from '@angular/core';
import {
  DocumentViewerConfig,
  DocumentInfo,
} from 'projects/img-pdf-viewer/src/lib/types';

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
    proxyUrl: 'https://api.allorigins.win/raw?url=', // Use a proxy for detection and loading
    fallbackType: 'pdf', // Best practice: provide a fallback for extensionless, CORS-blocked URLs
    maxZoom: 300,
    minZoom: 50,
    viewMode: 'single',
    modalSize: 'lg',
    className: 'customClass',
  };

  // Legacy configuration for backward compatibility
  docPreviewConfig = {
    close: false,
    customStyle: 'customClass',
    modalSize: 'lg',
    docScreenWidth: '100%',
  };

  //1. pdf url with .pdf extension
  // url ='https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  // No document sending
  url = 'https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf';
  // url ='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFSERbH3Dpcac1lp6FR0TybEDnoMeZ-vHxUQ&s';

  onDocumentLoad(info: DocumentInfo): void {}

  onDocumentError(error: string): void {}
}
