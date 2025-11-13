import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { ConnectedPosition, OverlayModule, ScrollStrategyOptions } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import {
  BLEND_MODES,
  BlendMode,
  BlendModeOption,
  FormatType,
  NgWhiteboardComponent,
  NgWhiteboardService,
  ToolType,
  WhiteboardConfig,
  WhiteboardElement,
} from 'ng-whiteboard';

/**
 * Professional whiteboard component with modern UI and layer support
 * Features:
 * - Multiple drawing tools (pen, shapes, text, etc.)
 * - Layer management (add, delete, rename, visibility, lock)
 * - Customizable colors and stroke widths
 * - Import/export functionality
 * - Keyboard shortcuts
 */
@Component({
  selector: 'app-basic-component',
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, FormsModule, NgWhiteboardComponent, CdkDropList, CdkDrag, CdkDragHandle, OverlayModule],
  providers: [NgWhiteboardService],
})
export class BasicComponent implements OnDestroy {
  private whiteboardService = inject(NgWhiteboardService);
  private sanitizer = inject(DomSanitizer);
  private scrollStrategyOptions = inject(ScrollStrategyOptions);
  private clickOutsideListener?: (event: MouseEvent) => void;

  @Input() data: WhiteboardElement[] = [];
  @Output() dataChange = new EventEmitter<WhiteboardElement[]>();

  boardId = 'whiteboard-app';

  private boardSignals = this.whiteboardService.signals(this.boardId);

  // Access reactive signals
  layers = this.boardSignals.layers;
  activeLayerId = this.boardSignals.activeLayerId;
  activeLayer = this.boardSignals.activeLayer;
  selectedTool = this.boardSignals.selectedTool;
  canUndo = this.boardSignals.canUndo;
  canRedo = this.boardSignals.canRedo;
  availableTools = this.boardSignals.availableTools;
  selectedElements = this.boardSignals.selectedElements;
  whiteboardConfig = this.boardSignals.config;

  formatType = FormatType;
  toolType = ToolType;

  // Computed properties for effective stroke color and width
  // These reflect the config values which are kept in sync with selections
  selectedColor = computed(() => {
    const selected = this.selectedElements();
    if (selected.length > 0 && selected[0].style?.strokeColor) {
      // Return the stroke color of the first selected element
      return selected[0].style.strokeColor;
    }
    return this.config().strokeColor || '#000000';
  });

  selectedWidth = computed(() => {
    const selected = this.selectedElements();
    if (selected.length > 0 && selected[0].style?.strokeWidth !== undefined) {
      // Return the stroke width of the first selected element
      return selected[0].style.strokeWidth;
    }
    return this.config().strokeWidth || 3;
  });

  // Computed zoom level from config as percentage
  zoomLevel = computed(() => {
    const zoom = this.whiteboardConfig().zoom || 1;
    return Math.round(zoom * 100);
  });

  // UI state
  showColorPalette = signal(false);
  showBackgroundPalette = signal(false);
  showWidthMenu = signal(false);
  showMoreMenu = signal(false);
  isFullscreen = signal(false);
  showFullscreenHint = signal(false);
  boardTitle = signal('Untitled Board');
  isEditingTitle = signal(false);

  showLayersMenu = signal<boolean>(false);
  editingLayerId = signal<string | null>(null);
  showLayerContextMenu = signal<string | null>(null);

