import { Component } from '@angular/core';
import { NgWhiteboardService } from 'projects/ng-whiteboard/src/public-api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  color = '#333333';
  size = '5px';
  isActive = false;
  constructor(private _whiteboardService: NgWhiteboardService) {}
  erase() {
    this._whiteboardService.erase();
  }
  setSize(size) {
    this.size = size;
    this.isActive = false;
  }
  save() {
    this._whiteboardService.save();
  }
}
