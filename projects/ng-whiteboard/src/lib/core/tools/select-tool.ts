import { DATA_ID, ITEM_PREFIX, SELECTOR_BOX, SELECTOR_GRIP_RESIZE, SELECTOR_GRIP_ROTATE } from '../constants';
import { getElementUtil } from '../elements/element.utils';
import { ArrowElement } from '../elements/arrow-element';
import { ArrowBindingService } from '../elements/arrow-binding.service';
import { ConnectionPointsService } from '../elements/connection-points.service';
import { ConnectionUIService } from '../elements/connection-ui.service';
import { Direction, ElementType, Point, PointerInfo, SnapResult, ToolType, WhiteboardElement } from '../types';
import { getMouseTarget } from '../utils/dom';
import {
  calculateAngle,
  getSnappedOffset,
  isElementInSelectionBox,
  normalizeAngle,
  rotatePointAroundCenter,
} from '../utils/geometry';
import { getElementBounds } from '../utils/dom/element';
import {
  getCombinedScreenBounds,
  getRotatedChildScale,
  getRotatedResizeAnchor,
} from '../utils/geometry/transform-utils';

import { BaseTool } from './base-tool';
import { CursorType } from '../types/cursors';
import { BatchHandle } from '../history/history.service';

export enum SelectAction {
  None,
  Select,
  Move,
  Resize,
  Rotate,
  BoxSelect,
  /** Dragging an arrow/line endpoint handle to move, attach, or detach */
  DragEndpoint,
  /** Dragging the middle curve handle to adjust arrow curvature */
  DragCurveHandle,
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

  // Arrow / Line endpoint drag state
  private dragEndpointId: string | null = null;
  private dragEndpointEnd: 'start' | 'end' | null = null;
  private dragEndpointSnap: SnapResult | null = null;
  private readonly SNAP_RADIUS = 20;

  // Arrow curve handle drag state
  private dragCurveArrowId: string | null = null;

  // Track whether arrow bindings were detached during current move
  private arrowBindingsDetached = false;

  // Actions that transform existing elements over many frames; each must collapse
  // into a single undo entry via a history batch (see handlePointerMove/Up).
  private static readonly TRANSFORM_ACTIONS: ReadonlySet<SelectAction> = new Set([
    SelectAction.Move,
    SelectAction.Resize,
    SelectAction.Rotate,
    SelectAction.DragEndpoint,
    SelectAction.DragCurveHandle,
  ]);
  // Open history batch for the in-progress transform gesture, if any.
  private transformBatch: BatchHandle | null = null;

  // Injected connection services
  private connectionPointsService!: ConnectionPointsService;
  private arrowBindingService!: ArrowBindingService;
  private connectionUIService!: ConnectionUIService;

