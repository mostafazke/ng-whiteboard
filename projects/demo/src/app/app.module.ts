import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { NgWhiteboardModule } from 'projects/ng-whiteboard/src/public-api';
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, BrowserAnimationsModule, NgWhiteboardModule, ToastrModule.forRoot()],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