  // CDK Overlay configuration
  overlayScrollStrategy = this.scrollStrategyOptions.close();
  contextMenuPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -6,
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -6,
    },
  ];

  // Blend mode constants
  readonly blendModes = BLEND_MODES;
  readonly blendModeCategories = [
    { name: 'Normal', modes: BLEND_MODES.filter((m: BlendModeOption) => m.category === 'normal') },
    { name: 'Darken', modes: BLEND_MODES.filter((m: BlendModeOption) => m.category === 'darken') },
    { name: 'Lighten', modes: BLEND_MODES.filter((m: BlendModeOption) => m.category === 'lighten') },
    { name: 'Contrast', modes: BLEND_MODES.filter((m: BlendModeOption) => m.category === 'contrast') },
    { name: 'Component', modes: BLEND_MODES.filter((m: BlendModeOption) => m.category === 'component') },
  ];

  primaryTools = computed(() => {
    const tools = this.availableTools();
    const primaryTypes = [ToolType.Hand, ToolType.Select, ToolType.Pen, ToolType.Eraser];
    return tools
      .filter((tool) => primaryTypes.includes(tool.type) && tool.enabled)
      .map((tool) => ({
        type: tool.type,
        name: tool.name,
        description: tool.description,
        icon: this.sanitizer.bypassSecurityTrustHtml(tool.icon || ''),
      }))
      .sort((a, b) => primaryTypes.indexOf(a.type) - primaryTypes.indexOf(b.type));
  });

  shapeTools = computed(() => {
    const tools = this.availableTools();
    const shapeTypes = [ToolType.Line, ToolType.Arrow, ToolType.Rectangle, ToolType.Ellipse, ToolType.Text];
    return tools
      .filter((tool) => shapeTypes.includes(tool.type) && tool.enabled)
      .map((tool) => ({
        type: tool.type,
        name: tool.name,
        description: tool.description,
        icon: this.sanitizer.bypassSecurityTrustHtml(tool.icon || ''),
      }))
      .sort((a, b) => shapeTypes.indexOf(a.type) - shapeTypes.indexOf(b.type));
  });

  quickColors = [
    '#000000',
    '#ffffff',
    '#dc2626',
    '#ea580c',
    '#d97706',
    '#65a30d',
    '#059669',
    '#0891b2',
    '#2563eb',
    '#7c3aed',
    '#c026d3',
    '#e11d48',
  ];

  strokeWidths = [1, 2, 3, 5, 8, 12, 16, 20];

  config = signal<Partial<WhiteboardConfig>>({
    strokeColor: '#000000',
    backgroundColor: '#ffffff',
    strokeWidth: 3,
    fullScreen: true,
    enableGrid: false,
    snapToGrid: false,
    gridSize: 20,
  });

  constructor() {
    this.whiteboardService.setActiveBoard(this.boardId);
    this.setupClickOutsideHandler();
  }

  ngOnDestroy(): void {
    if (this.clickOutsideListener && typeof document !== 'undefined') {
      document.removeEventListener('click', this.clickOutsideListener);
    }

    if (this.isFullscreen()) {
      document.body.style.overflow = '';
    }
  }

  onDataChange(data: WhiteboardElement[]): void {
    this.dataChange.emit(data);
  }

  selectTool(tool: ToolType) {
    this.whiteboardService.setActiveTool(tool);
    this.closeAllMenus();
  }

  selectColor(color: string) {
    const selected = this.selectedElements();

    if (selected.length > 0) {
      // Update all selected elements with the new color while preserving other style properties
      this.whiteboardService.updateSelectedElements({
        style: {
          ...selected[0].style,
          strokeColor: color,
        },
      });
    }

    // Always update config for consistent UI and future drawings
    this.config.update((cfg) => ({ ...cfg, strokeColor: color }));
    this.showColorPalette.set(false);
  }

  selectWidth(width: number) {
    const selected = this.selectedElements();

    if (selected.length > 0) {
      // Update all selected elements with the new width while preserving other style properties
      this.whiteboardService.updateSelectedElements({
        style: {
          ...selected[0].style,
          strokeWidth: width,
        },
      });
    }

    // Always update config for consistent UI and future drawings
    this.config.update((cfg) => ({ ...cfg, strokeWidth: width }));
    this.showWidthMenu.set(false);
  }

  selectBackgroundColor(color: string) {
    this.config.update((cfg) => ({ ...cfg, backgroundColor: color }));
    this.showBackgroundPalette.set(false);
  }

  closeAllMenus() {
    this.showColorPalette.set(false);
    this.showBackgroundPalette.set(false);
    this.showWidthMenu.set(false);
    this.showMoreMenu.set(false);
  }

  toggleColorPalette() {
    this.showColorPalette.set(!this.showColorPalette());
    this.showBackgroundPalette.set(false);
    this.showWidthMenu.set(false);
    this.showMoreMenu.set(false);
  }

  toggleBackgroundPalette() {
    this.showBackgroundPalette.set(!this.showBackgroundPalette());
    this.showColorPalette.set(false);
    this.showWidthMenu.set(false);
    this.showMoreMenu.set(false);
  }

  toggleWidthMenu() {
    this.showWidthMenu.set(!this.showWidthMenu());
    this.showColorPalette.set(false);
    this.showBackgroundPalette.set(false);
    this.showMoreMenu.set(false);
  }

  toggleMoreMenu() {
    this.showMoreMenu.set(!this.showMoreMenu());
    this.showColorPalette.set(false);
    this.showBackgroundPalette.set(false);
    this.showWidthMenu.set(false);
  }

  startEditingTitle() {
    this.isEditingTitle.set(true);
  }

  finishEditingTitle(event: Event) {
    const input = event.target as HTMLInputElement;
    this.boardTitle.set(input.value || 'Untitled Board');
    this.isEditingTitle.set(false);
  }

  undo() {
    this.whiteboardService.undo();
  }

  redo() {
    this.whiteboardService.redo();
  }

  clear(): void {
    this.whiteboardService.clear();
  }

  zoomIn() {
    this.whiteboardService.zoomIn();
  }

  zoomOut() {
    this.whiteboardService.zoomOut();
  }

  resetZoom() {
    this.whiteboardService.resetZoom();
  }

  toggleFullscreen() {
    const newFullscreenState = !this.isFullscreen();
    this.isFullscreen.set(newFullscreenState);

    if (newFullscreenState) {
      document.body.style.overflow = 'hidden';

      this.showFullscreenHint.set(true);

      setTimeout(() => {
        this.showFullscreenHint.set(false);
      }, 3000);
    } else {
      document.body.style.overflow = '';
      this.showFullscreenHint.set(false);
    }
    this.closeAllMenus();
  }

  toggleGrid() {
    this.config.update((cfg) => ({
      ...cfg,
      enableGrid: !cfg.enableGrid,
    }));
    this.showMoreMenu.set(false);
  }

  toggleLayersMenu() {
    this.showLayersMenu.update((v) => !v);
    this.showLayerContextMenu.set(null);
  }

  switchToLayer(layerId: string): void {
    this.whiteboardService.setActiveLayer(layerId);
    this.showLayerContextMenu.set(null);

    const layer = this.layers().find((l) => l.id === layerId);
    if (layer?.locked) {
      console.info(`Active layer "${layer.name}" is locked. Drawing is disabled on locked layers.`);
    }
  }

  addLayer(): void {
    const layerCount = this.layers().length;
    this.whiteboardService.addLayer(`Layer ${layerCount + 1}`);
    this.showLayerContextMenu.set(null);
  }

  deleteLayer(layerId: string): void {
    const layer = this.layers().find((l) => l.id === layerId);
    const layerName = layer?.name || 'this layer';

    const confirmed = confirm(`Are you sure you want to delete "${layerName}"? This action cannot be undone.`);
    if (!confirmed) return;

    const success = this.whiteboardService.removeLayer(layerId);
    if (!success) {
      alert('Cannot delete the last layer. At least one layer is required.');
    }
    this.showLayerContextMenu.set(null);
  }

  startRenameLayer(layerId: string): void {
    this.editingLayerId.set(layerId);
    this.showLayerContextMenu.set(null);

    setTimeout(() => {
      const input = document.querySelector('.layer-name-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  }

  finishRenameLayer(event: Event, layerId: string): void {
    const input = event.target as HTMLInputElement;
    const newName = input.value.trim();

    if (!newName) {
      alert('Layer name cannot be empty.');
      input.focus();
      return;
    }

    if (newName.length > 50) {
      alert('Layer name is too long. Maximum 50 characters.');
      input.focus();
      return;
    }

    this.whiteboardService.renameLayer(layerId, newName);
    this.editingLayerId.set(null);
  }

  toggleLayerVisibility(layerId: string): void {
    this.whiteboardService.toggleLayerVisibility(layerId);
  }

  toggleLayerLock(layerId: string): void {
    const layer = this.layers().find((l) => l.id === layerId);
    if (!layer) return;

    this.whiteboardService.toggleLayerLock(layerId);
  }

  toggleLayerContextMenu(layerId: string): void {
    this.showLayerContextMenu.update((current) => (current === layerId ? null : layerId));
  }

  closeLayerContextMenu(): void {
    this.showLayerContextMenu.set(null);
  }

  onLayersListScroll(): void {
    // Close context menu when layers list scrolls (handled by CDK overlay scroll strategy)
  }

  onLayerDrop(event: CdkDragDrop<string[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    this.whiteboardService.reorderLayersByIndex(event.previousIndex, event.currentIndex);
  }

  async saveAsImage(): Promise<void> {
    try {
      await this.whiteboardService.save(FormatType.Png, this.boardTitle());
      this.showMoreMenu.set(false);
      console.log('Whiteboard saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save whiteboard as image. Please try again.');
    }
  }

  exportBoard(): void {
    try {
      const data = this.whiteboardService.exportData();
      if (!data) {
        alert('No data to export.');
        return;
      }

      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `${this.boardTitle()}_${timestamp}.json`;
      link.click();
      URL.revokeObjectURL(url);
      this.showMoreMenu.set(false);
      console.log('Board exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export board data. Please try again.');
    }
  }

  importBoard(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    if (!file.name.endsWith('.json')) {
      alert('Please select a valid JSON file.');
      input.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File is too large. Maximum size is 10MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const jsonData = e.target?.result as string;
        if (!jsonData) {
          throw new Error('Failed to read file');
        }

        JSON.parse(jsonData);

        this.whiteboardService.importData(jsonData);
        input.value = '';
        this.showMoreMenu.set(false);
        console.log('Board imported successfully');
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import board data. The file may be corrupted or invalid.');
        input.value = '';
      }
    };

    reader.onerror = () => {
      alert('Failed to read file. Please try again.');
      input.value = '';
    };

    reader.readAsText(file);
  }

  uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
      input.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image is too large. Maximum size is 5MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const image = e.target?.result as string;
        if (!image) {
          throw new Error('Failed to read image');
        }

        this.whiteboardService.addImage({ image });
        input.value = '';
        this.showMoreMenu.set(false);
        console.log('Image uploaded successfully');
      } catch (error) {
        console.error('Image upload failed:', error);
        alert('Failed to upload image. Please try again.');
        input.value = '';
      }
    };

    reader.onerror = () => {
      alert('Failed to read image file. Please try again.');
      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    const success = this.whiteboardService.setLayerOpacity(layerId, opacity);
    if (!success) {
      console.warn('Failed to set layer opacity');
    }
  }

  /**
   * Set layer blend mode
   */
  setLayerBlendMode(layerId: string, blendMode: BlendMode): void {
    const success = this.whiteboardService.setLayerBlendMode(layerId, blendMode);
    if (!success) {
      console.warn('Failed to set layer blend mode');
    }
  }

  /**
   * Get layer opacity as percentage for display
   */
  getLayerOpacityPercent(layerId: string): number {
    const layer = this.layers().find((l) => l.id === layerId);
    return layer && layer.opacity !== undefined ? Math.round(layer.opacity * 100) : 100;
  }

  /**
   * Get layer blend mode
   */
  getLayerBlendMode(layerId: string): BlendMode {
    const layer = this.layers().find((l) => l.id === layerId);
    return (layer?.blendMode as BlendMode) || 'normal';
  }

  onMenuItemClick() {
    this.showMoreMenu.set(false);
  }

  onSave() {
    console.log('Whiteboard auto-saved');
  }

  onReady() {
    console.log('Whiteboard ready');
  }

  private setupClickOutsideHandler(): void {
    if (typeof document === 'undefined') return;

    this.clickOutsideListener = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (this.showLayersMenu() && !target.closest('.layers-section') && !target.closest('.cdk-overlay-container')) {
        setTimeout(() => this.showLayersMenu.set(false), 0);
      }

      // CDK overlay handles context menu clicks with backdrop

      if (this.showColorPalette() && !target.closest('.prop-color-btn, .floating-color-palette')) {
        setTimeout(() => this.showColorPalette.set(false), 0);
      }

      if (this.showBackgroundPalette() && !target.closest('.prop-color-btn, .floating-color-palette')) {
        setTimeout(() => this.showBackgroundPalette.set(false), 0);
      }

      if (this.showWidthMenu() && !target.closest('.prop-width-btn, .floating-width-menu')) {
        setTimeout(() => this.showWidthMenu.set(false), 0);
      }

      if (this.showMoreMenu() && !target.closest('.more-menu-wrapper, .more-menu')) {
        setTimeout(() => this.showMoreMenu.set(false), 0);
      }
    };

    document.addEventListener('click', this.clickOutsideListener);
  }
}