  setConnectionServices(cp: ConnectionPointsService, ab: ArrowBindingService, ui: ConnectionUIService): void {
    this.connectionPointsService = cp;
    this.arrowBindingService = ab;
    this.connectionUIService = ui;
  }

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
    // Drop any batch left open by a gesture interrupted mid-flight, so the
    // history service never stays stuck in batching mode.
    if (this.transformBatch) {
      this.transformBatch.clear();
      this.transformBatch = null;
    }
    this.apiService.clearSelection();
  }

  private batchDescriptionFor(action: SelectAction): string {
    switch (action) {
      case SelectAction.Move:
        return 'Move element';
      case SelectAction.Resize:
        return 'Resize element';
      case SelectAction.Rotate:
        return 'Rotate element';
      case SelectAction.DragEndpoint:
        return 'Move endpoint';
      case SelectAction.DragCurveHandle:
        return 'Adjust curve';
      default:
        return 'Transform element';
    }
  }

  override handlePointerDown(event: PointerInfo): void {
    const target = getMouseTarget(event);

    const targetId = target?.id ?? '';

    this.startPoint = this.getPointerPosition(event);

    // Check if clicking an arrow endpoint handle for reconnection
    const arrowHandle = typeof target?.getAttribute === 'function' ? target.getAttribute('data-handle') : null;
    const arrowId = typeof target?.getAttribute === 'function' ? target.getAttribute('data-arrow-id') : null;
    if (arrowHandle && arrowId && (arrowHandle === 'start' || arrowHandle === 'end')) {
      this.dragEndpointId = arrowId;
      this.dragEndpointEnd = arrowHandle;
      this.dragEndpointSnap = null;
      this.currentAction = SelectAction.DragEndpoint;
      return;
    }

    // Check if clicking a curve handle for adjusting arrow curvature
    if (arrowHandle === 'curve' && arrowId) {
      this.dragCurveArrowId = arrowId;
      this.currentAction = SelectAction.DragCurveHandle;
      return;
    }

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

        // Open a history batch on the first transform frame: from here every
        // per-frame element update is coalesced, so the whole gesture commits as
        // one undo entry on pointer up. A plain click never reaches here, so no
        // batch is left dangling.
        if (!this.transformBatch && SelectTool.TRANSFORM_ACTIONS.has(this.currentAction)) {
          this.transformBatch = this.apiService.startBatch(
            this.batchDescriptionFor(this.currentAction),
            this.apiService.getElements()
          );
        }

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
          case SelectAction.DragEndpoint:
            this.handleDragEndpoint(currentPoint);
            break;
          case SelectAction.DragCurveHandle:
            this.handleDragCurveHandle(currentPoint);
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

    // Finalize endpoint drag (arrow reconnection or line endpoint move)
    if (this.currentAction === SelectAction.DragEndpoint) {
      this.finalizeDragEndpoint();
    }

    // Finalize curve handle drag
    if (this.currentAction === SelectAction.DragCurveHandle) {
      this.dragCurveArrowId = null;
    }

    // After a move, update bound arrows for all moved elements
    if (
      (this.currentAction === SelectAction.Move ||
        this.currentAction === SelectAction.Resize ||
        this.currentAction === SelectAction.Rotate) &&
      this.arrowBindingService
    ) {
      const selectedElements = this.apiService.getSelectedElements();
      const movedIds = new Set(selectedElements.map((el) => el.id));
      const arrowUpdates = this.arrowBindingService.recomputeBindingsForElements(movedIds);
      if (arrowUpdates.length > 0) {
        this.apiService.updateElements(arrowUpdates as Array<Partial<WhiteboardElement> & { id: string }>);
      }
    }

    // Commit the gesture's coalesced changes as a single undo entry.
    if (this.transformBatch) {
      this.apiService.completeBatch(this.apiService.getElements());
      this.transformBatch.execute();
      this.transformBatch = null;
    }

    this.initialElementStates.clear();

    this.currentAction = SelectAction.None;
    this.startPoint = null;
    this.currentHandle = null;
    this.rotateStartAngle = null;
    this.selectionCenter = null;
    this.initialBoundingBox = null;
    this.dragEndpointId = null;
    this.dragEndpointEnd = null;
    this.dragEndpointSnap = null;
    this.dragCurveArrowId = null;
    this.arrowBindingsDetached = false;
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

    // Detach bindings from arrows that are being moved by their body (not via endpoint handles)
    if (!this.arrowBindingsDetached && this.arrowBindingService) {
      const selectedElements = this.apiService.getSelectedElements();
      const movedArrows = selectedElements.filter(
        (el): el is ArrowElement =>
          el.type === ElementType.Arrow && (el.startBinding !== null || el.endBinding !== null)
      );
      if (movedArrows.length > 0) {
        const detachUpdates: Array<Partial<WhiteboardElement> & { id: string }> = [];
        for (const arrow of movedArrows) {
          const update: Partial<ArrowElement> & { id: string } = { id: arrow.id };
          if (arrow.startBinding) update.startBinding = null;
          if (arrow.endBinding) update.endBinding = null;
          detachUpdates.push(update as Partial<WhiteboardElement> & { id: string });
        }
        this.apiService.updateElements(detachUpdates);
        this.arrowBindingsDetached = true;
      }
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

    // Update bound arrows in real-time as shapes are moved
    if (this.arrowBindingService) {
      const selectedElements = this.apiService.getSelectedElements();
      const movedIds = new Set(selectedElements.map((el) => el.id));
      const arrowUpdates = this.arrowBindingService.recomputeBindingsForElements(movedIds);
      if (arrowUpdates.length > 0) {
        this.apiService.updateElements(arrowUpdates as Array<Partial<WhiteboardElement> & { id: string }>);
      }
    }

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

      let localDx: number;
      let localDy: number;

      if (element.rotation && element.rotation !== 0) {
        // For rotated elements keep the delta-from-click approach and un-rotate to local space.
        const rawDx = currentPoint.x - this.startPoint.x;
        const rawDy = currentPoint.y - this.startPoint.y;
        const angleRad = (-element.rotation * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        localDx = rawDx * cos - rawDy * sin;
        localDy = rawDx * sin + rawDy * cos;
      } else {
        // Absolute cursor tracking: compute dx/dy relative to the initial natural
        // bbox corners so the dragged handle edge follows the cursor exactly,
        // regardless of where inside the grip the user clicked.
        const naturalBounds = getElementUtil(initialElement.type).getBounds(initialElement);
        localDx = handle.includes(Direction.E)
          ? currentPoint.x - naturalBounds.maxX
          : handle.includes(Direction.W)
          ? currentPoint.x - naturalBounds.minX
          : 0;
        localDy = handle.includes(Direction.S)
          ? currentPoint.y - naturalBounds.maxY
          : handle.includes(Direction.N)
          ? currentPoint.y - naturalBounds.minY
          : 0;
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

          // For a rotated element the element renders rotated around its fill-box center,
          // so pin the anchor corner (opposite the dragged handle) in world space using
          // that same center. Computing it before and after the resize and shifting by the
          // difference keeps the opposite corner fixed instead of drifting.
          let anchorPointBefore: Point | null = null;
          if (initial.rotation && initial.rotation !== 0) {
            const initialBounds = getElementUtil(initial.type).getBounds(initial);
            anchorPointBefore = getRotatedResizeAnchor(initialBounds, handle, initial.rotation);
          }

          const elementUtil = getElementUtil(initial.type);
          const resized = elementUtil.resize({ ...initial }, handle, snappedX, snappedY);

          if (initial.rotation && initial.rotation !== 0 && anchorPointBefore) {
            const resizedBounds = getElementUtil(resized.type).getBounds(resized);
            const anchorPointAfter = getRotatedResizeAnchor(resizedBounds, handle, resized.rotation ?? 0);

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

        // Project the group scale onto the child's own axes so rotated children scale
        // along their orientation instead of stretching diagonally out of the box.
        const childScale = getRotatedChildScale(finalScaleX, finalScaleY, initialElement.rotation ?? 0);

        const hasSize =
          'width' in initialElement &&
          initialElement.width !== undefined &&
          'height' in initialElement &&
          initialElement.height !== undefined;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: any = { ...element };

        if (hasSize) {
          // Scale the child's center about the anchor with the group scale, then re-derive
          // the origin from the projected-scaled size. Origin-only scaling would shift a
          // rotated child whenever its size scale differs from the group scale.
          const w0 = initialElement.width as number;
          const h0 = initialElement.height as number;
          const newWidthEl = w0 * childScale.scaleX;
          const newHeightEl = h0 * childScale.scaleY;
          const centerX = initialElement.x + w0 / 2;
          const centerY = initialElement.y + h0 / 2;
          const newCenterX = anchorX + (centerX - anchorX) * finalScaleX;
          const newCenterY = anchorY + (centerY - anchorY) * finalScaleY;
          updates.x = newCenterX - newWidthEl / 2;
          updates.y = newCenterY - newHeightEl / 2;
          updates.width = newWidthEl;
          updates.height = newHeightEl;
        } else {
          updates.x = anchorX + (initialElement.x - anchorX) * finalScaleX;
          updates.y = anchorY + (initialElement.y - anchorY) * finalScaleY;
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

  // ────────────────── Endpoint Drag (Arrow + Line) ──────────────────

  /**
   * Handle dragging an endpoint of an arrow or line in real-time.
   * For arrows: attempts snap-to-shape with visual feedback.
   * For lines: free movement of the endpoint.
   */
  private handleDragEndpoint(currentPoint: Point): void {
    if (!this.dragEndpointId || !this.dragEndpointEnd) return;

    const element = this.apiService.getElementById(this.dragEndpointId);
    if (!element) return;

    // Convert world point to local coordinates (account for element origin + rotation)
    const local = this.worldToLocal(element, currentPoint);
    let x = local.x;
    let y = local.y;

    const isArrow = element.type === ElementType.Arrow;

    // Snap-to-shape for arrows only
    this.dragEndpointSnap = null;
    if (isArrow && this.connectionPointsService) {
      const allElements = this.apiService.getElements();
      const excludeIds = new Set([this.dragEndpointId]);
      const snap = this.connectionPointsService.findSnapTarget(
        currentPoint, // snap uses world coords
        allElements,
        excludeIds,
        this.SNAP_RADIUS
      );
      if (snap) {
        // Convert snapped world point back to local
        const snapLocal = this.worldToLocal(element, snap.point);
        x = snapLocal.x;
        y = snapLocal.y;
        this.dragEndpointSnap = snap;
        this.connectionUIService?.setSnapIndicator(snap.point);
        const targetEl = allElements.find((el) => el.id === snap.elementId);
        if (targetEl) {
          this.connectionUIService?.setVisibleConnectionPoints(
            this.connectionPointsService.getConnectionPoints(targetEl)
          );
        }
      } else {
        this.connectionUIService?.setSnapIndicator(null);
        this.connectionUIService?.setVisibleConnectionPoints([]);
      }
    }

    // Update the endpoint in real-time
    const update =
      this.dragEndpointEnd === 'start' ? { id: element.id, x1: x, y1: y } : { id: element.id, x2: x, y2: y };
    this.apiService.updateElements([update as Partial<WhiteboardElement> & { id: string }]);
  }

  /**
   * Finalize the endpoint drag.
   * For arrows: commit binding if snapped, or detach.
   * For lines: no further action needed (already updated in real-time).
   */
  private finalizeDragEndpoint(): void {
    if (!this.dragEndpointId || !this.dragEndpointEnd) return;

    const element = this.apiService.getElementById(this.dragEndpointId);
    if (!element) return;

    const isArrow = element.type === ElementType.Arrow;

    if (isArrow && this.arrowBindingService) {
      const arrow = element as ArrowElement;

      if (this.dragEndpointSnap) {
        const binding = this.arrowBindingService.createBinding(
          this.dragEndpointSnap.elementId,
          this.dragEndpointSnap.pointId
        );
        const snapLocal = this.worldToLocal(arrow, this.dragEndpointSnap.point);
        const update =
          this.dragEndpointEnd === 'start'
            ? { id: arrow.id, startBinding: binding, x1: snapLocal.x, y1: snapLocal.y }
            : { id: arrow.id, endBinding: binding, x2: snapLocal.x, y2: snapLocal.y };
        this.apiService.updateElements([update as Partial<WhiteboardElement> & { id: string }]);
      } else {
        // Detach from any shape
        const update =
          this.dragEndpointEnd === 'start' ? { id: arrow.id, startBinding: null } : { id: arrow.id, endBinding: null };
        this.apiService.updateElements([update as Partial<WhiteboardElement> & { id: string }]);
      }
    }

    this.connectionUIService?.clearAll();
  }

  /**
   * Handle dragging the middle curve handle to adjust an arrow's curvature.
   * Converts the world-space pointer position to a quadratic control point.
   * Dragging away from the midpoint creates/modifies a quadratic bezier;
   * dragging back to the midpoint resets to straight.
   */
  private handleDragCurveHandle(currentPoint: Point): void {
    if (!this.dragCurveArrowId) return;

    const element = this.apiService.getElementById(this.dragCurveArrowId);
    if (!element || element.type !== ElementType.Arrow) return;

    const arrow = element as ArrowElement;

    // --- Elbow: dragging controls the midRatio (bend position along X axis) ---
    if (arrow.pathType?.type === 'elbow') {
      const local = this.worldToLocal(arrow, currentPoint);
      const dx = arrow.x2 - arrow.x1;
      if (Math.abs(dx) < 1) return; // degenerate case
      const ratio = Math.max(0.05, Math.min(0.95, (local.x - arrow.x1) / dx));
      const update = {
        id: arrow.id,
        pathType: { type: 'elbow' as const, midRatio: ratio },
      };
      this.apiService.updateElements([update as Partial<WhiteboardElement> & { id: string }]);
      return;
    }

    // --- Quadratic / Straight: existing behaviour ---
    // Convert the world-space pointer to local coordinates
    const local = this.worldToLocal(arrow, currentPoint);

    // Compute midpoint in local space
    const midX = (arrow.x1 + arrow.x2) / 2;
    const midY = (arrow.y1 + arrow.y2) / 2;

    // Distance from the local control point to the midpoint
    const dist = Math.sqrt((local.x - midX) ** 2 + (local.y - midY) ** 2);

    // If the handle is close to the midpoint, reset to straight
    const STRAIGHT_THRESHOLD = 5;
    if (dist < STRAIGHT_THRESHOLD) {
      const update = { id: arrow.id, pathType: { type: 'straight' as const } };
      this.apiService.updateElements([update as Partial<WhiteboardElement> & { id: string }]);
    } else {
      // Set quadratic control point
      const update = {
        id: arrow.id,
        pathType: { type: 'quadratic' as const, cx: local.x, cy: local.y },
      };
      this.apiService.updateElements([update as Partial<WhiteboardElement> & { id: string }]);
    }
  }

  /**
   * Convert a world-space point to an element's local coordinate system,
   * accounting for translation, fill-box-centered rotation, and scale.
   *
   * The element <g> uses `translate(x,y) rotate(rotation)` with CSS
   * `transform-box: fill-box; transform-origin: center`, so the rotation
   * pivot is the fill-box center, not the local origin.
   */
  private worldToLocal(element: WhiteboardElement, worldPoint: Point): Point {
    const rot = element.rotation ?? 0;
    const scaleX = (element as WhiteboardElement & { scaleX?: number }).scaleX ?? 1;
    const scaleY = (element as WhiteboardElement & { scaleY?: number }).scaleY ?? 1;

    // Un-translate
    const dx = worldPoint.x - element.x;
    const dy = worldPoint.y - element.y;

    if (rot === 0) {
      return { x: dx / scaleX, y: dy / scaleY };
    }

    // Fill-box pivot in local (post-scale) space
    const el = element as WhiteboardElement & { x1?: number; y1?: number; x2?: number; y2?: number };
    const x1s = (el.x1 ?? 0) * scaleX;
    const y1s = (el.y1 ?? 0) * scaleY;
    const x2s = (el.x2 ?? 0) * scaleX;
    const y2s = (el.y2 ?? 0) * scaleY;
    const pivotX = (x1s + x2s) / 2;
    const pivotY = (y1s + y2s) / 2;

    // Inverse rotation around fill-box pivot
    const rad = (-rot * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = dx - pivotX;
    const ry = dy - pivotY;
    const localX = pivotX + rx * cos - ry * sin;
    const localY = pivotY + rx * sin + ry * cos;

    return { x: localX / scaleX, y: localY / scaleY };
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

    // Use the already-computed bounding box signal (which uses measureTextElementSvg
    // for text elements) so that initialBoundingBox matches the displayed box exactly.
    const currentBbox = this.apiService.getBoundingBoxSignal()();
    if (currentBbox) {
      this.initialBoundingBox = {
        x: currentBbox.x,
        y: currentBbox.y,
        width: currentBbox.width,
        height: currentBbox.height,
      };
    } else {
      const combinedBounds = getCombinedScreenBounds(selectedElements);
      if (combinedBounds) {
        this.initialBoundingBox = {
          x: combinedBounds.minX,
          y: combinedBounds.minY,
          width: combinedBounds.width,
          height: combinedBounds.height,
        };
      } else {
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
    }
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

    // The selection box and its grips render inside #selectorParentGroup, which rotates
    // with the element, so each grip stays glued to its own local corner. The resize
    // direction is therefore the grip's own (static) direction — the handler un-rotates
    // the cursor delta into local space, so applying a rotation remap here would
    // double-count the rotation and resize the wrong corner.
    return baseDirection;
  }
}
