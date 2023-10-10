import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgWhiteboardComponent } from './ng-whiteboard.component';
import { SvgDirective } from './core/svg/svg.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [NgWhiteboardComponent, SvgDirective],
  exports: [NgWhiteboardComponent],
})
export class NgWhiteboardModule {}
