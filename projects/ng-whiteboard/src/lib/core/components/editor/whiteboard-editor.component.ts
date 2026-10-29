import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BlendMode, FormatType, ToolType } from '../../types';
import { EditorStateService, Layer } from './editor-state.service';
import { IconComponent } from './icon/icon.component';
import { ControlsPanelComponent } from './panels/controls-panel/controls-panel.component';
import { HeaderPanelComponent } from './panels/header-panel/header-panel.component';
import { HistoryPanelComponent } from './panels/history-panel/history-panel.component';
import { PropertiesPanelComponent } from './panels/properties-panel/properties-panel.component';
import { ToolbarComponent } from './panels/toolbar/toolbar.component';
import { AlignmentControlsComponent, AlignmentType } from './ui/alignment-controls/alignment-controls.component';
import { ColorPickerComponent } from './ui/color-picker/color-picker.component';

@Component({
  selector: 'ng-whiteboard-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    HeaderPanelComponent,
    HistoryPanelComponent,
    PropertiesPanelComponent,
    ToolbarComponent,
    ControlsPanelComponent,
    ColorPickerComponent,
    AlignmentControlsComponent,
  ],
  templateUrl: './whiteboard-editor.component.html',
  styleUrl: './whiteboard-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [EditorStateService],
})
export class WhiteboardEditorComponent {
  public editorStateService = inject(EditorStateService);

  // Reactive signals for better performance
  configSignal = this.editorStateService.getConfigSignal();
  editorConfigSignal = this.editorStateService.getEditorConfigSignal();
  themeSignal = this.editorStateService.themeSignal;
  // UI State signals
  isPanelOpenSignal = signal(true);
  isEditingTitleSignal = signal(false);
  showLayersDropdownSignal = signal(false);
  showLayerPanelSignal = signal(false);
  showZoomPopupSignal = signal(false);
  showExtendedToolsSignal = signal(false);

  // Expose editor state signals
  selectedElementsSignal = this.editorStateService.selectedElementsSignal;
  selectedToolSignal = this.editorStateService.selectedToolSignal;
  layersSignal = this.editorStateService.layersSignal;
  activeLayerIdSignal = this.editorStateService.activeLayerIdSignal;
  hasSelectionSignal = this.editorStateService.hasSelectionSignal;
  canUndoSignal = this.editorStateService.canUndoSignal;
  canRedoSignal = this.editorStateService.canRedoSignal;
  selectedPropertiesSignal = this.editorStateService.selectedPropertiesSignal;

  /**
   * Handle editor-specific keyboard shortcuts
   * Note: Most shortcuts (undo/redo, copy/paste, zoom, etc.) are handled by the whiteboard library's KeyboardShortcutService
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    // Don't handle shortcuts when editing text
    if (this.isEditingTitleSignal()) return;

    // Toggle Properties Panel: P (editor-specific UI shortcut)
    if (event.key === 'p' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      this.togglePanel();
      return;
    }
  }

  // Header Panel Events
  onTitleChange(title: string) {
    this.editorStateService.updateTitle(title);
  }

  onTitleEditStart() {
    this.isEditingTitleSignal.set(true);
  }

  onTitleEditEnd() {
    this.isEditingTitleSignal.set(false);
  }

  toggleLayersDropdown() {
    this.showLayersDropdownSignal.update((value) => !value);
  }

  onLayerVisibilityToggle(layer: Layer) {
    this.editorStateService.toggleLayerVisibility(layer.id);
  }

  onLayerLockToggle(layer: Layer) {
    this.editorStateService.toggleLayerLock(layer.id);
  }

  onLayerAdd() {
    const layers = this.layersSignal();
    this.editorStateService.addLayer(`Layer ${layers.length + 1}`);
  }

  // Layer Panel Event Handlers (for header panel integration)
  onLayerPanelLayerSelected(layerId: string) {
    console.log(`Editor: Received layer selection event for ${layerId}`);
    this.editorStateService.setActiveLayer(layerId);
  }

  onLayerPanelLayerDeleted(layerId: string) {
    this.editorStateService.removeLayer(layerId);
  }

  onLayerPanelLayerRenamed(event: { layerId: string; name: string }) {
    this.editorStateService.updateLayer(event.layerId, { name: event.name });
  }

  onLayerPanelOpacityChanged(event: { layerId: string; opacity: number }) {
    // Convert percentage to decimal (0-1)
    const opacity = event.opacity / 100;
    this.editorStateService.setLayerOpacity(event.layerId, opacity);
  }

  onLayerPanelLayerMoved(event: { layerId: string; direction: 'up' | 'down' }) {
    if (event.direction === 'up') {
      this.editorStateService.moveLayerUp(event.layerId);
    } else {
      this.editorStateService.moveLayerDown(event.layerId);
    }
  }

  onLayerPanelBlendModeChanged(event: { layerId: string; blendMode: string }) {
    this.editorStateService.setLayerBlendMode(event.layerId, event.blendMode as BlendMode);
  }

  clear() {
    this.editorStateService.clear();
  }

  save() {
    this.editorStateService.save(FormatType.Svg, this.editorConfigSignal().title);
  }

  export() {
    this.editorStateService.save(FormatType.Png, this.editorConfigSignal().title);
  }

  // Properties Panel Events
  onColorChange(event: { property: string; value: string }) {
    switch (event.property) {
      case 'backgroundColor':
        this.editorStateService.updateBackgroundColor(event.value);
        break;
      case 'strokeColor':
        this.editorStateService.updateStrokeColor(event.value);
        break;
      case 'fillColor':
        this.editorStateService.updateFillColor(event.value);
        break;
    }
  }

  onPropertyChange(event: { property: string; value: string | number | boolean }) {
    this.editorStateService.updateElementProperty(event.property, event.value);
  }

  toggleGrid() {
    this.editorStateService.toggleGrid();
  }

  toggleSnapToGrid() {
    this.editorStateService.toggleSnapToGrid();
  }

  deleteElement() {
    this.editorStateService.removeSelectedElements();
  }

  togglePanel() {
    this.isPanelOpenSignal.update((value) => !value);
  }

  onAlignmentChange(alignment: AlignmentType) {
    this.editorStateService.alignElements(alignment);
  }

  // Toolbar Events
  setSelectedTool(tool: ToolType) {
    this.editorStateService.selectTool(tool);
  }

  toggleExtendedTools() {
    this.showExtendedToolsSignal.update((value) => !value);
  }

  // Controls Panel Events
  zoomIn() {
    this.editorStateService.zoomIn();
  }

  zoomOut() {
    this.editorStateService.zoomOut();
  }

  onZoomTo(value: number) {
    this.editorStateService.setZoom(value);
    this.toggleZoomPopup();
  }

  zoomToFit() {
    this.editorStateService.zoomToFit();
    this.toggleZoomPopup();
  }

  zoomToSelection() {
    this.editorStateService.zoomToSelection();
    this.toggleZoomPopup();
  }

  resetZoom() {
    this.editorStateService.resetZoom();
    this.toggleZoomPopup();
  }

  toggleZoomPopup() {
    this.showZoomPopupSignal.update((value) => !value);
  }

  undo() {
    this.editorStateService.undo();
  }

  redo() {
    this.editorStateService.redo();
  }

  onCenterView() {
    this.editorStateService.centerView();
  }
}
