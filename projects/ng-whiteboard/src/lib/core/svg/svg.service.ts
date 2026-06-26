import { Injectable, signal, WritableSignal } from '@angular/core';
import { ApiService } from '../api/api.service';
import { ContextMenuService } from '../components/context-menu';
import { ConfigService } from '../config/config.service';
import {
  DROP_EFFECT,
  KEY,
  MIME_TYPE,
  MOUSE_BUTTON,
  SELECTOR_BOX,
  SELECTOR_GRIP_RESIZE,
  SELECTOR_GRIP_ROTATE,
  TEMPORARY_TOOL_ID,
} from '../constants';
import { EventBusService } from '../event-bus/event-bus.service';
import { DragDropService } from '../input/drag-drop.service';
import { KeyboardShortcutService } from '../input/keyboard-shortcut.service';
import { ToolsService } from '../tools/tools.service';
import { PointerInfo, WhiteboardEvent } from '../types';
import { Tool, ToolType } from '../types/tools';
import { getMouseTarget, getTargetElement } from '../utils/dom/target';
import { WheelHandlerService } from '../viewport/wheel-handler.service';

@Injectable({ providedIn: 'root' })
export class SvgService {
  private readonly pointerDownSig: WritableSignal<PointerInfo | null> = signal<PointerInfo | null>(null);
  private readonly pointerMoveSig: WritableSignal<PointerInfo | null> = signal<PointerInfo | null>(null);
  private readonly pointerUpSig: WritableSignal<PointerInfo | null> = signal<PointerInfo | null>(null);

  private isSpaceHeld = false;
  /** True while a pointer gesture is manipulating the selection (move/resize/rotate) even though
   *  a non-Select tool is active — see {@link tryBeginSelectionGesture}. */
  private selectionGesture = false;

  constructor(
    private toolsService: ToolsService,
    private configService: ConfigService,
    private EventBusService: EventBusService,
    private keyboardShortcutService: KeyboardShortcutService,
    private apiService: ApiService,
    private contextMenuService: ContextMenuService,
    private dragDropService: DragDropService,
    private wheelHandlerService: WheelHandlerService
  ) {}

  onPointerDown(info: PointerInfo) {
    if (info.button === MOUSE_BUTTON.MIDDLE) {
      this.toolsService.pushTemporaryTool(ToolType.Hand, TEMPORARY_TOOL_ID.PAN_MIDDLE);
      const hand = this.safeGetHandTool();
      hand?.handlePointerDown?.(info);
      return;
    }
    if (info.button === MOUSE_BUTTON.RIGHT) {
      return;
    }

    if (this.toolsService.hasTemporaryOverride()) return;

    if (!this.canDraw()) return;

    // Selection handles take pointer priority over the active drawing tool: if the gesture
    // starts on the current selection's own UI (box / resize / rotate / endpoint handles),
    // drive the Select tool so the element can be moved/resized/rotated WITHOUT switching away
    // from the drawing tool. Lets a just-drawn element stay fully editable while you keep drawing.
    if (this.tryBeginSelectionGesture(info)) return;

    this.EventBusService.emit(WhiteboardEvent.DrawStart, info);

    const currentTool = this.toolsService.getActiveToolInstance();
    currentTool?.handlePointerDown?.(info);

    if (info.isDoubleClick) {
      this.EventBusService.emit(WhiteboardEvent.ElementDoubleClicked, {
        target: info.target,
        clientX: info.clientX,
        clientY: info.clientY,
      });
    }

    this.pointerDownSig.set(info);
  }

  onPointerMove(info: PointerInfo) {
    if (this.toolsService.hasTemporaryOverride()) {
      this.safeGetHandTool()?.handlePointerMove?.(info);
      return;
    }

    if (this.selectionGesture) {
      this.EventBusService.emit(WhiteboardEvent.Drawing, info);
      this.safeGetToolInstance(ToolType.Select)?.handlePointerMove?.(info);
      this.pointerMoveSig.set(info);
      return;
    }

    if (!this.canDraw()) return;

    this.EventBusService.emit(WhiteboardEvent.Drawing, info);
    const currentTool = this.toolsService.getActiveToolInstance();
    currentTool?.handlePointerMove?.(info);
    this.pointerMoveSig.set(info);
  }

  onPointerUp(info: PointerInfo) {
    if (info.button === MOUSE_BUTTON.MIDDLE && this.toolsService.hasTemporaryOverride()) {
      this.safeGetHandTool()?.handlePointerUp?.(info);
      this.toolsService.popTemporaryTool(TEMPORARY_TOOL_ID.PAN_MIDDLE);
      return;
    }

    if (this.selectionGesture) {
      this.endSelectionGesture(info);
      return;
    }

    if (!this.canDraw()) return;

    this.EventBusService.emit(WhiteboardEvent.DrawEnd);
    const currentTool = this.toolsService.getActiveToolInstance();
    currentTool?.handlePointerUp?.(info);
    this.pointerUpSig.set(info);
  }

  /**
   * Pointer interaction cut short (pointercancel / pointerleave): if a selection gesture is in
   * flight, finalize it cleanly so the flag never sticks. `SelectTool.handlePointerUp` commits any
   * open batch and resets its own state, so this leaves nothing dangling.
   */
  onPointerCancel(info: PointerInfo): void {
    if (this.selectionGesture) {
      this.endSelectionGesture(info);
    }
  }

