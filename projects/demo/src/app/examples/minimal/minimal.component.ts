import { Component, OnInit } from '@angular/core';
import { NgWhiteboardComponent, WhiteboardConfig, WhiteboardElement } from 'ng-whiteboard';
const PersistKey = 'whiteboardData';

@Component({
  selector: 'app-minimal-component',
  template: `<div class="demo">
    <ng-whiteboard
      [data]="data"
      [config]="config"
      [showEditor]="false"
      (dataChange)="onDataChange($event)"
    ></ng-whiteboard>
  </div>`,
  standalone: true,
  imports: [NgWhiteboardComponent],
})
export class MinimalComponent implements OnInit {
  data: WhiteboardElement[] = [];
  config: Partial<WhiteboardConfig> = {
    fullScreen: true,
  };
  ngOnInit() {
    const savedData = localStorage.getItem(PersistKey);
    if (savedData) {
      this.data = JSON.parse(savedData);
    }
  }

  onDataChange(data: WhiteboardElement[]) {
    localStorage.setItem(PersistKey, JSON.stringify(data));
  }
}
