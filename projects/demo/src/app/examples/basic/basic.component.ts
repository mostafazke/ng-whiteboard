import { Component } from '@angular/core';
import { FormatType, NgWhiteboardService, ToolType } from 'ng-whiteboard';
import data from './data';

@Component({
  selector: 'app-basic-component',
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.scss'],
  providers: [NgWhiteboardService],
})
export class BasicComponent {
  data = data;
  color = '#333';
  backgroundColor = '#fff';
  size = 5;
  isSizeActive = false;
  isSaveActive = false;
  formatType = FormatType;
  toolType = ToolType;

  constructor(private whiteboardService: NgWhiteboardService) {}

  onSave(img: string) {
    // Copy to clipboard
    const cb = navigator.clipboard;
    if (cb) {
      cb.writeText(img);
    }
  }

  erase() {
    this.whiteboardService.clear();
  }

  setSize(size: number) {
    this.size = size;
    this.isSizeActive = false;
  }

  save(type: FormatType) {
    this.whiteboardService.save(type);
    this.isSaveActive = false;
  }

  undo() {
    this.whiteboardService.undo();
  }

  redo() {
    this.whiteboardService.redo();
  }

  addImage(fileInput: EventTarget | null) {
    if (fileInput) {
      const files = (fileInput as HTMLInputElement).files;
      if (files) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent) => {
          const image = (e.target as FileReader).result;
          this.whiteboardService.addImage(image as string);
        };
        reader.readAsDataURL(files[0]);
      }
    }
  }

  setColor(event: Event) {
    const target = event.target as HTMLInputElement;
    this.color = target.value;
  }

  setBackgroundColor(event: Event) {
    const target = event.target as HTMLInputElement;
    this.backgroundColor = target.value;
  }
}
