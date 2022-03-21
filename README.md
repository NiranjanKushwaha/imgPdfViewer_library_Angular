# Description

Angular Image & PDF Viewer

## Installation

Use node package manager [npm](https://www.npmjs.com/package/img-pdf-viewer) to install package.

```bash
npm i img-pdf-viewer
```

## Way to use

1. import the package in app.module.ts like below and add it to imports array.

import { ImgPdfViewerModule } from 'img-pdf-viewer';

@NgModule({
imports: [ImgPdfViewerModule],
})

export class AppModule {}

2.  Import ng2-pdfviewer like above and add it to imports section because it depends on this package.
    [ng2-pdfviewer](https://www.npmjs.com/package/ng2-pdf-viewer)

3.  To pass config in app.component.ts you have to import DocPreviewConfig like below.

import { DocPreviewConfig } from 'img-pdf-viewer';

```
docPreviewConfig: DocPreviewConfig = {
    zoomIn: true,
    zoomOut: true,
    rotate: true,
    pageIndicator: true,
    download: true,
    openModal: true,
    close: false,
    docScreenWidth: '100%',
    modalSize: 'md',
    customStyle: '',

  };

```

4. in you html (app.component.html)

```
<ngx-imgPdf-viewer
        [documentURL]="url"
        [docPreviewConfig]="docPreviewConfig"
      >
</ngx-imgPdf-viewer>

```

5. Install bootstrap,ng-bootstrap and fontawesome

```
a).  ng add @ng-bootstrap/ng-bootstrap

b). fontawesome link

<link
rel="stylesheet"
href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.0/css/all.min.css"
integrity="sha512-10/jx2EXwxxWqCLX/hHth/vu2KY3jCF70dCQB8TSgNjbCVAC/8vai53GfMDrO2Emgwccf2pJqxct9ehpzG+MTw=="
crossorigin="anonymous"
referrerpolicy="no-referrer"
/>

c). bootstrap link

<link
href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"
rel="stylesheet"
integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC"
crossorigin="anonymous"
/>
```

6. Have a look at [Demo](https://stackblitz.com/edit/img-pdf-viewer)

7. sometimes if your file is not viewable try to enable CORS.
