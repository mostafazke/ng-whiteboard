import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export class WhiteboardOptions {
  color = '#000000';
  backgroundColor = '#ffffff';
  backgroundImage = '';
  size = '5px';
  linejoin: 'miter' | 'round' | 'bevel' | 'miter-clip' | 'arcs' = 'round';
  linecap: 'butt' | 'square' | 'round' = 'round';
}

@Injectable({
  providedIn: 'root'
})
export class NgWhiteboardService {
  // Observable string sources
  private eraseSvgMethodCallSource = new Subject<any>();
  private saveSvgMethodCallSource = new Subject<any>();
  private undoSvgMethodCallSource = new Subject<any>();
  private redoSvgMethodCallSource = new Subject<any>();

  // Observable string streams
  eraseSvgMethodCalled$ = this.eraseSvgMethodCallSource.asObservable();
  saveSvgMethodCalled$ = this.saveSvgMethodCallSource.asObservable();
  undoSvgMethodCalled$ = this.undoSvgMethodCallSource.asObservable();
  redoSvgMethodCalled$ = this.redoSvgMethodCallSource.asObservable();

  // Service message commands
  public erase(): void {
    this.eraseSvgMethodCallSource.next();
  }
  public save(): void {
    this.saveSvgMethodCallSource.next();
  }
  public undo(): void {
    this.undoSvgMethodCallSource.next();
  }
  public redo(): void {
    this.redoSvgMethodCallSource.next();
  }
}
