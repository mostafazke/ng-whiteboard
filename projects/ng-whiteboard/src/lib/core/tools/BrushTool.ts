import { BrushShape } from '../shapes/brushShape';
import { PointerInfo, ShapeType } from '../types/types';
import { Util } from '../utils/util';
import { BaseTool } from './baseTool';

export class BrushTool extends BaseTool {
  override type = ShapeType.Brush as const;

  shape = new BrushShape();

  onPointerDown(info: PointerInfo) {
    const { currentPoint, currentStyle } = this.app;
    const index = this.getNextIndex();

    const newShape = this.shape.create({
      index,
      point: [...currentPoint, info.pressure || 0.5],
      style: { ...currentStyle },
    });

    this.app.createShape(newShape);
  }

  onPointerMove(info: PointerInfo) {
    // this.tempDraw.push(this._calculateXAndY(info.point));
    // const outlinePoints = getStroke(this.tempDraw, getStrokeOptions);
    // const pathData = Utils.getSvgPathFromStroke(outlinePoints);
    // this.tempElement.value = pathData;


    // if (this.status === Status.Creating) {
    //   this.app.updateSession();
    // }
  }

  onPointerUp(info: PointerInfo) {
    // if (this.status === Status.Creating) {
    //   this.app.completeSession();
    // }
    // this.setStatus(Status.Idle);
  }
}

// import { DataService } from '../data/data.service';
// import { BrushShape } from '../shapes/BrushShape';
// import { BaseTool } from './baseTool';

// export class BrushTool extends BaseTool {
//   private currentShape: BrushShape | null = null;
//   private shapes: BrushShape[] = [];
//   private currentPointIndex = -1;

//   constructor(private dataService: DataService) {
//     super();
//   }

//   override onStart(info: PointerEvent): void {
//     // Initialize a new shape when drawing starts.
//     this.currentShape = new BrushShape(this.shapes.length, [{ x: info.clientX, y: info.clientY }]);
//     this.shapes.push(this.currentShape);
//     this.currentPointIndex = 0;

//     // Notify the data service about the new shape.
//     this.dataService.addShape(this.currentShape);

//     console.log(info);
//   }
//   override onMove(info: PointerEvent) {
//     if (this.currentShape) {
//       // Add a new point to the current freehand shape.
//       this.currentShape.addPoint(info.clientX, info.clientY);
//       this.currentPointIndex = this.currentShape.points.length - 1;

//       // Notify the data service to update the shape.
//       this.dataService.updateShape(this.currentShape);
//     }
//     console.log(info);
//   }
//   override onEnd(info: PointerEvent) {
//     if (this.currentShape) {
//       // Finish the current freehand shape and reset the currentShape variable.
//       this.currentShape = null;
//       this.currentPointIndex = -1;
//     }
//     console.log(info);
//   }
//   // Add a method to remove the last added point from the current shape.
//   removeLastPoint() {
//     if (this.currentShape && this.currentPointIndex >= 0) {
//       this.currentShape.removePoint(this.currentPointIndex);
//       this.currentPointIndex--;
//       this.dataService.updateShape(this.currentShape);
//     }
//   }
// }
