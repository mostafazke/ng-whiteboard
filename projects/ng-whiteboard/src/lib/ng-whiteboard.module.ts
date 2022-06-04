import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgWhiteboardComponent } from './ng-whiteboard.component';
import { WhiteboardEditorComponent } from './whiteboard-editor/whiteboard-editor.component';

@NgModule({
  declarations: [NgWhiteboardComponent, WhiteboardEditorComponent],
  imports: [BrowserModule, FormsModule],
  exports: [NgWhiteboardComponent, WhiteboardEditorComponent],
})
export class NgWhiteboardModule {}
