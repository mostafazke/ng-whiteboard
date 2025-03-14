import { ITEM_PREFIX } from '../constants';
import { getElementUtil } from '../elements/element.utils';
import { Direction, ToolType } from '../types';
import { getMouseTarget } from '../utils';
import { BaseTool } from './base-tool';

export class SelectTool extends BaseTool {
  type = ToolType.Select;
  isDragging = false;
  currentAction: 'select' | 'resize' | 'move' | null = null;
  direction: Direction = Direction.E;

  override handlePointerDown(event: PointerEvent): void {
    const mouseTarget = getMouseTarget(event);
    if (mouseTarget) {
      const id = mouseTarget.id;
      if (id.includes(ITEM_PREFIX)) {
        this.currentAction = 'select';
        this.handleSelect(mouseTarget.getAttribute('data-wb-id'));
      } else if (id.includes('selectorGrip_resize')) {
        this.currentAction = 'resize';
        this.direction = id.split('_')[2] as Direction;
        this.handleResize(event);
      } else if (id.includes('selectorBox')) {
        this.currentAction = 'move';
        this.handleMove(event);
      }
      this.isDragging = true;
    } else {
      this.dataService.selectElement(null);
      this.currentAction = null;
    }
  }

  override handlePointerMove(event: PointerEvent): void {
    if (this.isDragging && this.currentAction) {
      switch (this.currentAction) {
        case 'resize':
          this.handleResize(event);
          break;
        default:
          this.handleMove(event);
          break;
      }
    }
  }

  override handlePointerUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.currentAction = null;
    }
  }

  private handleSelect(id: string | null): void {
    const element = this.dataService.getData().find((el) => el.id === id);
    if (element) {
      this.dataService.selectElement(element);
    }
  }

  private handleResize(event: PointerEvent): void {
    const selectedElement = this.dataService.getSelectedElement();
    if (!selectedElement) return;

    this.dataService.showGrips(this.dataService.getElementBbox(selectedElement));

    const movementX = event.movementX;
    const movementY = event.movementY;
    const element = getElementUtil(selectedElement.type).resize(selectedElement, this.direction, movementX, movementY);
    this.dataService.updateSelectedElement(element);
  }

  private handleMove(event: PointerEvent): void {
    const selectedElement = this.dataService.getSelectedElement();
    if (selectedElement) {
      const x = selectedElement.x + event.movementX;
      const y = selectedElement.y + event.movementY;
      this.dataService.updateSelectedElement({ x, y });
    }
  }
}
