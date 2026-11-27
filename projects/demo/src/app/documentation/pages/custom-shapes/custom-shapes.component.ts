import { Component } from '@angular/core';
import { CodeBlockComponent } from '../../../shared/components/code-block/code-block.component';

@Component({
  selector: 'app-custom-shapes-docs',
  templateUrl: './custom-shapes.component.html',
  styleUrls: ['./custom-shapes.component.scss'],
  standalone: true,
  imports: [CodeBlockComponent],
})
export class CustomShapesDocsComponent {
  builtInShapes = [
    'triangle',
    'right-triangle',
    'diamond',
    'pentagon',
    'hexagon',
    'octagon',
    'star',
    'heart',
    'cross',
    'parallelogram',
    'trapezoid',
    'speech-bubble',
  ];

  definitionCode = `import { ShapeDefinition } from 'ng-whiteboard';

const tag: ShapeDefinition = {
  id: 'tag', // unique key, used by shapeId and addShape()
  name: 'Tag', // tooltip and accessible label in the shapes menu
  path: 'm0.99791,0.9981l162.54547,0l135.45454,149.40899l-135.45454,149.40898l-162.54547,0z',
};`;

  basicCode = `import { Component } from '@angular/core';
import { NgWhiteboardComponent, WhiteboardConfig } from 'ng-whiteboard';

@Component({
  selector: 'app-shapes-board',
  standalone: true,
  imports: [NgWhiteboardComponent],
  template: \`<ng-whiteboard [config]="config"></ng-whiteboard>\`,
})
export class ShapesBoardComponent {
  config: Partial<WhiteboardConfig> = {
    shapes: [
      {
        id: 'tag',
        name: 'Tag',
        path: 'm0.99791,0.9981l162.54547,0l135.45454,149.40899l-135.45454,149.40898l-162.54547,0z',
      },
      {
        id: 'house',
        name: 'House',
        path: 'M50 0 L100 40 L100 100 L0 100 L0 40 Z',
      },
    ],
  };
}`;

  builtInCode = `// All 12 built-ins (default)
config = { builtInShapes: true };

// Only some built-ins, in this order, followed by your shapes
config = {
  builtInShapes: ['star', 'heart', 'diamond'],
  shapes: [tag],
};

// Only your shapes
config = { builtInShapes: false, shapes: [tag] };

// Replace a built-in: same id, new path, same place in the menu
config = {
  shapes: [{ id: 'star', name: 'Star', path: 'M50 0 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z' }],
};

// Shape drawn by the Shape tool before the user picks one
config = { shapes: [tag], shapeId: 'tag' };`;

  addShapeCode = `import { Component, inject } from '@angular/core';
import { NgWhiteboardComponent, NgWhiteboardService, WhiteboardConfig } from 'ng-whiteboard';

@Component({
  selector: 'app-shapes-api',
  standalone: true,
  imports: [NgWhiteboardComponent],
  template: \`
    <button (click)="addTag()">Add tag</button>
    <ng-whiteboard [boardId]="boardId" [config]="config"></ng-whiteboard>
  \`,
})
export class ShapesApiComponent {
  private whiteboard = inject(NgWhiteboardService);
  boardId = 'shapes-board';
  config: Partial<WhiteboardConfig> = { shapes: [tag] };

  constructor() {
    this.whiteboard.setActiveBoard(this.boardId);
  }

  addTag() {
    // Width defaults to 100; height follows the shape's aspect ratio.
    const element = this.whiteboard.addShape('tag', {
      x: 120,
      y: 80,
      width: 200,
      style: { fill: '#ffe08a', strokeColor: '#333' },
    });
    if (!element) console.warn('Unknown shape id, or shapes are disabled');
  }

  listShapes() {
    return this.whiteboard.getAvailableShapes(); // built-ins + yours, in menu order
  }
}`;

  toggleCode = `// Turn the whole feature off
config = { enableShapes: false };

// Switch it at runtime
toggleShapes() {
  this.config = { ...this.config, enableShapes: !this.config.enableShapes };
}

// Keep shapes available to addShape() but hide the ⋯ button
config = {
  toolbarTools: [ToolType.Select, ToolType.Pen, ToolType.Rectangle, ToolType.Ellipse, ToolType.Arrow],
};`;
}
