import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export class WhiteboardOptions {
  color = '#000000';
  backgroundColor = '#ffffff';
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

  // Observable string streams
  eraseSvgMethodCalled$ = this.eraseSvgMethodCallSource.asObservable();
  saveSvgMethodCalled$ = this.saveSvgMethodCallSource.asObservable();

  // Service message commands
  erase() {
    this.eraseSvgMethodCallSource.next();
  }
  save() {
    this.saveSvgMethodCallSource.next();
  }
}
