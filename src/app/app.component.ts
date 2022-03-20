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
  // url = 'http://www.africau.edu/images/default/sample.pdf';

  // 2. pdf url with no extension
  url =
    'https://proclaim-api-prod.mediassist.in/download/5386/mediassistindia.com/613effb6-b7a5-4924-b48e-bfb4fac8fb80';

  //1. image url with .jpg extension
  // url =
  //   'https://www.interactivesearchmarketing.com/wp-content/uploads/2014/06/png-vs-jpeg.jpg';

  //2.  image url with no extension
  // url =
  //   'https://proclaim-api-prod.mediassist.in/download/5386/mediassistindia.com/6820313e-b526-45f2-93fe-47ec9aaae91e';

  // test on archieved url which can be vioew as blob
  // url = 'https://stg-yellow.ihxpro.in/swagger/index.html';

  // Not supported URL
  // url =
  //   'https://proclaim-api-prod.mediassist.in/download/5386/mediassistindia.com/41076D81-328D-40C7-AD3F-B45A6CBCA4B3.jpg';

  // No document sending
  // url = '';
}
