import { Component } from '@angular/core';
import { NgWhiteboardService } from 'projects/ng-whiteboard/src/public-api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  color = '#333333';
  backgroundColor = '#eee';
  // backgroundColor = '#ffef00';
  backgroundImage: string | ArrayBuffer = '';
  size = '5px';
  isActive = false;
  constructor(private whiteboardService: NgWhiteboardService) {}
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
  apply(fileInput) {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      this.backgroundImage = reader.result;
    };

    if (file) {
      reader.readAsDataURL(file);
    } else {
      this.backgroundImage = '';
      // https://cdn.pixabay.com/photo/2017/01/03/02/07/vine-1948358_960_720.png
    }
  }
}
