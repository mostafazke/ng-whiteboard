import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ExamplesRoutingModule } from './examples-routing.module';
import { ExamplesComponent } from './examples.component';
import { SharedModule } from '../shared/shared.module';
import { NgWhiteboardModule } from 'ng-whiteboard';
import { BasicComponent } from '../examples/basic/basic.component';
import { MinimalComponent } from '../examples/minimal/minimal.component';
import { ComprehensiveComponent } from '../examples/comprehensive/comprehensive.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DragInputDirective } from './comprehensive/directives/drag-input.directive';
import { DragInputCursorPipe } from './comprehensive/pipes/drag-input-cursor.pipe';
import { FindDashArrayPipe } from './comprehensive/pipes/find-dash-array.pipe';

@NgModule({
  declarations: [
    ExamplesComponent,
    BasicComponent,
    MinimalComponent,
    ComprehensiveComponent,
    DragInputDirective,
    DragInputCursorPipe,
    FindDashArrayPipe,
  ],
  imports: [CommonModule, ExamplesRoutingModule, NgWhiteboardModule, ReactiveFormsModule, SharedModule],
  exports: [ComprehensiveComponent],
})
export class ExamplesModule {}
