import { DATA_ID, ITEM_PREFIX, SELECTOR_BOX, SELECTOR_GRIP_RESIZE, SELECTOR_GRIP_ROTATE } from '../constants';
import { getElementUtil } from '../elements/element.utils';
import { Direction, Point, PointerInfo, ToolType, WhiteboardElement } from '../types';
import { getMouseTarget } from '../utils/dom';
import {
  calculateAngle,
  getRotatedDirection,
  getSnappedOffset,
  isElementInSelectionBox,
  normalizeAngle,
  rotatePointAroundCenter,
} from '../utils/geometry';
import { getElementBounds } from '../utils/dom/element';

import { BaseTool } from './base-tool';
import { CursorType } from '../types/cursors';

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
  override baseCursor = CursorType.Default;
  private currentAction = SelectAction.None;
  private startPoint: Point | null = null;
  private currentHandle: Direction | null = null;
  private rotateStartAngle: number | null = null;
  private selectionCenter: Point | null = null;
  private initialBoundingBox: { x: number; y: number; width: number; height: number } | null = null;
  private initialElementRotations: Map<string, number> = new Map();
  private initialElementStates: Map<string, WhiteboardElement> = new Map();
  private rafId: number | null = null;
  private pendingPointerEvent: PointerInfo | null = null;

  getCurrentAction(): SelectAction {
    return this.currentAction;
  }

  getStartPoint(): Point | null {
    return this.startPoint;
  }

  getCurrentHandle(): Direction | null {
    return this.currentHandle;
  }

  override onDeactivate(): void {
    this.apiService.clearSelection();
  }

  override handlePointerDown(event: PointerInfo): void {
    const target = getMouseTarget(event);

    const targetId = target?.id ?? '';

    this.startPoint = this.getPointerPosition(event);

    if (targetId.includes(ITEM_PREFIX)) {
      const elementId = target?.getAttribute(DATA_ID) ?? null;
      this.handleElementSelect(elementId, event.shiftKey);
      this.currentAction = SelectAction.Move;
    } else if (targetId.includes(SELECTOR_GRIP_RESIZE)) {
      this.currentHandle = this.getResizeDirection(targetId);
      this.initializeResize();
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

  override handlePointerMove(event: PointerInfo): void {
    this.pendingPointerEvent = event;

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;

        if (!this.pendingPointerEvent || !this.startPoint) {
          return;
        }

        const event = this.pendingPointerEvent;
        const currentPoint = this.getPointerPosition(event);

        switch (this.currentAction) {
          case SelectAction.Move:
            this.handleMove(currentPoint, event.shiftKey);
            break;
          case SelectAction.Resize:
            this.handleResize(currentPoint, event.shiftKey);
            break;
          case SelectAction.Rotate:
            this.handleRotate(currentPoint, event.ctrlKey);
            break;
          case SelectAction.BoxSelect:
            this.handleBoxSelect(currentPoint, event.shiftKey);
            break;
        }
      });
    }
  }

  override handlePointerUp(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingPointerEvent = null;

    if (this.currentAction === SelectAction.BoxSelect) {
      this.apiService.clearSelectionBox();
    }

    if (this.currentAction === SelectAction.Rotate) {
      this.initialElementRotations.clear();
      this.apiService.updateBoundingBox();
    }

    this.initialElementStates.clear();

    this.currentAction = SelectAction.None;
    this.startPoint = null;
    this.currentHandle = null;
    this.rotateStartAngle = null;
    this.selectionCenter = null;
    this.initialBoundingBox = null;
  }

  private handleElementSelect(elementId: string | null, isMultiSelect: boolean): void {
    if (!elementId) return;

    const element = this.apiService.getElementById(elementId);
    if (!element) return;

    if (element.locked) {
      return;
    }

    if (isMultiSelect) {
      this.apiService.toggleSelection(element);
    } else {
      this.apiService.selectElements([element]);
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

    this.apiService.transformSelectedElements((elements) =>
      elements.map((element) => {
        if (element.locked) {
          return element;
        }
        return {
          ...element,
          x: element.x + snappedX,
          y: element.y + snappedY,
        };
      })
    );

    this.startPoint = currentPoint;
  }

  private handleResize(currentPoint: Point, shiftKey: boolean): void {
    if (!this.startPoint || this.currentHandle === null || !this.initialBoundingBox) return;

    const handle = this.currentHandle;
    const selectedElements = this.apiService.getSelectedElements();
    if (!selectedElements.length) return;

    if (selectedElements.length === 1) {
      const element = selectedElements[0];

      const initialElement = this.initialElementStates.get(element.id);
      if (!initialElement) return;

      const dx = currentPoint.x - this.startPoint.x;
      const dy = currentPoint.y - this.startPoint.y;

      let localDx = dx;
      let localDy = dy;

      if (element.rotation && element.rotation !== 0) {
        const angleRad = (-element.rotation * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        localDx = dx * cos - dy * sin;
        localDy = dx * sin + dy * cos;
      }

      let snappedX = localDx;
      let snappedY = localDy;

      if (shiftKey) {
        const snapped = getSnappedOffset(localDx, localDy);
        snappedX = snapped.x;
        snappedY = snapped.y;
      }

      this.apiService.transformSelectedElements((elements) =>
        elements.map((el) => {
          if (el.locked) {
            return el;
          }

          const initial = this.initialElementStates.get(el.id);
          if (!initial) return el;

          let anchorPointBefore: Point | null = null;
          if (initial.rotation && initial.rotation !== 0) {
            const initialAny = initial as unknown as Record<string, unknown>;
            const width = (initialAny['width'] as number) || (initialAny['rx'] as number) * 2 || 0;
            const height = (initialAny['height'] as number) || (initialAny['ry'] as number) * 2 || 0;

            let anchorLocalX = 0,
              anchorLocalY = 0;

            if (handle.includes(Direction.N)) anchorLocalY = height;
            else if (handle.includes(Direction.S)) anchorLocalY = 0;
            else anchorLocalY = height / 2;

            if (handle.includes(Direction.W)) anchorLocalX = width;
            else if (handle.includes(Direction.E)) anchorLocalX = 0;
            else anchorLocalX = width / 2;

            const angleRad = (initial.rotation * Math.PI) / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);

            anchorPointBefore = {
              x: initial.x + (anchorLocalX * cos - anchorLocalY * sin),
              y: initial.y + (anchorLocalX * sin + anchorLocalY * cos),
            };
          }

          const elementUtil = getElementUtil(initial.type);
          const resized = elementUtil.resize({ ...initial }, handle, snappedX, snappedY);

          if (initial.rotation && initial.rotation !== 0 && anchorPointBefore) {
            const resizedAny = resized as unknown as Record<string, unknown>;
            const width = (resizedAny['width'] as number) || (resizedAny['rx'] as number) * 2 || 0;
            const height = (resizedAny['height'] as number) || (resizedAny['ry'] as number) * 2 || 0;

            let anchorLocalX = 0,
              anchorLocalY = 0;

            if (handle.includes(Direction.N)) anchorLocalY = height;
            else if (handle.includes(Direction.S)) anchorLocalY = 0;
            else anchorLocalY = height / 2;

            if (handle.includes(Direction.W)) anchorLocalX = width;
            else if (handle.includes(Direction.E)) anchorLocalX = 0;
            else anchorLocalX = width / 2;

            const rotation = resized.rotation ?? 0;
            const angleRad = (rotation * Math.PI) / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);

            const anchorPointAfter = {
              x: resized.x + (anchorLocalX * cos - anchorLocalY * sin),
              y: resized.y + (anchorLocalX * sin + anchorLocalY * cos),
            };

            resized.x += anchorPointBefore.x - anchorPointAfter.x;
            resized.y += anchorPointBefore.y - anchorPointAfter.y;
          }

          return resized;
        })
      );

      return;
    }

    const initialBounds = this.initialBoundingBox;
    const dx = currentPoint.x - this.startPoint.x;
    const dy = currentPoint.y - this.startPoint.y;

    let anchorX: number, anchorY: number;
    let newWidth: number, newHeight: number;

    switch (handle) {
      case Direction.N:
        anchorX = initialBounds.x;
        anchorY = initialBounds.y + initialBounds.height;
        newWidth = initialBounds.width;
        newHeight = initialBounds.height - dy;
        break;
      case Direction.S:
        anchorX = initialBounds.x;
        anchorY = initialBounds.y;
        newWidth = initialBounds.width;
        newHeight = initialBounds.height + dy;
        break;
      case Direction.E:
        anchorX = initialBounds.x;
        anchorY = initialBounds.y;
        newWidth = initialBounds.width + dx;
        newHeight = initialBounds.height;
        break;
      case Direction.W:
        anchorX = initialBounds.x + initialBounds.width;
        anchorY = initialBounds.y;
        newWidth = initialBounds.width - dx;
        newHeight = initialBounds.height;
        break;
      case Direction.NE:
        anchorX = initialBounds.x;
        anchorY = initialBounds.y + initialBounds.height;
        newWidth = initialBounds.width + dx;
        newHeight = initialBounds.height - dy;
        break;
      case Direction.NW:
        anchorX = initialBounds.x + initialBounds.width;
        anchorY = initialBounds.y + initialBounds.height;
        newWidth = initialBounds.width - dx;
        newHeight = initialBounds.height - dy;
        break;
      case Direction.SE:
        anchorX = initialBounds.x;
        anchorY = initialBounds.y;
        newWidth = initialBounds.width + dx;
        newHeight = initialBounds.height + dy;
        break;
      case Direction.SW:
        anchorX = initialBounds.x + initialBounds.width;
        anchorY = initialBounds.y;
        newWidth = initialBounds.width - dx;
        newHeight = initialBounds.height + dy;
        break;
      default:
        return;
    }

    if (newWidth <= 0 || newHeight <= 0) return;

    const scaleX = newWidth / initialBounds.width;
    const scaleY = newHeight / initialBounds.height;

    let finalScaleX = scaleX;
    let finalScaleY = scaleY;
    if (shiftKey) {
      const uniformScale = Math.min(Math.abs(scaleX), Math.abs(scaleY)) * Math.sign(scaleX) * Math.sign(scaleY);
      finalScaleX = uniformScale;
      finalScaleY = uniformScale;
    }

    this.apiService.transformSelectedElements((elements) =>
      elements.map((element) => {
        if (element.locked) {
          return element;
        }

        const initialElement = this.initialElementStates.get(element.id);
        if (!initialElement) {
          return element;
        }

        const relX = initialElement.x - anchorX;
        const relY = initialElement.y - anchorY;

        const newRelX = relX * finalScaleX;
        const newRelY = relY * finalScaleY;

        const scaledX = anchorX + newRelX;
        const scaledY = anchorY + newRelY;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: any = {
          ...element,
          x: scaledX,
          y: scaledY,
        };

        if ('width' in initialElement && initialElement.width !== undefined) {
          updates.width = initialElement.width * Math.abs(finalScaleX);
        }
        if ('height' in initialElement && initialElement.height !== undefined) {
          updates.height = initialElement.height * Math.abs(finalScaleY);
        }

        if (initialElement.style?.strokeWidth) {
          const avgScale = (Math.abs(finalScaleX) + Math.abs(finalScaleY)) / 2;
          updates.style = {
            ...element.style,
            strokeWidth: initialElement.style.strokeWidth * avgScale,
          };
        }

        updates.rotation = initialElement.rotation;

        return updates as WhiteboardElement;
      })
    );
  }

  private handleRotate(currentPoint: Point, ctrlKey: boolean): void {
    if (!this.startPoint || !this.selectionCenter || this.rotateStartAngle === null) return;

    const selectedElements = this.apiService.getSelectedElements();
    if (selectedElements.length === 0) return;

    const currentAngle = calculateAngle(this.selectionCenter, currentPoint);

    let deltaAngle = currentAngle - this.rotateStartAngle;

    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    if (ctrlKey) {
      deltaAngle = Math.round(deltaAngle / 15) * 15;
    }

    if (selectedElements.length > 1) {
      const selectionCenter = this.selectionCenter;

      this.apiService.transformSelectedElements((elements) =>
        elements.map((element) => {
          if (element.locked) {
            return element;
          }

          const initialElement = this.initialElementStates.get(element.id);
          if (!initialElement) {
            return element;
          }

          const initialRotation = this.initialElementRotations.get(element.id) ?? initialElement.rotation ?? 0;

          const elementUtil = getElementUtil(initialElement.type);
          const bounds = elementUtil.getBounds(initialElement);

          const elementCenter = {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2,
          };

          const newCenter = rotatePointAroundCenter(elementCenter, selectionCenter, deltaAngle);

          const centerOffsetX = elementCenter.x - initialElement.x;
          const centerOffsetY = elementCenter.y - initialElement.y;

          const newX = newCenter.x - centerOffsetX;
          const newY = newCenter.y - centerOffsetY;

          const newRotation = normalizeAngle(initialRotation + deltaAngle);

          return {
            ...element,
            x: newX,
            y: newY,
            rotation: newRotation,
          };
        })
      );
    } else {
      const element = selectedElements[0];
      const initialRotation = this.initialElementRotations.get(element.id) ?? element.rotation ?? 0;
      let newRotation = initialRotation + deltaAngle;

      newRotation = normalizeAngle(newRotation);

      this.apiService.transformSelectedElements((elements) =>
        elements.map((el) => {
          if (el.locked) {
            return el;
          }
          return {
            ...el,
            rotation: newRotation,
          };
        })
      );
    }
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

    this.apiService.setSelectionBox(selectionBox);

    const allElements = this.apiService.getElements();
    const elementsInBox = allElements.filter(
      (element) => this.checkElementInSelectionBox(element, selectionBox) && !element.locked
    );

    this.apiService.selectElements(elementsInBox, shiftKey);
    this.apiService.updateBoundingBox();
  }

  private initializeBoxSelect(event: PointerInfo): void {
    if (!event.shiftKey) {
      this.apiService.clearSelection();
    }

    const { x, y } = this.getPointerPosition(event);

    const selectionBox = {
      x,
      y,
      width: 0,
      height: 0,
      visible: true,
    };

    this.apiService.setSelectionBox(selectionBox);
  }

  private initializeResize(): void {
    const selectedElements = this.apiService.getSelectedElements();
    if (selectedElements.length === 0) return;

    this.initialElementStates.clear();
    selectedElements.forEach((element) => {
      this.initialElementStates.set(element.id, { ...element });
    });

    const allBounds = selectedElements.map((el) => getElementBounds(el));
    const minX = Math.min(...allBounds.map((b) => b.minX));
    const minY = Math.min(...allBounds.map((b) => b.minY));
    const maxX = Math.max(...allBounds.map((b) => b.maxX));
    const maxY = Math.max(...allBounds.map((b) => b.maxY));

    this.initialBoundingBox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private initializeRotation(event: PointerInfo): void {
    const bboxOrSignal = this.apiService.getBoundingBoxSignal();
    const maybeFn = bboxOrSignal as unknown;
    type BBox = { x: number; y: number; width: number; height: number } | null;
    const bbox: BBox = typeof maybeFn === 'function' ? (maybeFn as () => BBox)() : (bboxOrSignal as unknown as BBox);
    if (!bbox) return;

    this.selectionCenter = {
      x: bbox.x + bbox.width / 2,
      y: bbox.y + bbox.height / 2,
    };

    const point = this.getPointerPosition(event);

    this.rotateStartAngle = calculateAngle(this.selectionCenter, point);

    const selectedElements = this.apiService.getSelectedElements();
    this.initialElementRotations.clear();
    this.initialElementStates.clear();
    selectedElements.forEach((element) => {
      this.initialElementRotations.set(element.id, element.rotation || 0);
      this.initialElementStates.set(element.id, { ...element });
    });

    this.apiService.setBoundingBox(null);
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

    let baseDirection: Direction = Direction.N;
    if (Object.values(Direction).includes(staticDirectionStr as Direction)) {
      baseDirection = staticDirectionStr as Direction;
    }

    const selectedElements = this.apiService.getSelectedElements();
    if (selectedElements.length > 0) {
      const rotation = selectedElements[0].rotation || 0;
      return getRotatedDirection(baseDirection, rotation);
    }

    return baseDirection;
  }
}
