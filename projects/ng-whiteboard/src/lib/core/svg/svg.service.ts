import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PointerInfo } from '../types/types';
import { DataService } from '../data/data.service';
import { Util } from '../utils/util';
import Vec from '../utils/vec';

@Injectable()
export class SvgService {
  activePointer?: number;
  pointer?: PointerInfo;

  isPointing = false;
  private pointerDownSubject = new Subject<PointerInfo>();
  private pointerMoveSubject = new Subject<PointerInfo>();
  private pointerUpSubject = new Subject<PointerInfo>();

  constructor(private dataService: DataService) {}

  onPointerDown(info: PointerInfo) {
    this.isPointing = true;
    // this.pointerDownSubject.next(info);
    this.dataService.onPointerDown(info);
  }

  onPointerMove(info: PointerInfo) {
    this.dataService.onPointerMove(info);
    if (this.isPointing) {
      // this.pointerMoveSubject.next(info);

    }
  }

  onPointerUp(info: PointerInfo) {
    this.isPointing = false;
    // this.pointerUpSubject.next(info);
    this.dataService.onPointerUp(info);
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

  getPointerInfo(e: PointerEvent): PointerInfo {
    const { shiftKey, ctrlKey, altKey } = e;

    const prev = this.pointer;

    const point = Util.getPoint(e, this.dataService.bounds);
    const delta = prev?.point ? Vec.sub(point, prev.point) : [0, 0];

    this.activePointer = e.pointerId;

    const info: PointerInfo = {
      target: e.currentTarget,
      pointerId: e.pointerId,
      origin: point,
      point,
      delta,
      pressure: Util.getPressure(e),
      shiftKey,
      ctrlKey,
      altKey,
    };

    this.pointer = info;

    return info;
  }
}
