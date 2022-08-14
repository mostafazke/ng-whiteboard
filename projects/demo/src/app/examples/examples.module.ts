import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ExamplesRoutingModule } from './examples-routing.module';
import { ExamplesComponent } from './examples.component';
import { SharedModule } from '../shared/shared.module';
import { NgWhiteboardModule } from 'ng-whiteboard';
import { BasicComponent } from '../examples/basic/basic.component';
import { MinimalComponent } from '../examples/minimal/minimal.component';
import { ComprehensiveComponent } from '../examples/comprehensive/comprehensive.component';

@NgModule({
  declarations: [ExamplesComponent, BasicComponent, MinimalComponent, ComprehensiveComponent],
  imports: [CommonModule, ExamplesRoutingModule, NgWhiteboardModule, SharedModule],
})
export class ExamplesModule {}
