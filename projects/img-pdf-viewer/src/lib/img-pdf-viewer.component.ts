import {
  Component,
  ElementRef,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CommonConstant } from './Common.constant';
import { DocPreviewConfig } from './docConfig';
import { ImgPdfViewerService } from './img-pdf-viewer.service';

@Component({
  selector: 'lib-imgPdf-viewer',
  templateUrl: './img-pdf-viewer.component.html',
  styleUrls: ['./img-pdf-viewer.component.css'],
})
export class ImgPdfViewerComponent implements OnInit {
  private _docPreviewConfig: DocPreviewConfig;
  private _documentURL: string;
  private _fileName: string;
  get docPreviewConfig(): DocPreviewConfig {
    return this._docPreviewConfig;
  }
  @Input() set docPreviewConfig(value: DocPreviewConfig) {
    if (value !== this._docPreviewConfig) {
      this._docPreviewConfig = value;
    }
  }

  get documentURL(): string {
    return this._documentURL;
  }

  @Input() set documentURL(value: string) {
    if (value !== this._documentURL) {
      this._documentURL = value;
    }
  }

  get fileName(): string {
    return this._fileName;
  }

  @Input() set fileName(value: string) {
    if (value !== this._fileName) {
      this._fileName = value;
    }
  }

  documentType: string;
  contentType: string;
  zoom_in: number = 1;
  rotation: number = 0;
  modalRef: NgbModalRef;
  isArchieved: boolean = false;
  pdfType: string = CommonConstant.PDFTYPE;
  imageType: string = CommonConstant.IMAGETYPE;
  // isModalView:boolean=false;

  @ViewChild('view_img') view_img: ElementRef;
  @Output() inputModelRef: NgbModalRef;
  // @Output() isClosed = new EventEmitter<boolean>();

  constructor(
    private _helper: ImgPdfViewerService,
    private modalService: NgbModal
  ) {}

  ngOnChanges(): void {
    if (this.documentType) {
      this.zoom_in = 1;
      this.rotation = 0;
      this.documentTypeDeterminer();
      this.defaultDocumentIconsSetting();
    }
  }

  ngOnInit(): void {
    this.defaultDocumentIconsSetting();
    this.documentTypeDeterminer();
  }

  defaultDocumentIconsSetting() {
    const sampleDocPreviewConfig = {
      zoomIn: true,
      zoomOut: true,
      rotate: true,
      pageIndicator: true,
      download: true,
      openModal: true,
      close: true,
      docScreenWidth: '100%',
      modalSize: 'lg',
      customStyle: '',
    };
    if (!this.docPreviewConfig) {
      this.docPreviewConfig = sampleDocPreviewConfig;
    } else {
      Object.keys(sampleDocPreviewConfig).forEach((key) => {
        if (
          this.docPreviewConfig[key] === undefined &&
          typeof sampleDocPreviewConfig[key] === CommonConstant.BOOLEAN
        ) {
          this.docPreviewConfig[key] = true;
        }
        if (
          this.docPreviewConfig[key] === undefined &&
          typeof this.docPreviewConfig[key] !== CommonConstant.BOOLEAN
        ) {
          // this.docPreviewConfig[key] = false;
          this.docPreviewConfig[key] = sampleDocPreviewConfig[key];
        }
      });
    }
  }

  async documentTypeDeterminer() {
    this.documentType = '';
    const fileTypeOrURL = this.documentURL || this.fileName;
    const fileTpe = this._helper.fileTypeChecker(fileTypeOrURL);
    if (fileTpe) {
      if (fileTpe === this.pdfType) {
        this.documentType = this.pdfType;
        await this.archivedFileTypeChecker(this.documentURL);
      }
      if (fileTpe === this.imageType) {
        this.documentType = this.imageType;
        await this.archivedFileTypeChecker(this.documentURL);
      }
    } else {
      await this.archivedFileTypeChecker(this.documentURL);
      this.fileTypeCheckerOnContentType();
    }
  }

  fileTypeCheckerOnContentType() {
    if (this.contentType !== undefined || this.contentType !== '') {
      if (this.contentType.split('/').includes(this.pdfType)) {
        this.documentType = this.pdfType;
      } else if (this.contentType.split('/').includes(this.imageType)) {
        this.documentType = this.imageType;
      } else {
        this.documentType = '';
        this.isArchieved = true;
      }
    }
  }

  async archivedFileTypeChecker(url: string) {
    this.contentType = '';
    let isBlobViewed = false;
    if (url) {
      let response = await fetch(url);
      this.contentType = response.headers.get('Content-Type');
      if (this.contentType === null || this.contentType.includes('text/html')) {
        this.isArchieved = true;
        if (!isBlobViewed && response.status === 200) {
          isBlobViewed = true;
          this.closeModal();
          // this._commonService.getFileFromURLInNewTab(url);
          this._helper.openBlobInNewWindow(url);
        }
      }
    }
  }

  closeModal() {
    this.inputModelRef && this.inputModelRef.close();
    // this.isClosed.emit(true);
    // this.isModalView = false;
  }

  downloadFile() {
    this._helper.downloadResource(this.documentURL, this.fileName);
  }
  upDateZoom(zoomType: string) {
    if (this.documentType === this.pdfType) {
      switch (zoomType) {
        case 'decrement':
          if (this.zoom_in) {
            this.zoom_in = this.zoom_in - 0.5;
          }
          break;
        case 'increment':
          this.zoom_in = this.zoom_in + 0.5;
          break;

        default:
          this.zoom_in = 1;
          break;
      }
    }
    if (this.documentType === this.imageType) {
      const currWidth = this.view_img.nativeElement.clientWidth;
      switch (zoomType) {
        case 'decrement':
          if (this.zoom_in) {
            this.zoom_in = this.zoom_in - 0.5;
            this.view_img.nativeElement.style.width = currWidth - 150 + 'px';
          }
          break;
        case 'increment':
          this.zoom_in = this.zoom_in + 0.5;
          this.view_img.nativeElement.style.width = currWidth + 150 + 'px';
          break;

        default:
          this.zoom_in = 1;
          break;
      }
    }
  }

  rotateDoc() {
    if (this.documentType === this.pdfType) {
      this.rotation += 90;
    }
    if (this.documentType === this.imageType) {
      this.rotation += 90;
      this.view_img.nativeElement.style.webkitTransform =
        'rotate(' + this.rotation + 'deg)';
      this.view_img.nativeElement.style.mozTransform =
        'rotate(' + this.rotation + 'deg)';
      this.view_img.nativeElement.style.msTransform =
        'rotate(' + this.rotation + 'deg)';
      this.view_img.nativeElement.style.oTransform =
        'rotate(' + this.rotation + 'deg)';
      this.view_img.nativeElement.style.transform =
        'rotate(' + this.rotation + 'deg)';
    }
  }

  viewInFullScreen() {
    // this.isModalView = true;
    this.modalRef = this.modalService.open(ImgPdfViewerComponent, {
      size: this.docPreviewConfig.modalSize || CommonConstant.LARGEMODAL,
      keyboard: false,
      backdrop: false,
      windowClass: this.docPreviewConfig?.customStyle,
    });
    this.modalRef.componentInstance.documentURL = this.documentURL;
    this.modalRef.componentInstance.inputModelRef = this.modalRef;
    this.modalRef.componentInstance.fileName = this.fileName;
    this.modalRef.componentInstance.docPreviewConfig = {
      openModal: false,
    };
  }
}
