import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../shared/components/header/header.component';
import { MinimalComponent } from './minimal/minimal.component';
import { BasicComponent } from './basic/basic.component';
import { ComprehensiveComponent } from './comprehensive/comprehensive.component';

@Component({
  selector: 'app-examples',
  templateUrl: './examples.component.html',
  styleUrls: ['./examples.component.scss'],
  standalone: true,
  imports: [RouterLink, HeaderComponent, MinimalComponent, BasicComponent, ComprehensiveComponent],
})
export class ExamplesComponent {}
