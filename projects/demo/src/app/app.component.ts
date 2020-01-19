import { Component } from '@angular/core';
import { NgWhiteboardService } from 'projects/ng-whiteboard/src/public-api';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  color = '#333333';
  backgroundColor = '#eee';
  size = '5px';
  isActive = false;

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
  onSave() {
    this.toastr.success('Save!');
  }
  onImageAded() {
    this.toastr.success('ImageAded!');
  }

  erase() {
    this.whiteboardService.erase();
  }
  setSize(size) {
    this.size = size;
    this.isActive = false;
  }
  save() {
    this.whiteboardService.save();
  }
  undo() {
    this.whiteboardService.undo();
  }
  redo() {
    this.whiteboardService.redo();
  }
  addImage(fileInput) {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      this.whiteboardService.addImage(reader.result);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  }
}
