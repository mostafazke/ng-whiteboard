import { Component } from '@angular/core';
import { CodeBlockComponent } from '../../../shared/components/code-block/code-block.component';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-api-reference',
  templateUrl: './api-reference.component.html',
  styleUrls: ['./api-reference.component.scss'],
  standalone: true,
  imports: [CodeBlockComponent],
})
export class ApiReferenceComponent {
  activeTab = 'component';

  tabs: Tab[] = [
    { id: 'component', label: 'Component', icon: 'widgets' },
    { id: 'config', label: 'Configuration', icon: 'settings' },
    { id: 'service', label: 'Service API', icon: 'build_circle' },
    { id: 'examples', label: 'Examples', icon: 'code' },
  ];

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  // Code examples
  basicSetupCode = `import { Component, inject } from '@angular/core';
import { NgWhiteboardService, ToolType } from 'ng-whiteboard';

@Component({
  selector: 'app-my-whiteboard',
  template: \`
    <ng-whiteboard [boardId]="boardId" />
    <div>
      <p>Elements: {{ elements().length }}</p>
      <p>Layers: {{ layers().length }}</p>
      <button (click)="undo()" [disabled]="!canUndo()">Undo</button>
      <button (click)="redo()" [disabled]="!canRedo()">Redo</button>
    </div>
  \`,
  providers: [NgWhiteboardService]
})
export class MyWhiteboardComponent {
  private whiteboardService = inject(NgWhiteboardService);
  boardId = 'my-board';

  // Get reactive signals for this board
  private signals = this.whiteboardService.signals(this.boardId);
  elements = this.signals.elements;
  layers = this.signals.layers;
  canUndo = this.signals.canUndo;
  canRedo = this.signals.canRedo;

  constructor() {
    // Set this board as active for service operations
    this.whiteboardService.setActiveBoard(this.boardId);
  }

  undo() {
    this.whiteboardService.undo();
  }

  redo() {
    this.whiteboardService.redo();
  }
}`;

  multiBoardCode = `<!-- Template -->
<div class="board-tabs">
  @for (board of boards; track board.id) {
    <button (click)="switchBoard(board.id)">{{ board.name }}</button>
  }
</div>

<div class="board-container">
  @for (board of boards; track board.id) {
    <ng-whiteboard
      [boardId]="board.id"
      [style.display]="activeBoard === board.id ? 'block' : 'none'" />
  }
</div>

// Component:
export class MultiWhiteboardComponent {
  private whiteboardService = inject(NgWhiteboardService);
  activeBoard = 'board-1';

  boards = [
    { id: 'board-1', name: 'Design' },
    { id: 'board-2', name: 'Notes' },
    { id: 'board-3', name: 'Wireframes' }
  ];

  // Get signals for all boards
  board1Elements = this.whiteboardService.signals('board-1').elements;
  board2Elements = this.whiteboardService.signals('board-2').elements;

  switchBoard(boardId: string) {
    this.activeBoard = boardId;
    this.whiteboardService.setActiveBoard(boardId);
  }

  clearActiveBoard() {
    this.whiteboardService.clear();
  }
}`;

  elementsCode = `import { ToolType } from 'ng-whiteboard';

export class ElementsComponent {
  private whiteboardService = inject(NgWhiteboardService);
  boardId = 'my-board';

  constructor() {
    this.whiteboardService.setActiveBoard(this.boardId);
  }

  // Add a custom rectangle
  addCustomRectangle() {
    this.whiteboardService.addElement({
      id: crypto.randomUUID(),
      type: ToolType.Rectangle,
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      strokeColor: '#FF5722',
      fill: '#FFF3E0',
      strokeWidth: 2
    });
  }

  // Update selected elements
  changeColor(color: string) {
    this.whiteboardService.updateSelectedElements({
      strokeColor: color
    });
  }

  // Arrange elements
  bringToFront() {
    this.whiteboardService.bringToFront();
  }

  // Delete selected
  deleteSelected() {
    this.whiteboardService.deleteSelectedElements();
  }
}`;

  layerCode = `export class LayerComponent {
  private whiteboardService = inject(NgWhiteboardService);
  boardId = 'my-board';

  // Get reactive layer signals
  layers = this.whiteboardService.signals(this.boardId).layers;
  activeLayer = this.whiteboardService.signals(this.boardId).activeLayer;

  constructor() {
    this.whiteboardService.setActiveBoard(this.boardId);
  }

  addLayer(name: string) {
    const layer = this.whiteboardService.addLayer(name);
    console.log('New layer created:', layer);
  }

  toggleLayerVisibility(layerId: string) {
    this.whiteboardService.toggleLayerVisibility(layerId);
  }

  setLayerOpacity(layerId: string, opacity: number) {
    this.whiteboardService.setLayerOpacity(layerId, opacity);
  }

  deleteLayer(layerId: string) {
    this.whiteboardService.removeLayer(layerId);
  }
}`;

  canvasControlCode = `export class CanvasControlComponent {
  private whiteboardService = inject(NgWhiteboardService);
  boardId = 'my-board';

  constructor() {
    this.whiteboardService.setActiveBoard(this.boardId);
  }

  // Zoom controls
  zoomIn() {
    this.whiteboardService.zoomIn();
  }

  zoomOut() {
    this.whiteboardService.zoomOut();
  }

  resetZoom() {
    this.whiteboardService.resetZoom();
  }

  fitToScreen() {
    this.whiteboardService.zoomToFit();
  }

  // Pan controls
  panToCenter() {
    this.whiteboardService.panTo(0, 0);
  }

  // Grid controls
  toggleGrid() {
    this.whiteboardService.toggleGrid();
  }

  setGridSize(size: number) {
    this.whiteboardService.setGridSize(size);
  }
}`;

  dataCode = `export class DataComponent {
  private whiteboardService = inject(NgWhiteboardService);
  boardId = 'my-board';

  constructor() {
    this.whiteboardService.setActiveBoard(this.boardId);
  }

  // Export as JSON string
  exportToJSON() {
    const data = this.whiteboardService.exportData();
    console.log('Whiteboard data:', data);

    // Save to localStorage
    localStorage.setItem('whiteboard-data', data);
  }

  // Import from JSON
  importFromJSON() {
    const data = localStorage.getItem('whiteboard-data');
    if (data) {
      this.whiteboardService.importData(data);
    }
  }

  // Save in different formats
  saveAsSVG() {
    this.whiteboardService.save('svg', 'my-whiteboard');
  }

  saveAsPNG() {
    this.whiteboardService.save('base64', 'my-whiteboard');
  }

  // Clear everything
  clearWhiteboard() {
    if (confirm('Clear all content?')) {
      this.whiteboardService.clear();
    }
  }
}`;

  clipboardCode = `export class ClipboardComponent {
  private whiteboardService = inject(NgWhiteboardService);
  boardId = 'my-board';

  constructor() {
    this.whiteboardService.setActiveBoard(this.boardId);
  }

  copy() {
    this.whiteboardService.copyElements();
  }

  cut() {
    this.whiteboardService.cutElements();
  }

  paste() {
    this.whiteboardService.pasteElements();
  }

  duplicate() {
    this.whiteboardService.duplicateElements();
  }
}`;
}
