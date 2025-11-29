import { TextElement } from '../elements';
import { createElement } from '../elements/element.utils';
import { ElementType, PointerInfo, ToolType, WhiteboardElementStyle } from '../types';
import { getTargetElement } from '../utils/dom';
import { snapToGrid } from '../utils/geometry';
import { BaseTool } from './base-tool';
import { CursorType } from '../types/cursors';
import { KEY } from '../constants';

export class TextTool extends BaseTool {
  type = ToolType.Text;
  override baseCursor = CursorType.Text;
  private textElement: TextElement | null = null;
  private textInput: HTMLTextAreaElement | null = null;

  get isEditing(): boolean {
    return this.textInput !== null;
  }

  override handlePointerDown(event: PointerInfo): void {
    if (!this.active) return;

    if (this.textInput) {
      this.finishTextInput();
      return;
    }

    const targetElement = getTargetElement(event, this.apiService.getElements());
    if (targetElement && targetElement.type === ElementType.Text) {
      this.textElement = targetElement;
      this.createTextInput(targetElement.x, targetElement.y, targetElement.text);
      return;
    }

    const { x, y } = this.getPointerPosition(event);
    const fontSize = this.whiteboardConfig.fontSize || 16;
    const adjustedY = y + fontSize * 0.8;
    this.textElement = this.createTextElement(x, adjustedY);
    this.createTextInput(x, adjustedY, '', event);
  }

  override handlePointerUp(): void {
    if (this.textInput) {
      this.textInput.addEventListener('blur', () => this.finishTextInput());
      this.textInput.focus();
    }
  }
  private createTextElement(x: number, y: number): TextElement {
    const { snapToGrid: allowedSnap, gridSize } = this.whiteboardConfig;
    return createElement(
      ElementType.Text,
      {
        x: allowedSnap ? snapToGrid(x, gridSize) : x,
        y: allowedSnap ? snapToGrid(y, gridSize) : y,
        text: '',
        style: this.getElementStyle(),
        zIndex: this.apiService.getNextZIndex(),
      },
      this.apiService.getActiveLayerId()
    );
  }

  private createTextInput(x: number, y: number, initialValue = '', event?: PointerInfo): void {
    const borderOffset = 1;
    const fontSize = this.textElement?.style?.fontSize || 16;
    const baselineOffset = fontSize * 0.8;

    const svgElement = this.apiService.getCanvas();
    const container = svgElement.parentElement;

    if (!container) {
      console.error('Cannot find whiteboard container');
      return;
    }

    const containerRect = container.getBoundingClientRect();

    let calculatedLeft: number;
    let calculatedTop: number;

    if (event) {
      calculatedLeft = event.clientX - containerRect.left - borderOffset;
      calculatedTop = event.clientY - containerRect.top - borderOffset;
    } else {
      const config = this.whiteboardConfig;
      calculatedLeft = config.canvasX + (x + config.x) * config.zoom - borderOffset;
      calculatedTop = config.canvasY + (y + config.y) * config.zoom - borderOffset - baselineOffset * config.zoom;
    }

    const textarea = document.createElement('textarea');
    textarea.id = 'whiteboard-text-input';
    textarea.setAttribute('aria-label', 'Text input');

    textarea.style.position = 'absolute';
    textarea.style.left = `${calculatedLeft}px`;
    textarea.style.top = `${calculatedTop}px`;
    textarea.style.fontSize = `${this.textElement?.style?.fontSize || 16}px`;
    textarea.style.fontFamily = this.textElement?.style?.fontFamily || 'Arial';
    textarea.style.color = this.textElement?.style?.color || '#000000';
    textarea.style.fontWeight = this.textElement?.style?.fontWeight || 'normal';
    textarea.style.fontStyle = this.textElement?.style?.fontStyle || 'normal';
    textarea.style.border = '1px dashed #000';
    textarea.style.background = 'white';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';
    textarea.style.lineHeight = '1.2';
    textarea.style.whiteSpace = 'pre-wrap';
    textarea.style.margin = '0';
    textarea.style.padding = '2px';
    textarea.style.boxSizing = 'border-box';
    textarea.style.zIndex = '10000';
    textarea.style.pointerEvents = 'auto';
    textarea.value = initialValue;
    textarea.rows = 1;

    textarea.addEventListener('input', () => this.handleTextInput(textarea));
    textarea.addEventListener('keydown', (e) => {
      if (e.key === KEY.ENTER && e.ctrlKey) {
        e.preventDefault();
        this.finishTextInput();
      } else if (e.key === KEY.ESCAPE) {
        e.preventDefault();
        this.finishTextInput();
      }
    });

    if (container) {
      container.appendChild(textarea);
    } else {
      document.body.appendChild(textarea);
    }
    textarea.focus();

    this.textInput = textarea;
    this.handleTextInput(textarea);
  }

  private handleTextInput(input: HTMLTextAreaElement): void {
    const lines = input.value.split('\n');
    const maxLineLength = lines.reduce((max, line) => Math.max(max, line.length), 0);
    input.style.width = `${Math.max(maxLineLength, 10)}ch`;
    input.rows = Math.max(lines.length, 1);

    if (this.textElement) {
      this.textElement.text = input.value;
      this.apiService.updateElements([this.textElement]);
    }
  }

  private finishTextInput(): void {
    if (this.textInput && this.textElement) {
      if (this.textInput.value.trim()) {
        if (!this.apiService.elementExists(this.textElement.id)) {
          this.apiService.addElements([this.textElement]);

          if (this.textElement.selectAfterDraw) {
            this.apiService.selectElements([this.textElement.id]);
          }
        }
      } else {
        this.apiService.removeElements([this.textElement]);
      }

      try {
        if (this.textInput.parentElement) {
          this.textInput.parentElement.removeChild(this.textInput);
        }
      } catch {
        // Textarea already removed
      }

      this.textInput = null;
      this.textElement = null;
    }
  }

  private getElementStyle(): WhiteboardElementStyle {
    return {
      color: this.whiteboardConfig.strokeColor,
      fontSize: this.whiteboardConfig.fontSize,
      fontFamily: this.whiteboardConfig.fontFamily,
      lineJoin: this.whiteboardConfig.lineJoin,
      lineCap: this.whiteboardConfig.lineCap,
      dasharray: this.whiteboardConfig.dasharray,
      dashoffset: this.whiteboardConfig.dashoffset,
      strokeColor: this.whiteboardConfig.fill,
      strokeWidth: 0,
    };
  }
}
