import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../shared/components/header/header.component';
import { MinimalComponent } from './minimal/minimal.component';
import { OutOfTheBoxComponent } from './out-of-the-box/out-of-the-box.component';
import { ComprehensiveComponent } from './comprehensive/comprehensive.component';
import { CustomShapesComponent } from './custom-shapes/custom-shapes.component';

@Component({
  selector: 'app-examples',
  templateUrl: './examples.component.html',
  styleUrls: ['./examples.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
    HeaderComponent,
    MinimalComponent,
    OutOfTheBoxComponent,
    ComprehensiveComponent,
    CustomShapesComponent,
  ],
})
export class ExamplesComponent {}
