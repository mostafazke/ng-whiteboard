import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LiveAppRoutingModule } from './live-app-routing.module';
import { LiveAppComponent } from './live-app.component';
import { NgWhiteboardModule } from 'ng-whiteboard';
import { NgxColorsModule } from 'ngx-colors';
import { ExamplesModule } from '../examples/examples.module';

@NgModule({
  declarations: [LiveAppComponent],
  imports: [CommonModule, LiveAppRoutingModule, NgWhiteboardModule, NgxColorsModule, ExamplesModule],
})
export class LiveAppModule {}
