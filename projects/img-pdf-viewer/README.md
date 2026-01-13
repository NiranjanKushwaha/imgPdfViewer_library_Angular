# Angular Image & PDF Viewer

[![npm version](https://img.shields.io/npm/v/img-pdf-viewer.svg)](https://www.npmjs.com/package/img-pdf-viewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/img-pdf-viewer.svg)](https://www.npmjs.com/package/img-pdf-viewer)
[![StackBlitz](https://img.shields.io/badge/StackBlitz-Live%20Demo-orange.svg)](https://stackblitz.com/edit/img-pdf-viewer)

A **premium, highly customizable Angular library** for viewing PDF documents and images. Built with performance in mind using Mozilla's `pdf.js` engine, it offers a seamless "Google Drive-like" preview experience for your Angular applications.

---

## ✨ Features at a Glance

| Feature            | Description                                                                   |
| :----------------- | :---------------------------------------------------------------------------- |
| **📄 Dual Mode**   | Smartly switches between **PDF** and **Image** viewing (PNG, JPG, WEBP, SVG). |
| **🔍 Smart Zoom**  | Mouse-wheel zoom, pinch-to-zoom, and preset zoom levels (50% - 300%).         |
| **🔄 Rotation**    | Rotate documents 90° clockwise or counter-clockwise on the fly.               |
| **🛠️ Smart Proxy** | Industrial-grade strategy: direct access first, then "smart" proxy fallback.  |
| **🧩 Heuristics**  | Detects doc types without extensions by analyzing URL path patterns.          |
| **📱 Responsive**  | Logic that adapts to any screen size, mobile or desktop.                      |
| **🖥️ Fullscreen**  | Native immersive mode for distraction-free reading.                           |

---

## 📦 Installation

Install the library and its peer dependencies:

```bash
npm install img-pdf-viewer
```

---

## 🚀 Quick Start Guide

[![StackBlitz](https://img.shields.io/badge/StackBlitz-Live%20Demo-orange.svg)](https://stackblitz.com/edit/img-pdf-viewer)

Follow these 4 simple steps to integrate the viewer into your app.

### 1️⃣ Import the Module

In your `app.module.ts`:

```typescript
import { ImgPdfViewerModule } from "img-pdf-viewer";

@NgModule({
  imports: [
    ImgPdfViewerModule,
    // ...
  ],
})
export class AppModule {}
```

### 2️⃣ Define Configuration

In your component (e.g., `app.component.ts`), set up the document URL and optional config:

```typescript
import { DocumentViewerConfig } from "img-pdf-viewer";

export class AppComponent {
  // Your PDF or Image URL (can be from an API or local asset)
  docUrl = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf";

  // Customize the look and feel
  config: DocumentViewerConfig = {
    showToolbar: true,
    showZoom: true,
    showRotation: true,
    showDownload: true,
    showFullscreen: true,
    initialZoom: 100,
    viewMode: "single", // Options: 'single' | 'continuous'
  };
}
```

### 3️⃣ Add to Template

In your HTML (`app.component.html`), drop in the component:

```html
<div class="viewer-host">
  <ngx-imgPdf-viewer [documentUrl]="docUrl" [config]="config" [title]="'Project Documentation'"> </ngx-imgPdf-viewer>
</div>
```

### 4️⃣ Set Container Height

> [!WARNING]
> The viewer takes the height of its parent. If the parent has `0px` height, the viewer will be invisible!

In `app.component.css`:

```css
.viewer-host {
  height: 100vh; /* Make it full screen */
  width: 100%;
  border: 1px solid #ddd; /* Optional: adds a nice border */
}
```

---

## 🛠️ Advanced Configuration

The `DocumentViewerConfig` interface allows you to granularly control the UI:

| Property         | Type                       | Default     | Description                                                         |
| :--------------- | :------------------------- | :---------- | :------------------------------------------------------------------ |
| `showToolbar`    | `boolean`                  | `true`      | Show or hide the top toolbar.                                       |
| `showZoom`       | `boolean`                  | `true`      | Enable zoom-in and zoom-out buttons.                                |
| `showRotation`   | `boolean`                  | `true`      | Enable rotation controls.                                           |
| `showDownload`   | `boolean`                  | `true`      | Allow users to download the source file.                            |
| `showFullscreen` | `boolean`                  | `true`      | Enable the fullscreen toggle button.                                |
| `viewMode`       | `'single' \| 'continuous'` | `'single'`  | **Single**: Page-by-page. **Continuous**: Scroll through all pages. |
| `initialZoom`    | `number`                   | `100`       | Start percentage for zoom.                                          |
| `proxyUrl`       | `string`                   | `undefined` | Custom proxy to bypass CORS (e.g., `https://corsproxy.io/?`).       |
| `fallbackType`   | `'pdf' \| 'image'`         | `undefined` | Type to use if auto-detection fails for extensionless URLs.         |
| `height`         | `string`                   | `'100vh'`   | Height of the viewer container.                                     |

---

## 🤝 Contribution

We love open source! If you'd like to contribute:

1.  Fork the repo.
2.  Create a branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Open a Pull Request.

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/NiranjanKushwaha">Niranjan Kushwaha</a>
</p>
