import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api';
import { ConfigService } from '../config/config.service';
import { KEY_LOWER, MOVEMENT } from '../constants';
import { AlignmentType, ToolType } from '../types';
import { toolForKey } from './tool-shortcuts';

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
    const code = event.code ?? '';
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;

    if (this.handleKeyDownShortcuts(key, code, ctrl, shift, alt)) {
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

  private handleKeyDownShortcuts(key: string, code: string, ctrl: boolean, shift: boolean, alt: boolean): boolean {
    // With Shift held, `key` is the shifted character (`)`, `!`, `:` on US layouts), so match the physical key too.
    const digit = (n: number) => key === String(n) || code === `Digit${n}`;
    // Tool Shortcuts
    if (!ctrl && !shift && !alt) {
      const tool = toolForKey(key, this.configService.getConfig().toolbarTools);
      if (tool) {
        this.apiService.setActiveTool(tool);
        if (tool === ToolType.Image) this.apiService.pickImage();
        return true;
      }
      if (key === 'q') {
        this.configService.toggleToolLock();
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
    if (ctrl && !shift && key === 'c') {
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
    if (shift && !ctrl && !alt && digit(0)) {
      this.apiService.resetZoom();
      return true;
    }
    if (shift && !ctrl && !alt && digit(1)) {
      this.apiService.zoomToFit();
      return true;
    }
    if (shift && !ctrl && !alt && digit(2)) {
      this.apiService.zoomToSelection();
      return true;
    }

    // Grid
    if (ctrl && key === "'" && !shift) {
      this.apiService.toggleGrid();
      return true;
    }
    if (ctrl && shift && (key === ';' || code === 'Semicolon')) {
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
