import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LiveAppRoutingModule } from './live-app-routing.module';
import { LiveAppComponent } from './live-app.component';
import { NgWhiteboardModule } from 'ng-whiteboard';
import { NgxColorsModule } from 'ngx-colors';


@NgModule({
  declarations: [
    LiveAppComponent
  ],
  imports: [
    CommonModule,
    LiveAppRoutingModule,
    NgWhiteboardModule,
    NgxColorsModule
  ]
})
export class LiveAppModule { }
