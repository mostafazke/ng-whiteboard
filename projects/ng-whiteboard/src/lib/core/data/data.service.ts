import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { EraseTool } from '../tools/EraserTool';
import { Bounds, PointerInfo, Shape, ShapeType, ToolType } from '../types/types';
import { BaseTool } from '../tools/baseTool';
import Vec from '../utils/vec';
import { BrushTool } from '../tools/BrushTool';

@Injectable()
export class DataService {
  shapes: Shape[] = [];
  // tools:ToolType = {
  //   erase: new EraseTool(this),
  // }

  tools = {
    select: new EraseTool(this),
    erase: new EraseTool(this),
    [ShapeType.Brush]: new BrushTool(this),
    // [TDShapeType.Text]: new TextTool(this),
    // [TDShapeType.Ellipse]: new EllipseTool(this),
    // [TDShapeType.Rectangle]: new RectangleTool(this),
    // [TDShapeType.Arrow]: new ArrowTool(this),
    // [TDShapeType.Sticky]: new StickyTool(this),
  };
  currentTool: BaseTool = this.tools.select;

  camera = {
    point: [0, 0],
    zoom: 1,
  };

  bounds: Bounds = {
    minX: 0,
    minY: 0,
    maxX: 640,
    maxY: 480,
    width: 640,
    height: 480,
  };

  originPoint = [0, 0];
  currentPoint = [0, 0];
  previousPoint = [0, 0];
  currentStyle = {
    fill: 'black',
    stroke: 'black',
    strokeWidth: 2,
    opacity: 1,
  };
  private shapesSubject = new Subject<Shape[]>();

  // Method to get the list of shapes as an observable.
  getShapes(): Observable<Shape[]> {
    return this.shapesSubject.asObservable();
  }

  selectTool = (type: ToolType): this => {
    // if (this.readOnly || this.session) return this

    const tool = this.tools[type];

    if (tool === this.currentTool) {
      // this.patchState({
      //   appState: {
      //     isToolLocked: false,
      //   },
      // })
      return this;
    }

    this.currentTool.onExit();
    // tool.previous = this.currentTool.type
    this.currentTool = tool;
    this.currentTool.onEnter();

    // return this.patchState(
    //   {
    //     appState: {
    //       activeTool: type,
    //       isToolLocked: false,
    //     },
    //   },
    //   `selected_tool:${type}`
    // )

    return this;
  };

  onPointerDown(info: PointerInfo) {
    this.originPoint = this.calculatePoint(info.point);
    this.updatePoints(info);
    this.currentTool.onPointerDown(info);
  }

  onPointerMove(info: PointerInfo) {
    this.updatePoints(info);
    this.currentTool.onPointerMove?.(info);

    // Move this to an emitted event
    // this.onChange?.(this, {
    //   ...users[userId],
    //   point: this.getPagePoint(info.point),
    // })
  }
  onPointerUp = (info: PointerInfo) => {
    this.updatePoints(info);
    this.currentTool.onPointerUp(info);
  };

  private updatePoints(info: PointerInfo) {
    this.previousPoint = this.currentPoint;
    this.currentPoint = [...this.calculatePoint(info.point), info.pressure];
  }

  calculatePoint = (point: number[]): number[] => {
    return Vec.sub(Vec.div(point, this.camera.zoom), this.camera.point);
  };

  updateBounds = (bounds: Bounds) => {
    this.bounds = { ...bounds };
  };

  createShape(shape: Shape) {
    console.log(shape);
    this.shapes.push(shape);
    this.shapesSubject.next(this.shapes);
  }
  updateShape(shape: Shape) {
    console.log(shape);
    const index = this.shapes.findIndex((shape) => shape.id === shape.id);
    if (index !== -1) {
      this.shapes[index] = shape;
      this.shapesSubject.next(this.shapes);
    }
  }

  /**
   loadDocument
select
selectAll
selectNone
delete
deleteAll
deletePage
changePage
cut
copy
paste
copyJson
copySvg
undo
redo
zoomIn
zoomOut
zoomToContent
zoomToSelection
zoomToFit
zoomTo
resetZoom
setCamera
resetCamera
align
distribute
stretch
nudge
duplicate
flipHorizontal
flipVertical
rotate
style
group
ungroup
createShapes
updateShapes
updateDocument
updateUsers
removeUser
setSetting
selectTool
cancel
   */
}
