import { Component } from '@angular/core';
import { NgWhiteboardService } from 'ng-whiteboard';

@Component({
  selector: 'app-examples',
  templateUrl: './examples.component.html',
  styleUrls: ['./examples.component.scss'],
  providers: [NgWhiteboardService],
})
export class ExamplesComponent {
  constructor(private _whiteboardService: NgWhiteboardService) {}
}
