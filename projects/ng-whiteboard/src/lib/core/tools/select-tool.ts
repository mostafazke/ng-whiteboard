import { DATA_ID, ITEM_PREFIX, SELECTOR_BOX, SELECTOR_GRIP_RESIZE, SELECTOR_GRIP_ROTATE } from '../constants';
import { getElementUtil } from '../elements/element.utils';
import { Direction, Point, ToolType, WhiteboardElement } from '../types';
import { getMouseTarget } from '../utils/dom';
import {
  calculateAngle,
  findNearestSnapAngle,
  getRotatedDirection,
  getSnappedOffset,
  isElementInSelectionBox,
  normalizeAngle,
} from '../utils/geometry';

import { BaseTool } from './base-tool';

export enum SelectAction {
  None,
  Select,
  Move,
  Resize,
  Rotate,
  BoxSelect,
}

export class SelectTool extends BaseTool {
  type = ToolType.Select;
  private currentAction = SelectAction.None;
  private startPoint: Point | null = null;
  private currentHandle: Direction | null = null;
  private rotateStartAngle: number | null = null;
  private rotateStartTransform: string | null = null;
  private selectionCenter: Point | null = null;

  private readonly SNAP_THRESHOLD = 5;
  private readonly ROTATION_SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

  getCurrentAction(): SelectAction {
    return this.currentAction;
  }

  getStartPoint(): Point | null {
    return this.startPoint;
  }

  getCurrentHandle(): Direction | null {
    return this.currentHandle;
  }

  override handlePointerDown(event: PointerEvent): void {
    const target = getMouseTarget(event);

    const targetId = target?.id ?? '';

    this.startPoint = this.getPointerPosition(event);

    if (targetId.includes(ITEM_PREFIX)) {
      const elementId = target?.getAttribute(DATA_ID) ?? null;
      this.handleElementSelect(elementId, event.shiftKey);
      this.currentAction = SelectAction.Move;
    } else if (targetId.includes(SELECTOR_GRIP_RESIZE)) {
      this.currentHandle = this.getResizeDirection(targetId);
      this.currentAction = SelectAction.Resize;
    } else if (targetId.includes(SELECTOR_GRIP_ROTATE)) {
      this.initializeRotation(event);
      this.currentAction = SelectAction.Rotate;
    } else if (targetId.includes(SELECTOR_BOX)) {
      this.currentAction = SelectAction.Move;
    } else {
      this.initializeBoxSelect(event);
      this.currentAction = SelectAction.BoxSelect;
    }
  }

  override handlePointerMove(event: PointerEvent): void {
    if (!this.startPoint) return;

    const currentPoint = this.getPointerPosition(event);

    switch (this.currentAction) {
      case SelectAction.Move:
        this.handleMove(currentPoint, event.shiftKey);
        break;
      case SelectAction.Resize:
        this.handleResize(currentPoint, event.shiftKey);
        break;
      case SelectAction.Rotate:
        this.handleRotate(currentPoint, event.shiftKey);
        break;
      case SelectAction.BoxSelect:
        this.handleBoxSelect(currentPoint, event.shiftKey);
        break;
    }
  }

  override handlePointerUp(): void {
    if (this.currentAction === SelectAction.BoxSelect) {
      this.dataService.clearSelectionBox();
    }

    this.currentAction = SelectAction.None;
    this.startPoint = null;
    this.currentHandle = null;
    this.rotateStartAngle = null;
    this.rotateStartTransform = null;
    this.selectionCenter = null;
  }

  private handleElementSelect(elementId: string | null, isMultiSelect: boolean): void {
    if (!elementId) return;

    const element = this.dataService.getElementById(elementId);
    if (!element) return;

    if (isMultiSelect) {
      this.dataService.toggleSelection(element);
    } else {
      this.dataService.selectElements([element]);
    }
  }

  private handleMove(currentPoint: Point, shiftKey: boolean): void {
    if (!this.startPoint) return;

    const dx = currentPoint.x - this.startPoint.x;
    const dy = currentPoint.y - this.startPoint.y;

    let snappedX = dx;
    let snappedY = dy;

    if (shiftKey) {
      const snapped = getSnappedOffset(dx, dy);
      snappedX = snapped.x;
      snappedY = snapped.y;
    }

    this.dataService.transformSelectedElements((elements) =>
      elements.map((element) => ({
        ...element,
        x: element.x + snappedX,
        y: element.y + snappedY,
      }))
    );

    this.startPoint = currentPoint;
  }

