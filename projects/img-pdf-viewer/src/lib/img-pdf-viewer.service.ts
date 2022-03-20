import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ImgPdfViewerService {
  constructor() {}
  downloadBlob(blob: string, fileName: string) {
    var a = document.createElement('a');
    a.download = fileName;
    a.href = blob;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  downloadResource(url: string, fileName: string = '') {
    if (url) {
      if (!fileName) fileName = url.split('/').pop();
      fetch(url, {
        headers: new Headers({
          Origin: location.origin,
        }),
        mode: 'cors',
      })
        .then((response) => response.blob())
        .then((blob) => {
          let blobUrl = window.URL.createObjectURL(blob);
          this.downloadBlob(blobUrl, fileName);
        })
        .catch((e) => {
          console.log('something went wrong');
        });
    }
  }

  fileTypeChecker(file: string) {
    const imgTagSupportableType = [
      '.png',
      '.jpeg',
      '.gif',
      '.apng',
      '.svg',
      '.bmp',
      '.ico',
      '.jpg',
      '.img',
    ];

    if (!file) {
      return '';
    } else {
      file = file.toLowerCase();
      if (file.includes('.pdf')) {
        return 'pdf';
      } else if (imgTagSupportableType.some((el) => file.includes(el))) {
        return 'image';
      } else {
        return '';
      }
    }
  }

  openBlobInNewWindow(url: string) {
    if (url) {
      fetch(url, {
        headers: new Headers({
          Origin: location.origin,
        }),
        mode: 'cors',
      })
        .then((response) => response.blob())
        .then((blob) => {
          let blobUrl = window.URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        })
        .catch((e) => {
          console.log('Something went wrong');
        });
    }
  }
}
