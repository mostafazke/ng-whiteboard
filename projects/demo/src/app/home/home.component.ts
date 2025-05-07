import { Component } from '@angular/core';
import { NgWhiteboardComponent } from 'ng-whiteboard';
import { HeaderComponent } from '../shared/components/header/header.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [HeaderComponent, NgWhiteboardComponent],

})
export class HomeComponent {}
