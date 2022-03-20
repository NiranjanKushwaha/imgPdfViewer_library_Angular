import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ImgPdfViewerModule } from 'projects/img-pdf-viewer/src/public-api';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, NgbModule, ImgPdfViewerModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