  private handleResize(currentPoint: Point, shiftKey: boolean): void {
    if (!this.startPoint || this.currentHandle === null) return;
    const handle = this.currentHandle;
    const selectedElements = this.dataService.getSelectedElements();
    if (!selectedElements.length) return;

    const dx = currentPoint.x - this.startPoint.x;
    const dy = currentPoint.y - this.startPoint.y;

    let snappedX = dx;
    let snappedY = dy;

    if (shiftKey) {
      const snapped = getSnappedOffset(dx, dy);
      snappedX = snapped.x;
      snappedY = snapped.y;
    }

    this.dataService.transformSelectedElements((elements) =>
      elements.map((element) => {
        const elementUtil = getElementUtil(element.type);
        return elementUtil.resize(element, handle, snappedX, snappedY);
      })
    );

    this.startPoint = currentPoint;
  }

  private handleRotate(currentPoint: Point, shiftKey: boolean): void {
    if (!this.startPoint || !this.selectionCenter || this.rotateStartAngle === null) return;
    const currentAngle = calculateAngle(this.selectionCenter, currentPoint);

    const selectedElements = this.dataService.getSelectedElements();
    if (selectedElements.length === 0) return;

    let deltaAngle = currentAngle - this.rotateStartAngle;

    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    const baseRotation = selectedElements[0].rotation || 0;
    let newTotalRotation = baseRotation + deltaAngle;

    if (shiftKey) {
      newTotalRotation = findNearestSnapAngle(newTotalRotation, this.ROTATION_SNAP_ANGLES, this.SNAP_THRESHOLD);
    }

    this.dataService.transformSelectedElements((elements) =>
      elements.map((element) => ({
        ...element,
        rotation: normalizeAngle(newTotalRotation),
      }))
    );

    this.rotateStartAngle = currentAngle;
  }

  private handleBoxSelect(currentPoint: Point, shiftKey: boolean): void {
    if (!this.startPoint) return;

    const selectionBox = {
      x: Math.min(this.startPoint.x, currentPoint.x),
      y: Math.min(this.startPoint.y, currentPoint.y),
      width: Math.abs(currentPoint.x - this.startPoint.x),
      height: Math.abs(currentPoint.y - this.startPoint.y),
      visible: true,
    };

    this.dataService.setSelectionBox(selectionBox);

    const allElements = this.dataService.getData();
    const elementsInBox = allElements.filter((element) => this.checkElementInSelectionBox(element, selectionBox));

    this.dataService.selectElements(elementsInBox, shiftKey);
    this.dataService.updateBoundingBox();
  }

  private initializeBoxSelect(event: PointerEvent): void {
    if (!event.shiftKey) {
      this.dataService.clearSelection();
    }

    const { x, y } = this.getPointerPosition(event);

    const selectionBox = {
      x,
      y,
      width: 0,
      height: 0,
      visible: true,
    };

    this.dataService.setSelectionBox(selectionBox);
  }

  private initializeRotation(event: PointerEvent): void {
    const bbox = this.dataService.getBoundingBox();
    if (!bbox) return;

    this.selectionCenter = {
      x: bbox.x + bbox.width / 2,
      y: bbox.y + bbox.height / 2,
    };

    const point = this.getPointerPosition(event);

    this.rotateStartAngle = calculateAngle(this.selectionCenter, point);
  }

  private checkElementInSelectionBox(
    element: WhiteboardElement,
    selectionBox: { x: number; y: number; width: number; height: number }
  ): boolean {
    const elementUtil = getElementUtil(element.type);
    const bounds = elementUtil.getBounds(element);
    return isElementInSelectionBox(bounds, selectionBox);
  }

  private getResizeDirection(handleId: string): Direction {
    const staticDirectionStr = handleId.split('_')[2];

    let staticDirection: Direction;
    if (Object.values(Direction).includes(staticDirectionStr as Direction)) {
      staticDirection = staticDirectionStr as Direction;
    } else {
      return Direction.N;
    }

    const selectedElements = this.dataService.getSelectedElements();
    if (selectedElements.length === 0) return staticDirection;

    const rotation = selectedElements[0].rotation || 0;

    return getRotatedDirection(staticDirection, rotation);
  }

  override onActivate(): void {
    this.dataService.clearSelection();
  }

  override onDeactivate(): void {
    this.dataService.clearSelection();
  }
}
