import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { FormatType, formatTypes, IAddImage } from './models';

@Injectable({
  providedIn: 'root',
})
export class NgWhiteboardService {
  // Observable string sources
  private eraseMethodCallSource = new Subject<void>();
  private saveMethodCallSource = new Subject<{ name: string; format: formatTypes }>();
  private undoMethodCallSource = new Subject<void>();
  private redoMethodCallSource = new Subject<void>();
  private addImageMethodCallSource = new Subject<IAddImage>();

  // Observable string streams
  eraseMethodCalled$ = this.eraseMethodCallSource.asObservable();
  saveMethodCalled$ = this.saveMethodCallSource.asObservable();
  undoMethodCalled$ = this.undoMethodCallSource.asObservable();
  redoMethodCalled$ = this.redoMethodCallSource.asObservable();
  addImageMethodCalled$ = this.addImageMethodCallSource.asObservable();

  // Service message commands
  public erase(): void {
    this.eraseMethodCallSource.next();
  }
  public save(format: formatTypes = FormatType.Base64, name = 'New board'): void {
    this.saveMethodCallSource.next({ name, format });
  }
  public undo(): void {
    this.undoMethodCallSource.next();
  }
  public redo(): void {
    this.redoMethodCallSource.next();
  }
  public addImage(image: string | ArrayBuffer, x?: number, y?: number): void {
    this.addImageMethodCallSource.next({ image, x, y });
  }
}
