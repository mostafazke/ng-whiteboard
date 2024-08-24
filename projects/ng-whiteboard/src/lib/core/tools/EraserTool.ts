import { PointerInfo } from '../types/types';
import Vec from '../utils/vec';
import { BaseTool } from './baseTool';
export const DEAD_ZONE = 3;

enum Status {
  Idle = 'idle',
  Pointing = 'pointing',
  Erasing = 'erasing',
}

export class EraseTool extends BaseTool {
  override type = 'erase' as const;

  override status: Status = Status.Idle;
  /* ----------------- Event Handlers ----------------- */

  onPointerDown() {
    this.setStatus(Status.Pointing);
  }

  onPointerMove(info: PointerInfo) {
    console.log(info.origin, info.point);
    switch (this.status) {
      case Status.Pointing: {
        if (Vec.dist(info.origin, info.point) > DEAD_ZONE) {
          // this.app.startSession(SessionType.Erase)
          // this.app.updateSession()
          this.setStatus(Status.Erasing);
        }
        break;
      }
      case Status.Erasing: {
        // this.app.updateSession()
      }
    }
  }

  onPointerUp() {
    switch (this.status) {
      case Status.Pointing: {
        // const shapeIdsAtPoint = this.app.shapes
        // .filter((shape) => !shape.isLocked)
        // .filter((shape) =>
        //   this.app.getShapeUtil(shape).hitTestPoint(shape, this.app.currentPoint)
        // )
        // .flatMap((shape) => (shape.children ? [shape.id, ...shape.children] : shape.id))

        // this.app.delete(shapeIdsAtPoint)

        break;
      }
      case Status.Erasing: {
        // this.app.completeSession()

        if (this.previous) {
          this.app.selectTool(this.previous);
        } else {
          this.app.selectTool('select');
        }
      }
    }

    this.setStatus(Status.Idle);
  }

  override onCancel() {
    if (this.status === Status.Idle) {
      if (this.previous) {
        this.app.selectTool(this.previous);
      } else {
        this.app.selectTool('select');
      }
    } else {
      this.setStatus(Status.Idle);
    }

    // this.app.cancelSession()
  }
}