  /** Hand the up/cancel to the Select tool and clear the capture flag. */
  private endSelectionGesture(info: PointerInfo): void {
    this.EventBusService.emit(WhiteboardEvent.DrawEnd);
    this.safeGetToolInstance(ToolType.Select)?.handlePointerUp?.(info);
    this.pointerUpSig.set(info);
    this.selectionGesture = false;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === KEY.SPACE && !this.isSpaceHeld && !this.isTextToolEditing()) {
      this.isSpaceHeld = true;
      this.toolsService.pushTemporaryTool(ToolType.Hand, TEMPORARY_TOOL_ID.PAN_SPACE);
      event.preventDefault();
      return;
    }

    const currentTool = this.toolsService.getActiveToolInstance();
    currentTool?.handleKeyDown?.(event);

    if (!this.canUseKeyboardShortcuts()) return;
    this.keyboardShortcutService.handleKeyDown(event);
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.code === KEY.SPACE && this.isSpaceHeld && !this.isTextToolEditing()) {
      this.isSpaceHeld = false;
      this.toolsService.popTemporaryTool(TEMPORARY_TOOL_ID.PAN_SPACE);
      event.preventDefault();
      return;
    }

    const currentTool = this.toolsService.getActiveToolInstance();
    currentTool?.handleKeyUp?.(event);

    if (!this.canUseKeyboardShortcuts()) return;
    this.keyboardShortcutService.handleKeyUp(event);
  }

  /**
   * Handles wheel events for zooming and scrolling.
   */
  onWheel(event: WheelEvent) {
    if (!this.canDraw()) return;
    this.wheelHandlerService.handleWheel(event);
  }

  onDragOver(event: DragEvent) {
    if (!this.canDraw()) return;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = DROP_EFFECT.COPY;
    }
  }

  onDrop(event: DragEvent) {
    if (!this.canDraw()) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.dragDropService.handleFiles(files);
      return;
    }

    const html = event.dataTransfer?.getData(MIME_TYPE.HTML);
    if (html) {
      this.dragDropService.handleText(html, event, true);
      return;
    }

    const text = event.dataTransfer?.getData(MIME_TYPE.PLAIN);
    if (text) {
      this.dragDropService.handleText(text, event, false);
      return;
    }

    const json = event.dataTransfer?.getData(MIME_TYPE.JSON);
    if (json) {
      try {
        const elements = JSON.parse(json);
        if (Array.isArray(elements)) {
          this.dragDropService.handleElements(elements, event);
        }
      } catch (e) {
        console.warn('Failed to parse dropped JSON:', e);
      }
    }
  }

  // CONTEXT MENU HANDLING
  onContextMenu(info: PointerInfo, containerBounds?: DOMRect) {
    if (!this.canDraw()) return;

    // First, try to detect if we right-clicked on an element
    const targetElement = this.getTargetElementFromPointer(info);

    // Check if we have any selected elements
    const currentSelection = this.apiService.selectedElements();
    const hasSelection = currentSelection.length > 0;

    if (targetElement) {
      const isAlreadySelected = currentSelection.some((el) => el.id === targetElement.id);

      if (!isAlreadySelected) {
        this.apiService.selectElements(targetElement);
      }
    } else if (!hasSelection) {
      this.apiService.clearSelection();
    }

    this.contextMenuService.showContextMenu(info.clientX, info.clientY, containerBounds);
  }

  private canDraw(): boolean {
    return this.configService.getConfig().drawingEnabled;
  }
  private canUseKeyboardShortcuts(): boolean {
    return this.configService.getConfig().keyboardShortcutsEnabled;
  }

  private isTextToolEditing(): boolean {
    const activeToolType = this.toolsService.getActiveToolType();
    if (activeToolType !== ToolType.Text) return false;

    const activeToolInstance = this.toolsService.getActiveToolInstance();
    return activeToolInstance?.isEditing === true;
  }

  private safeGetHandTool(): Tool | null {
    return this.safeGetToolInstance(ToolType.Hand);
  }

  private safeGetToolInstance(type: ToolType): Tool | null {
    try {
      return this.toolsService.getToolInstance(type);
    } catch {
      return null;
    }
  }

  /**
   * True when the pointer landed on the current selection's own UI — its bounding box, the
   * resize/rotate grips, or an arrow endpoint/curve handle. These imply "manipulate the
   * selection", as opposed to drawing on empty canvas.
   */
  private isSelectionHandleTarget(target: SVGGraphicsElement | null): boolean {
    if (!target) return false;
    const id = target.id ?? '';
    if (id.includes(SELECTOR_GRIP_RESIZE) || id.includes(SELECTOR_GRIP_ROTATE) || id.includes(SELECTOR_BOX)) {
      return true;
    }
    const handle = typeof target.getAttribute === 'function' ? target.getAttribute('data-handle') : null;
    return handle === 'start' || handle === 'end' || handle === 'curve';
  }

  /**
   * If a non-Select tool is active, something is selected, and the gesture starts on that
   * selection's UI, route the whole gesture (down → move → up) to the Select tool instead of
   * the active drawing tool. Returns true when the gesture was captured.
   */
  private tryBeginSelectionGesture(info: PointerInfo): boolean {
    if (this.toolsService.getActiveToolType() === ToolType.Select) return false;
    if (!this.apiService.getBoundingBox()) return false;
    if (!this.isSelectionHandleTarget(getMouseTarget(info))) return false;

    const selectTool = this.safeGetToolInstance(ToolType.Select);
    if (!selectTool) return false;

    this.selectionGesture = true;
    this.EventBusService.emit(WhiteboardEvent.DrawStart, info);
    selectTool.handlePointerDown?.(info);
    this.pointerDownSig.set(info);
    return true;
  }

  /**
   * Get the whiteboard element that was clicked on, if any
   */
  private getTargetElementFromPointer(info: PointerInfo) {
    const allElements = this.apiService.getElements();
    return getTargetElement(info, allElements);
  }
}
