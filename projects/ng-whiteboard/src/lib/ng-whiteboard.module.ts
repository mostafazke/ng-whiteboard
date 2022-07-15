import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgWhiteboardComponent } from './ng-whiteboard.component';

@NgModule({
  imports: [CommonModule],
  declarations: [NgWhiteboardComponent],
  exports: [NgWhiteboardComponent],
})
export class NgWhiteboardModule {}
