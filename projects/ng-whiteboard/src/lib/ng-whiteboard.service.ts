import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { FormatType, formatTypes } from './ng-whiteboard.types';
import { IAddImage } from './models/add-image.model';
import { IAddText } from './models/add-text.model';

@Injectable({
  providedIn: 'root',
})
export class NgWhiteboardService {
  // Observable string sources
  private eraseSvgMethodCallSource = new Subject<any>();
  private saveSvgMethodCallSource = new Subject<{ name: string; format: formatTypes }>();
  private undoSvgMethodCallSource = new Subject<any>();
  private redoSvgMethodCallSource = new Subject<any>();
  private addImageMethodCallSource = new Subject<IAddImage>();
  private addTextMethodCallSource = new Subject<IAddText>();
  private writeTextMethodCallSource = new Subject<any>();

  // Observable string streams
  eraseSvgMethodCalled$ = this.eraseSvgMethodCallSource.asObservable();
  saveSvgMethodCalled$ = this.saveSvgMethodCallSource.asObservable();
  undoSvgMethodCalled$ = this.undoSvgMethodCallSource.asObservable();
  redoSvgMethodCalled$ = this.redoSvgMethodCallSource.asObservable();
  addImageMethodCalled$ = this.addImageMethodCallSource.asObservable();
  addTextMethodCalled$ = this.addTextMethodCallSource.asObservable();
  writeTextMethodCalled$ = this.writeTextMethodCallSource.asObservable();

  // Service message commands
  public erase(): void {
    this.eraseSvgMethodCallSource.next();
  }
  public save(format: formatTypes = FormatType.Base64, name: string = 'New board'): void {
    this.saveSvgMethodCallSource.next({ name, format });
  }
  public undo(): void {
    this.undoSvgMethodCallSource.next();
  }
  public redo(): void {
    this.redoSvgMethodCallSource.next();
  }
  public addImage(image: string | ArrayBuffer, x?: number, y?: number): void {
    this.addImageMethodCallSource.next({ image, x, y });
  }
  public addText(text: string, x?: number, y?: number): void {
    this.addTextMethodCallSource.next({ text, x, y });
  }
  public writeText(): void {
    this.writeTextMethodCallSource.next();
  }
}
