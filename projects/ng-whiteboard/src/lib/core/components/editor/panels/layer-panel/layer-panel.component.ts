import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WhiteboardElement } from '../../../../types';

export interface WhiteboardLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
  type: 'drawing' | 'text' | 'image' | 'shape';
  elements?: WhiteboardElement[];
  blendMode?: string;
}

// Export event types for use in other components
export interface LayerRenameEvent {
  layerId: string;
  name: string;
}

export interface LayerOpacityEvent {
  layerId: string;
  opacity: number;
}

export interface LayerMoveEvent {
  layerId: string;
  direction: 'up' | 'down';
}

export interface LayerBlendModeEvent {
  layerId: string;
  blendMode: string;
}

@Component({
  selector: 'ng-ng-layer-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './layer-panel.component.html',
  styleUrls: ['./layer-panel.component.scss'],
})
export class LayerPanelComponent implements OnInit {
  @Input() layers: WhiteboardLayer[] = [];
  @Input() activeLayerId: string | null = null;

  // Make Math available in template
  Math = Math;

  @Output() layerSelected = new EventEmitter<string>();
  @Output() layerAdded = new EventEmitter<void>();
  @Output() layerDeleted = new EventEmitter<string>();
  @Output() layerRenamed = new EventEmitter<LayerRenameEvent>();
  @Output() layerVisibilityToggled = new EventEmitter<{ layerId: string; visible: boolean }>();
  @Output() layerLockToggled = new EventEmitter<{ layerId: string; locked: boolean }>();
  @Output() layerOpacityChanged = new EventEmitter<LayerOpacityEvent>();
  @Output() layerMoved = new EventEmitter<LayerMoveEvent>();
  @Output() layerBlendModeChanged = new EventEmitter<LayerBlendModeEvent>();

  ngOnInit() {
    // Initialize with a default layer if none exist
    if (this.layers.length === 0) {
      this.layers = [
        {
          id: this.generateLayerId(),
          name: 'Layer 1',
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: 1,
          type: 'drawing',
          elements: [],
        },
      ];
      this.activeLayerId = this.layers[0].id;
    }
  }

  get sortedLayers(): WhiteboardLayer[] {
    return [...this.layers].sort((a, b) => b.zIndex - a.zIndex);
  }

  get activeLayer(): WhiteboardLayer | undefined {
    return this.layers.find((layer) => layer.id === this.activeLayerId);
  }

  trackByLayerId(index: number, layer: WhiteboardLayer): string {
    return layer.id;
  }

  getLayerOpacity(layer: WhiteboardLayer): number {
    return layer.visible ? 1 : 0.5;
  }

  getBlendMode(layer: WhiteboardLayer): string {
    return layer.blendMode || 'normal';
  }

  generateLayerId(): string {
    return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  onSelectLayer(layerId: string): void {
    console.log(`Layer panel: Selecting layer ${layerId}`);
    this.layerSelected.emit(layerId);
  }

  onAddLayer(): void {
    this.layerAdded.emit();
  }

  onDeleteLayer(layerId: string, event: Event): void {
    event.stopPropagation();
    if (this.layers.length > 1) {
      this.layerDeleted.emit(layerId);
    }
  }

  onRenameLayer(layerId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const newName = target.value.trim();
    if (newName && newName !== '') {
      this.layerRenamed.emit({ layerId: layerId, name: newName });
    }
  }

  onRenameLayerEnter(layerId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const newName = target.value.trim();
    if (newName && newName !== '') {
      this.layerRenamed.emit({ layerId: layerId, name: newName });
    }
    target.blur();
  }

  onToggleVisibility(layerId: string, event: Event): void {
    event.stopPropagation();
    const layer = this.layers.find((l) => l.id === layerId);
    if (layer) {
      this.layerVisibilityToggled.emit({
        layerId: layerId,
        visible: !layer.visible,
      });
    }
  }

  onToggleLock(layerId: string, event: Event): void {
    event.stopPropagation();
    const layer = this.layers.find((l) => l.id === layerId);
    if (layer) {
      this.layerLockToggled.emit({
        layerId: layerId,
        locked: !layer.locked,
      });
    }
  }

  onOpacityChange(layerId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const opacity = parseInt(target.value) / 100;
    this.layerOpacityChanged.emit({ layerId: layerId, opacity });
  }

  onBlendModeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const blendMode = target.value;
    if (this.activeLayerId) {
      this.layerBlendModeChanged.emit({
        layerId: this.activeLayerId,
        blendMode,
      });
    }
  }

  onMoveLayerUp(): void {
    if (this.activeLayerId && this.canMoveUp()) {
      this.layerMoved.emit({ layerId: this.activeLayerId, direction: 'up' });
    }
  }

  onMoveLayerDown(): void {
    if (this.activeLayerId && this.canMoveDown()) {
      this.layerMoved.emit({ layerId: this.activeLayerId, direction: 'down' });
    }
  }

  canMoveUp(): boolean {
    if (!this.activeLayerId) return false;
    const currentLayer = this.layers.find((l) => l.id === this.activeLayerId);
    if (!currentLayer) return false;
    return this.layers.some((l) => l.zIndex > currentLayer.zIndex);
  }

  canMoveDown(): boolean {
    if (!this.activeLayerId) return false;
    const currentLayer = this.layers.find((l) => l.id === this.activeLayerId);
    if (!currentLayer) return false;
    return this.layers.some((l) => l.zIndex < currentLayer.zIndex);
  }
}
