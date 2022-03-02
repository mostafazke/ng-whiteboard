import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgWhiteboardComponent } from './ng-whiteboard.component';

@NgModule({
  declarations: [NgWhiteboardComponent],
  imports: [BrowserModule],
  exports: [NgWhiteboardComponent],
})
export class NgWhiteboardModule {}
