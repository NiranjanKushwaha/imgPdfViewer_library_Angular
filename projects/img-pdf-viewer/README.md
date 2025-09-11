# Angular Document Viewer

A modern, feature-rich Angular library for viewing PDF documents and images with advanced capabilities. Built with Angular 8-19+ compatibility and uses PDF.js directly for optimal performance.

## Features

### 🚀 Core Features
- **PDF & Image Support** - View PDFs and images (PNG, JPEG, GIF, WebP, SVG, BMP, TIFF)
- **Advanced PDF Rendering** - Direct PDF.js integration with text selection and annotations
- **Zoom & Pan** - Smooth zoom (50%-300%) with pan support for images
- **Rotation** - Rotate documents in 90° increments
- **Page Navigation** - Navigate through multi-page PDFs
- **Fullscreen Mode** - Native fullscreen support
- **Download Support** - Download documents with proper filename handling
- **CORS Handling** - Automatic CORS proxy fallback for external documents

### 🎨 UI/UX Features
- **Modern Design** - Clean, responsive interface with dark mode support
- **Accessibility** - Full ARIA support and keyboard navigation
- **Mobile Optimized** - Touch-friendly controls and responsive design
- **Loading States** - Beautiful loading animations and progress indicators
- **Error Handling** - Comprehensive error states with retry options
- **Customizable** - Extensive configuration options

### 🔧 Technical Features
- **Angular 8-19+ Compatible** - Works with any Angular version from 8 to 19+
- **TypeScript** - Full TypeScript support with comprehensive type definitions
- **Memory Management** - Automatic blob URL cleanup to prevent memory leaks
- **Performance** - Optimized rendering with lazy loading and efficient updates
- **Error Boundaries** - Graceful error handling with fallback options

## Installation

```bash
npm install img-pdf-viewer
```

### Peer Dependencies

The library requires these peer dependencies:

```bash
npm install @ng-bootstrap/ng-bootstrap
```

## Quick Start

### 1. Import the Module

```typescript
import { NgModule } from '@angular/core';
import { ImgPdfViewerModule } from 'img-pdf-viewer';

@NgModule({
  imports: [
    ImgPdfViewerModule
  ],
})
export class AppModule {}
```

### 2. Basic Usage

```html
<ngx-imgPdf-viewer
  [documentUrl]="documentUrl"
  [title]="'My Document'"
  (onLoad)="onDocumentLoad($event)"
  (onError)="onDocumentError($event)">
</ngx-imgPdf-viewer>
```

```typescript
export class AppComponent {
  documentUrl = 'https://example.com/document.pdf';

  onDocumentLoad(info: DocumentInfo) {
    console.log('Document loaded:', info);
  }

  onDocumentError(error: string) {
    console.error('Document error:', error);
  }
}
```

## Advanced Usage

### Configuration Options

```typescript
import { DocumentViewerConfig } from 'img-pdf-viewer';

export class AppComponent {
  config: DocumentViewerConfig = {
    showToolbar: true,
    showDownload: true,
    showZoom: true,
    showRotation: true,
    showFullscreen: true,
    showInNewTab: true,
    showPagination: true,
    showViewModeToggle: true,
    height: '600px',
    width: '100%',
    embedded: false,
    initialZoom: 100,
    maxZoom: 300,
    minZoom: 50,
    viewMode: 'single', // 'single' | 'continuous'
    modalSize: 'lg',
    className: 'custom-viewer'
  };
}
```

### Complete Example

```html
<ngx-imgPdf-viewer
  [documentUrl]="documentUrl"
  [documentType]="documentType"
  [title]="documentTitle"
  [config]="config"
  (onLoad)="onDocumentLoad($event)"
  (onError)="onDocumentError($event)"
  (onZoomChange)="onZoomChange($event)"
  (onRotationChange)="onRotationChange($event)"
  (onPageChange)="onPageChange($event)">
</ngx-imgPdf-viewer>
```

```typescript
export class AppComponent {
  documentUrl = 'https://example.com/document.pdf';
  documentType: DocumentType = 'pdf';
  documentTitle = 'Important Document';
  
  config: DocumentViewerConfig = {
    showToolbar: true,
    showDownload: true,
    showZoom: true,
    showRotation: true,
    showFullscreen: true,
    height: '600px',
    width: '100%',
    initialZoom: 100,
    viewMode: 'single'
  };

  onDocumentLoad(info: DocumentInfo) {
    console.log('Document loaded:', info);
  }

  onDocumentError(error: string) {
    console.error('Document error:', error);
  }

  onZoomChange(zoom: number) {
    console.log('Zoom changed to:', zoom);
  }

  onRotationChange(rotation: number) {
    console.log('Rotation changed to:', rotation);
  }

  onPageChange(page: number) {
    console.log('Page changed to:', page);
  }
}
```

## API Reference

### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `documentUrl` | `string` | **required** | URL of the document to display |
| `documentType` | `DocumentType` | `undefined` | Type of document (auto-detected if not provided) |
| `title` | `string` | `undefined` | Custom title for the document |
| `config` | `DocumentViewerConfig` | `{}` | Configuration object |

### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `onLoad` | `EventEmitter<DocumentInfo>` | Emitted when document loads successfully |
| `onError` | `EventEmitter<string>` | Emitted when document fails to load |
| `onZoomChange` | `EventEmitter<number>` | Emitted when zoom level changes |
| `onRotationChange` | `EventEmitter<number>` | Emitted when rotation changes |
| `onPageChange` | `EventEmitter<number>` | Emitted when page changes (PDF only) |

### Types

```typescript
type DocumentType = 'pdf' | 'image' | 'unknown';

interface DocumentInfo {
  type: DocumentType;
  totalPages?: number;
  fileName?: string;
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

interface DocumentViewerConfig {
  showToolbar?: boolean;
  showDownload?: boolean;
  showZoom?: boolean;
  showRotation?: boolean;
  showFullscreen?: boolean;
  showInNewTab?: boolean;
  showPagination?: boolean;
  showViewModeToggle?: boolean;
  height?: string;
  width?: string;
  embedded?: boolean;
  initialZoom?: number;
  maxZoom?: number;
  minZoom?: number;
  viewMode?: 'single' | 'continuous';
  modalSize?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Migration from v0.x

The library maintains backward compatibility with the old API while providing modern features:

### Old API (Still Supported)
```html
<ngx-imgPdf-viewer
  [documentURL]="url"
  [docPreviewConfig]="config">
</ngx-imgPdf-viewer>
```

### New API (Recommended)
```html
<ngx-imgPdf-viewer
  [documentUrl]="url"
  [config]="config">
</ngx-imgPdf-viewer>
```

## Troubleshooting

### PDF Not Loading
1. Check if the PDF URL is accessible
2. Verify CORS headers allow your domain
3. Check console for specific error messages
4. Try the fallback browser viewer

### Images Not Displaying
1. Verify the image URL is valid
2. Check if the image format is supported
3. Ensure CORS headers are properly set

### Performance Issues
1. Use appropriate image sizes
2. Consider lazy loading for large documents
3. Monitor memory usage with blob URLs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
