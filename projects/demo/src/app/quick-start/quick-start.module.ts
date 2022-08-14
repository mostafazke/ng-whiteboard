import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuickStartRoutingModule } from './quick-start-routing.module';
import { QuickStartComponent } from './quick-start.component';
import { SharedModule } from '../shared/shared.module';
import { NgWhiteboardModule } from 'ng-whiteboard';


@NgModule({
  declarations: [
    QuickStartComponent
  ],
  imports: [
    CommonModule,
    QuickStartRoutingModule,
    NgWhiteboardModule,
    SharedModule
  ]
})
export class QuickStartModule { }
