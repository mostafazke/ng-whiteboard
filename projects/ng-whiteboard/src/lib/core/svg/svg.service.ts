import { Injectable, signal, WritableSignal } from '@angular/core';
import { WhiteboardEvent, PointerInfo } from '../types';
import { EventBusService } from '../event-bus/event-bus.service';
import { ConfigService } from '../config/config.service';
import { KeyboardShortcutService } from '../input/keyboard-shortcut.service';
import { ToolsService } from '../tools/tools.service';
import { DragDropService } from '../input/drag-drop.service';
import { WheelHandlerService } from '../viewport/wheel-handler.service';
import { ApiService } from '../api/api.service';
import { ToolType, Tool } from '../types/tools';
import { ContextMenuService } from '../components/context-menu';
import { getTargetElement } from '../utils/dom/target';

@Injectable({ providedIn: 'root' })
export class SvgService {
  private readonly pointerDownSig: WritableSignal<PointerInfo | null> = signal<PointerInfo | null>(null);
  private readonly pointerMoveSig: WritableSignal<PointerInfo | null> = signal<PointerInfo | null>(null);
  private readonly pointerUpSig: WritableSignal<PointerInfo | null> = signal<PointerInfo | null>(null);

  private isSpaceHeld = false;

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
    if (info.button === 1) {
      this.toolsService.pushTemporaryTool(ToolType.Hand, 'pan-middle');
      const hand = this.safeGetHandTool();
      hand?.handlePointerDown?.(info);
      return;
    }
    if (info.button === 2) {
      return;
    }

    if (this.toolsService.hasTemporaryOverride()) return;

    if (!this.canDraw()) return;

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

    if (!this.canDraw()) return;

    this.EventBusService.emit(WhiteboardEvent.Drawing, info);
    const currentTool = this.toolsService.getActiveToolInstance();
    currentTool?.handlePointerMove?.(info);
    this.pointerMoveSig.set(info);
  }

  onPointerUp(info: PointerInfo) {
    if (info.button === 1 && this.toolsService.hasTemporaryOverride()) {
      this.safeGetHandTool()?.handlePointerUp?.(info);
      this.toolsService.popTemporaryTool('pan-middle');
      return;
    }

    if (!this.canDraw()) return;

    this.EventBusService.emit(WhiteboardEvent.DrawEnd);
    const currentTool = this.toolsService.getActiveToolInstance();
    currentTool?.handlePointerUp?.(info);
    this.pointerUpSig.set(info);
  }

  onKeyDown(event: KeyboardEvent) {
    
    // ---------------- [Begin of fix code] ----------------
    // Check whether the target is an input box, textarea, or an editable element
    const target = event.target as HTMLElement;
    if(target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)){
      return;
    }
    // ---------------- [End of fix code] ----------------
    if (event.code === 'Space' && !this.isSpaceHeld) {
      this.isSpaceHeld = true;
      this.toolsService.pushTemporaryTool(ToolType.Hand, 'pan-space');
      event.preventDefault();
      return;
    }

    const currentTool = this.toolsService.getActiveToolInstance();
    currentTool?.handleKeyDown?.(event);

    if (!this.canUseKeyboardShortcuts()) return;
    this.keyboardShortcutService.handleKeyDown(event);
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.code === 'Space' && this.isSpaceHeld) {
      this.isSpaceHeld = false;
      this.toolsService.popTemporaryTool('pan-space');
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
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent) {
    if (!this.canDraw()) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.dragDropService.handleFiles(files);
      return;
    }

    const html = event.dataTransfer?.getData('text/html');
    if (html) {
      this.dragDropService.handleText(html, event, true);
      return;
    }

    const text = event.dataTransfer?.getData('text/plain');
    if (text) {
      this.dragDropService.handleText(text, event, false);
      return;
    }

    const json = event.dataTransfer?.getData('application/json');
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

  private safeGetHandTool(): Tool | null {
    try {
      return this.toolsService.getToolInstance(ToolType.Hand);
    } catch {
      return null;
    }
  }

  /**
   * Get the whiteboard element that was clicked on, if any
   */
  private getTargetElementFromPointer(info: PointerInfo) {
    const allElements = this.apiService.getElements();
    return getTargetElement(info, allElements);
  }
}
