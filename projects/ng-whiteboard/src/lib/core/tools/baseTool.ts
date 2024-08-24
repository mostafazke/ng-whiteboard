// export interface TLPointerInfo<T extends string = string> {
//   target: T;
//   pointerId: number;
//   origin: number[];
//   point: number[];
//   delta: number[];
//   pressure: number;
//   shiftKey: boolean;
//   ctrlKey: boolean;
//   metaKey: boolean;
//   altKey: boolean;
// }
// export type TLPointerInfoHandler = (info: TLPointerInfo<string>, e: PointerInfo) => void;

import { DataService } from '../data/data.service';
import { PointerInfo, ToolType } from '../types/types';

export enum Status {
  Idle = 'idle',
  Creating = 'creating',
  Pinching = 'pinching',
}

export abstract class BaseTool<T extends string = any> {
  type: ToolType = 'select' as const;
  previous?: ToolType;

  status: Status | T = Status.Idle;

  constructor(public app: DataService) {}

  protected readonly setStatus = (status: Status | T) => {
    this.status = status as Status | T;
    // this.app.setStatus(this.status as string)
  };

  onEnter() {
    // this.setStatus(Status.Idle);
  }

  onExit() {
    // this.setStatus(Status.Idle);
  }

  onCancel() {
    // if (this.status === Status.Idle) {
    //   this.app.selectTool('select');
    // } else {
    //   this.setStatus(Status.Idle);
    // }
    // this.app.cancelSession();
  }

  getNextIndex() {
    const { shapes } = this.app;

    return shapes.length === 0 ? 1 : shapes.sort((a, b) => b.childIndex - a.childIndex)[0].childIndex + 1;
  }

  /* --------------------- Camera --------------------- */

  onPinchStart() {
    // this.app.cancelSession();
    // this.setStatus(Status.Pinching);
  }

  onPinchEnd() {
    // if (Utils.isMobileSafari()) {
    //   this.app.undoSelect();
    // }
    // this.setStatus(Status.Idle);
  }

  onPinch = (info: { point: number[] }, e: PointerInfo) => {
    // if (this.status !== 'pinching') return;
    // this.app.pinchZoom(info.point, info.delta, info.delta[2]);
    // this.onPointerMove?.(info, e as unknown as React.PointerInfo);
  };

  /* ---------------------- Keys ---------------------- */

  onKeyDown = (key: string) => {
    if (key === 'Escape') {
      this.onCancel();
      return;
    }

    /* noop */
    if (key === 'Meta' || key === 'Control' || key === 'Alt') {
      // this.app.updateSession();
      return;
    }
  };

  onKeyUp = (key: string) => {
    /* noop */
    if (key === 'Meta' || key === 'Control' || key === 'Alt') {
      //   this.app.updateSession();
      return;
    }
  };

  /* --------------------- Pointer -------------------- */
  abstract onPointerDown(info: PointerInfo): void;

  abstract onPointerMove(info: PointerInfo): void;

  abstract onPointerUp(info: PointerInfo): void;
}
