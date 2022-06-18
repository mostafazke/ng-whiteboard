import { NgWhiteboardService, FormatType, formatTypes } from 'projects/ng-whiteboard/src/public-api';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ToolsEnum } from '../../../ng-whiteboard/src/lib/models/tools.enum';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild('fileInput', { static: false }) private fileInput: ElementRef<any>;

  color = '#333';
  backgroundColor = '#eee';
  isSizeActive = false;
  isSaveActive = false;
  isToolsActive = false;
  formatType = FormatType;
  size = 5;
  isActive = false;
  drawingEnabled = false;

  data = [
    {
      elementName: 'RECT',
      elementOptions: {
        fill: '#333',
        stroke: '#333',
        size: 5,
        color: '#333333',
        fontFamily: 'arial',
        lineJoin: 'round',
        lineCap: 'round',
        strokeWidth: 2,
        dasharray: 'none',
        strokeOpacity: 100,
        rotation: 0,
        opacity: 100,
      },
      id: 'element_RECT_439',
      width: 232,
      height: 115,
      x: 0,
      y: 0,
      rx: 0,
      x1: 107,
      y1: 138,
      x2: 107,
      y2: 138,
    },
  ];

  event: PointerEvent;

  toolsEnum = ToolsEnum;
  selectedTool = ToolsEnum.SELECT;
  constructor(private toastr: ToastrService, private whiteboardService: NgWhiteboardService) {}

  onInit() {
    this.toastr.success('Init!');
  }
  onClear() {
    this.toastr.success('Clear!');
  }
  onUndo() {
    this.toastr.success('Undo!');
  }
  onRedo() {
    this.toastr.success('Redo!');
  }
  onSave(img: any) {
    this.toastr.success('Save!');

    // Copy to clipboard
    const cb = navigator.clipboard;
    if (cb) {
      cb.writeText(img);
    }
  }
  onImageAded() {
    this.toastr.success('ImageAded!');
  }

  erase() {
    this.whiteboardService.erase();
  }
  setSize(size) {
    this.size = size;
    this.isSizeActive = false;
  }
  save(type: formatTypes) {
    this.whiteboardService.save(type);
    this.isSaveActive = false;
  }
  undo() {
    this.whiteboardService.undo();
  }
  redo() {
    this.whiteboardService.redo();
  }
  toggle(selectedTool: ToolsEnum) {
    this.selectedTool = selectedTool;
    this.isToolsActive = false;
  }
  handleClick(event: PointerEvent) {
    this.event = event;
    // if (!this.drawingEnabled) {
    //   this.fileInput.nativeElement.click();
    // }
  }
  addImage(fileInput) {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      console.log(reader.result);

      if (this.event) {
        this.whiteboardService.addImage(reader.result, this.event.x, this.event.y);
      } else {
        this.whiteboardService.addImage(reader.result);
      }
      fileInput.value = '';
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  }

  addText(text) {
    if (this.event) {
      this.whiteboardService.addText(text, this.event.x, this.event.y);
    } else {
      this.whiteboardService.addText(text);
    }
  }
}
