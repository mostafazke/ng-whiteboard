import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class SvgService {
  isPointing = false;
  private pointerDownSubject = new Subject<PointerEvent>();
  private pointerMoveSubject = new Subject<PointerEvent>();
  private pointerUpSubject = new Subject<PointerEvent>();

  onPointerDown(info: PointerEvent) {
    this.isPointing = true;
    this.pointerDownSubject.next(info);
  }

  onPointerMove(info: PointerEvent) {
    if (this.isPointing) {
      this.pointerMoveSubject.next(info);
    }
  }

  onPointerUp(info: PointerEvent) {
    this.isPointing = false;
    this.pointerUpSubject.next(info);
  }

  getPointerDown$() {
    return this.pointerDownSubject.asObservable();
  }

  getPointerMove$() {
    return this.pointerMoveSubject.asObservable();
  }

  getPointerUp$() {
    return this.pointerUpSubject.asObservable();
  }
}
