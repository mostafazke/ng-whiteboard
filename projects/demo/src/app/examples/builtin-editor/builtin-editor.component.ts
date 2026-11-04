import { Component, OnInit } from '@angular/core';
import { NgWhiteboardComponent, WhiteboardConfig, WhiteboardElement } from 'ng-whiteboard';

const PERSIST_KEY = 'whiteboardBuiltinEditorData';

@Component({
  selector: 'app-builtin-editor',
  template: `<div class="builtin-editor">
    <ng-whiteboard [data]="data" [config]="config" (dataChange)="onDataChange($event)"></ng-whiteboard>
  </div>`,
  styles: `
    .builtin-editor {
      position: relative;
      height: 640px;
    }
  `,
  standalone: true,
  imports: [NgWhiteboardComponent],
})
export class BuiltinEditorComponent implements OnInit {
  data: WhiteboardElement[] = [];
  config: Partial<WhiteboardConfig> = {
    fullScreen: true,
  };

  ngOnInit() {
    const savedData = localStorage.getItem(PERSIST_KEY);
    if (savedData) {
      this.data = JSON.parse(savedData);
    }
  }

  onDataChange(data: WhiteboardElement[]) {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(data));
  }
}
