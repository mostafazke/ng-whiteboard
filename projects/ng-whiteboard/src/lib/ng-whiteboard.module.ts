import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgWhiteboardComponent } from './ng-whiteboard.component';
import { SvgDirective } from './core/svg/svg.directive';
import { ResizeHandlerDirective } from './core/directives/resize-handler.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [NgWhiteboardComponent, SvgDirective, ResizeHandlerDirective],
  exports: [NgWhiteboardComponent],
})
export class NgWhiteboardModule {}
