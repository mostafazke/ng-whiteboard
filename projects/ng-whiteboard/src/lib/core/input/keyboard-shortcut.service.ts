import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api';
import { ConfigService } from '../config/config.service';
import { KEY_LOWER, MOVEMENT } from '../constants';
import { AlignmentType, ToolType } from '../types';

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutService {
  private configService = inject(ConfigService);
  private apiService = inject(ApiService);

  toggleKeyboardShortcuts() {
    const currentConfig = this.configService.getConfig();
    this.configService.updateConfigValue('keyboardShortcutsEnabled', !currentConfig.keyboardShortcutsEnabled);
  }

  handleKeyDown(event: KeyboardEvent) {
    if (this.isInputFocused()) {
      return;
    }

    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;

    // Prevent default browser behavior for our shortcuts
    if (this.handleKeyDownShortcuts(key, ctrl, shift, alt)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  handleKeyUp(event: KeyboardEvent) {
    // No specific keyup shortcuts for now
  }

  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    return (
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement?.getAttribute('contenteditable') === 'true'
    );
  }

  private handleKeyDownShortcuts(key: string, ctrl: boolean, shift: boolean, alt: boolean): boolean {
    // Tool Shortcuts
    if (!ctrl && !shift && !alt) {
      if (key === 'v') {
        this.apiService.setActiveTool(ToolType.Select);
        return true;
      }
      if (key === 'd') {
        this.apiService.setActiveTool(ToolType.Pen);
        return true;
      }
      if (key === 'e') {
        this.apiService.setActiveTool(ToolType.Eraser);
        return true;
      }
      if (key === 'h') {
        this.apiService.setActiveTool(ToolType.Hand);
        return true;
      }
      if (key === 'r') {
        this.apiService.setActiveTool(ToolType.Rectangle);
        return true;
      }
      if (key === 'o') {
        this.apiService.setActiveTool(ToolType.Ellipse);
        return true;
      }
      if (key === 'a') {
        this.apiService.setActiveTool(ToolType.Arrow);
        return true;
      }
      if (key === 'l') {
        this.apiService.setActiveTool(ToolType.Line);
        return true;
      }
      if (key === 't') {
        this.apiService.setActiveTool(ToolType.Text);
        return true;
      }
    }

    // Undo/Redo
    if (ctrl && key === 'z' && !shift) {
      return this.apiService.undo();
    }
    if (ctrl && (key === 'y' || (key === 'z' && shift))) {
      return this.apiService.redo();
    }

    // Selection
    if (ctrl && key === 'a') {
      this.apiService.selectAll();
      return true;
    }
    if (key === KEY_LOWER.ESCAPE) {
      this.apiService.clearSelection();
      return true;
    }

    // Clipboard
    if (ctrl && key === 'c') {
      this.apiService.copyElements();
      return true;
    }
    if (ctrl && key === 'x') {
      this.apiService.cutElements();
      return true;
    }
    if (ctrl && key === 'v') {
      this.apiService.pasteElements();
      return true;
    }
    if (ctrl && key === 'd') {
      this.apiService.duplicateElements();
      return true;
    }

    // Delete
    if (key === KEY_LOWER.DELETE || key === KEY_LOWER.BACKSPACE) {
      this.apiService.deleteSelectedElements();
      return true;
    }

    // Grouping
    if (ctrl && key === 'g' && !shift) {
      this.apiService.groupSelectedElements();
      return true;
    }
    if (ctrl && key === 'g' && shift) {
      this.apiService.ungroupSelectedElements();
      return true;
    }

    // Layer Order (Z-index)
    if (!ctrl && !shift && !alt && key === ']') {
      this.apiService.bringToFront();
      return true;
    }
    if (alt && !ctrl && !shift && key === ']') {
      this.apiService.bringForward();
      return true;
    }
    if (alt && !ctrl && !shift && key === '[') {
      this.apiService.sendBackward();
      return true;
    }
    if (!ctrl && !shift && !alt && key === '[') {
      this.apiService.sendToBack();
      return true;
    }

    // Flip
    if (shift && !ctrl && !alt && key === 'h') {
      this.apiService.flipHorizontal();
      return true;
    }
    if (shift && !ctrl && !alt && key === 'v') {
      this.apiService.flipVertical();
      return true;
    }

    // Alignment
    if (alt && !ctrl && !shift && key === 'w') {
      this.apiService.alignElements(AlignmentType.Top);
      return true;
    }
    if (alt && !ctrl && !shift && key === 'v') {
      this.apiService.alignElements(AlignmentType.Middle);
      return true;
    }
    if (alt && !ctrl && !shift && key === 's') {
      this.apiService.alignElements(AlignmentType.Bottom);
      return true;
    }
    if (alt && !ctrl && !shift && key === 'a') {
      this.apiService.alignElements(AlignmentType.Left);
      return true;
    }
    if (alt && !ctrl && !shift && key === 'h') {
      this.apiService.alignElements(AlignmentType.Center);
      return true;
    }
    if (alt && !ctrl && !shift && key === 'd') {
      this.apiService.alignElements(AlignmentType.Right);
      return true;
    }

    // Zoom
    if ((ctrl && key === '=') || (ctrl && key === '+')) {
      this.apiService.zoomIn();
      return true;
    }
    if (ctrl && key === '-') {
      this.apiService.zoomOut();
      return true;
    }
    if (shift && !ctrl && !alt && key === '0') {
      this.apiService.resetZoom(); // Zoom to 100%
      return true;
    }
    if (shift && !ctrl && !alt && key === '1') {
      this.apiService.zoomToFit(); // Zoom to fit
      return true;
    }
    if (shift && !ctrl && !alt && key === '2') {
      this.apiService.zoomToSelection(); // Zoom to selection
      return true;
    }

    // Grid
    if (ctrl && key === "'" && !shift) {
      this.apiService.toggleGrid();
      return true;
    }
    if (ctrl && key === ';' && shift) {
      this.apiService.toggleSnapToGrid();
      return true;
    }

    // Arrow key navigation for moving selected elements
    if (
      !ctrl &&
      !shift &&
      !alt &&
      (key === KEY_LOWER.ARROW_UP ||
        key === KEY_LOWER.ARROW_DOWN ||
        key === KEY_LOWER.ARROW_LEFT ||
        key === KEY_LOWER.ARROW_RIGHT)
    ) {
      // Move selected elements by 1 pixel
      const dx =
        key === KEY_LOWER.ARROW_RIGHT ? MOVEMENT.SMALL_STEP : key === KEY_LOWER.ARROW_LEFT ? -MOVEMENT.SMALL_STEP : 0;
      const dy =
        key === KEY_LOWER.ARROW_DOWN ? MOVEMENT.SMALL_STEP : key === KEY_LOWER.ARROW_UP ? -MOVEMENT.SMALL_STEP : 0;
      this.apiService.moveSelectedElements(dx, dy);
      return true;
    }

    // Arrow key navigation for moving selected elements faster
    if (
      !ctrl &&
      shift &&
      !alt &&
      (key === KEY_LOWER.ARROW_UP ||
        key === KEY_LOWER.ARROW_DOWN ||
        key === KEY_LOWER.ARROW_LEFT ||
        key === KEY_LOWER.ARROW_RIGHT)
    ) {
      // Move selected elements by 10 pixels
      const dx =
        key === KEY_LOWER.ARROW_RIGHT ? MOVEMENT.LARGE_STEP : key === KEY_LOWER.ARROW_LEFT ? -MOVEMENT.LARGE_STEP : 0;
      const dy =
        key === KEY_LOWER.ARROW_DOWN ? MOVEMENT.LARGE_STEP : key === KEY_LOWER.ARROW_UP ? -MOVEMENT.LARGE_STEP : 0;
      this.apiService.moveSelectedElements(dx, dy);
      return true;
    }

    return false;
  }
}
