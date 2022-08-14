import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DocumentationRoutingModule } from './documentation-routing.module';
import { DocumentationComponent } from './documentation.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    DocumentationComponent
  ],
  imports: [
    CommonModule,
    DocumentationRoutingModule,
    SharedModule
  ]
})
export class DocumentationModule { }
