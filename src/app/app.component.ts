import { Component } from '@angular/core';
import { DocPreviewConfig } from 'projects/img-pdf-viewer/src/lib/docConfig';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  docPreviewConfig: DocPreviewConfig = {
    close: false,
    customStyle: 'customClass',
    modalSize: 'lg',
    docScreenWidth: '100%',
  };

  //1. pdf url with .pdf extension
  url = 'http://www.africau.edu/images/default/sample.pdf';

  // 2. pdf url with no extension
  // url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy';

  //1. image url with .jpg extension
  // url =
  //   'https://www.interactivesearchmarketing.com/wp-content/uploads/2014/06/png-vs-jpeg.jpg';
  
  // No document sending
  // url = '';
}
