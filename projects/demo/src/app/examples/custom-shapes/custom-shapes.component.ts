import { Component, inject } from '@angular/core';
import { NgWhiteboardComponent, NgWhiteboardService, ShapeDefinition, WhiteboardConfig } from 'ng-whiteboard';

const CUSTOM_SHAPES: ShapeDefinition[] = [
  {
    id: 'pentagon',
    name: 'Pentagon',
    path: 'm0.99791,0.9981l162.54547,0l135.45454,149.40899l-135.45454,149.40898l-162.54547,0z',
  },
  {
    id: 'cloud',
    name: 'Cloud',
    path: 'M25,60 C5,60 5,30 25,30 C25,10 55,5 65,22 C75,2 110,8 108,32 C130,30 135,60 112,60 Z',
  },
];

@Component({
  selector: 'app-custom-shapes',
  template: `<div class="custom-shapes">
    <div class="controls">
      <label><input type="checkbox" [checked]="config.enableShapes" (change)="toggleShapes()" /> Enable shapes</label>
      <button type="button" (click)="addCloud()">Add cloud</button>
    </div>
    <ng-whiteboard [boardId]="boardId" [config]="config"></ng-whiteboard>
  </div>`,
  styles: `
    :host,
    .custom-shapes {
      display: block;
      height: 100%;
      position: relative;
    }
    .controls {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 10;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .controls button {
      padding: 6px 12px;
      cursor: pointer;
    }
  `,
  standalone: true,
  providers: [NgWhiteboardService],
  imports: [NgWhiteboardComponent],
})
export class CustomShapesComponent {
  private whiteboardService = inject(NgWhiteboardService);

  boardId = 'custom-shapes-board';

  config: Partial<WhiteboardConfig> = {
    fullScreen: true,
    enableShapes: true,
    shapes: CUSTOM_SHAPES,
    shapeId: 'cloud',
  };

  constructor() {
    this.whiteboardService.setActiveBoard(this.boardId);
  }

  toggleShapes() {
    this.config = { ...this.config, enableShapes: !this.config.enableShapes };
  }

  addCloud() {
    this.whiteboardService.addShape('cloud', { x: 120, y: 120, width: 160 });
  }
}
