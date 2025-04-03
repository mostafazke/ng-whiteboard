import { TextElement } from '../elements';
import { createElement } from '../elements/element.utils';
import { ElementType, ToolType, WhiteboardElementStyle } from '../types';
import { getTargetElement } from '../utils';
import { snapToGrid } from '../utils/utils';
import { BaseTool } from './base-tool';

export class TextTool extends BaseTool {
  type = ToolType.Text;
  private textElement: TextElement | null = null;
  private textInput: HTMLInputElement | null = null;

  override handlePointerDown(event: PointerEvent): void {
    if (!this.active) return;

    if (this.textInput) {
      this.finishTextInput();
      return;
    }

    // Check if the user clicked on an existing text element
    const targetElement = getTargetElement(event, this.dataService.getData());
    if (targetElement && targetElement.type === ElementType.Text) {
      this.textElement = targetElement;
      this.createTextInput(targetElement.x, targetElement.y, targetElement.text);
      return;
    }

    // Create a new text element
    const { x, y } = this.getPointerPosition(event);
    this.textElement = this.createTextElement(x, y);
    this.createTextInput(x, y);
  }

  override handlePointerUp(): void {
    if (this.textInput) {
      this.textInput.addEventListener('blur', () => this.finishTextInput());
      this.textInput.focus();
    }
  }
  private createTextElement(x: number, y: number): TextElement {
    const { snapToGrid: allowedSnap, gridSize } = this.whiteboardConfig;
    return createElement(ElementType.Text, {
      x: allowedSnap ? snapToGrid(x, gridSize) : x,
      y: allowedSnap ? snapToGrid(y, gridSize) : y,
      text: '',
      style: this.getElementStyle(),
    });
  }

  private createTextInput(x: number, y: number, initialValue = ''): void {
    const { zoom, elementsTranslation } = this.whiteboardConfig;
    const input = this.dataService.getCanvas().parentElement?.querySelector('#textInput') as HTMLInputElement;

    input.value = initialValue;
    input.style.left = `${(x - Math.abs(elementsTranslation.x)) * zoom}px`;
    input.style.top = `${(y - Math.abs(elementsTranslation.y)) * zoom}px`;
    input.style.fontFamily = this.textElement?.style.fontFamily || this.whiteboardConfig.fontFamily;
    input.style.fontSize = `${this.textElement?.style.fontSize || this.whiteboardConfig.fontSize}px`;
    input.style.color = this.textElement?.style.color || this.whiteboardConfig.strokeColor;
    input.style.transform = `scale(${this.textElement?.scaleX || 1}, ${this.textElement?.scaleY || 1})`;
    input.style.display = 'block';

    input.addEventListener('input', () => this.handleTextInput(input));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.finishTextInput();
    });
    this.textInput = input;
  }

  private handleTextInput(input: HTMLInputElement): void {
    input.style.width = `${input.value.length}ch`;

    if (this.textElement) {
      this.textElement.text = input.value;
      this.dataService.updateElement(this.textElement);
    }
  }

  private finishTextInput(): void {
    if (this.textInput && this.textElement) {
      if (this.textInput.value.trim()) {
        if (!this.dataService.hasElement(this.textElement)) {
          this.dataService.addElement(this.textElement);
          this.dataService.pushToUndo();
        }
      } else {
        this.dataService.removeElements([this.textElement.id]);
      }

      this.textInput.style.display = 'none';
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
