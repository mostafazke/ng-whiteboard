import { Component } from '@angular/core';
import { CodeBlockComponent } from '../../../shared/components/code-block/code-block.component';

@Component({
  selector: 'app-arrow-configuration',
  templateUrl: './arrow-configuration.component.html',
  styleUrls: ['./arrow-configuration.component.scss'],
  standalone: true,
  imports: [CodeBlockComponent],
})
export class ArrowConfigurationComponent {
  activeSection = 'overview';

  sections = [
    { id: 'overview', label: 'Overview', icon: 'info' },
    { id: 'heads', label: 'Arrowheads', icon: 'arrow_forward' },
    { id: 'paths', label: 'Line Styles', icon: 'timeline' },
    { id: 'binding', label: 'Element Binding', icon: 'link' },
  ];

  setActiveSection(sectionId: string): void {
    this.activeSection = sectionId;
  }

  basicConfigCode = `import { Component } from '@angular/core';
import { NgWhiteboardComponent, WhiteboardConfig } from 'ng-whiteboard';

@Component({
  selector: 'app-arrow-whiteboard',
  standalone: true,
  imports: [NgWhiteboardComponent],
  template: \`
    <ng-whiteboard [config]="config"></ng-whiteboard>
  \`
})
export class ArrowWhiteboardComponent {
  config: Partial<WhiteboardConfig> = {
    arrowConfig: {
      startHeadStyle: 'none',
      endHeadStyle: 'open-arrow',
      lineStyle: 'curve',
    },
  };
}`;

  customHeadsCode = `// Filled arrow with diamond start
config: Partial<WhiteboardConfig> = {
  arrowConfig: {
    startHeadStyle: 'diamond',
    endHeadStyle: 'arrow',
    lineStyle: 'straight',
  },
};

// Bi-directional arrow
config: Partial<WhiteboardConfig> = {
  arrowConfig: {
    startHeadStyle: 'open-arrow',
    endHeadStyle: 'open-arrow',
    lineStyle: 'curve',
  },
};

// Line with circle endpoints
config: Partial<WhiteboardConfig> = {
  arrowConfig: {
    startHeadStyle: 'circle',
    endHeadStyle: 'circle',
    lineStyle: 'straight',
  },
};`;

  lineStylesCode = `// Straight arrow (direct line)
arrowConfig: {
  lineStyle: 'straight',
  startHeadStyle: 'none',
  endHeadStyle: 'arrow',
}

// Curved arrow (quadratic bezier with draggable control point)
arrowConfig: {
  lineStyle: 'curve',
  startHeadStyle: 'none',
  endHeadStyle: 'open-arrow',
}

// Elbow arrow (orthogonal right-angle connector)
arrowConfig: {
  lineStyle: 'elbow',
  startHeadStyle: 'none',
  endHeadStyle: 'arrow',
}`;

  dynamicConfigCode = `import { Component, inject } from '@angular/core';
import {
  NgWhiteboardComponent,
  NgWhiteboardService,
  ArrowConfig,
  ToolType,
} from 'ng-whiteboard';

@Component({
  selector: 'app-dynamic-arrows',
  standalone: true,
  imports: [NgWhiteboardComponent],
  providers: [NgWhiteboardService],
  template: \`
    <div class="toolbar">
      <button (click)="setFlowchartArrow()">Flowchart</button>
      <button (click)="setBidirectionalArrow()">Bidirectional</button>
      <button (click)="setDependencyArrow()">Dependency</button>
    </div>
    <ng-whiteboard [boardId]="boardId" [config]="config"></ng-whiteboard>
  \`
})
export class DynamicArrowsComponent {
  private whiteboardService = inject(NgWhiteboardService);
  boardId = 'arrows-board';

  config: Partial<WhiteboardConfig> = {};

  constructor() {
    this.whiteboardService.setActiveBoard(this.boardId);
  }

  setFlowchartArrow() {
    this.whiteboardService.updateConfig({
      arrowConfig: {
        startHeadStyle: 'none',
        endHeadStyle: 'arrow',
        lineStyle: 'elbow',
      },
    });
    this.whiteboardService.setActiveTool(ToolType.Arrow);
  }

  setBidirectionalArrow() {
    this.whiteboardService.updateConfig({
      arrowConfig: {
        startHeadStyle: 'open-arrow',
        endHeadStyle: 'open-arrow',
        lineStyle: 'curve',
      },
    });
    this.whiteboardService.setActiveTool(ToolType.Arrow);
  }

  setDependencyArrow() {
    this.whiteboardService.updateConfig({
      arrowConfig: {
        startHeadStyle: 'circle',
        endHeadStyle: 'open-arrow',
        lineStyle: 'straight',
      },
    });
    this.whiteboardService.setActiveTool(ToolType.Arrow);
  }
}`;
}
