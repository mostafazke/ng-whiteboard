import { TestBed } from '@angular/core/testing';
import { LayerManagementService } from './layer-management.service';
import { WhiteboardElement, ElementType, LayerState } from '../types';

describe('LayerManagementService', () => {
  let service: LayerManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LayerManagementService],
    });
    service = TestBed.inject(LayerManagementService);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with a default layer', () => {
      const layers = service.layers();
      expect(layers.length).toBe(1);
      expect(layers[0].name).toBe('Layer 1');
      expect(layers[0].id).toBe('default');
    });

    it('should set default layer as active', () => {
      expect(service.getActiveLayerId()).toBe('default');
    });

    it('should have default layer visible and unlocked', () => {
      const layers = service.layers();
      expect(layers[0].visible).toBe(true);
      expect(layers[0].locked).toBe(false);
    });

    it('should initialize default layer with correct properties', () => {
      const layers = service.layers();
      const defaultLayer = layers[0];

      expect(defaultLayer.zIndex).toBe(0);
      expect(defaultLayer.elements).toEqual([]);
      expect(defaultLayer.opacity).toBe(1);
      expect(defaultLayer.blendMode).toBe('normal');
    });
  });

  describe('addLayer()', () => {
    it('should add a new layer', () => {
      const newLayer = service.addLayer('Test Layer');
      const layers = service.layers();

      expect(layers.length).toBe(2);
      expect(newLayer.name).toBe('Test Layer');
    });

    it('should auto-generate name if not provided', () => {
      const newLayer = service.addLayer();
      expect(newLayer.name).toBe('Layer 2');
    });

    it('should assign incrementing zIndex', () => {
      const layer1 = service.addLayer();
      const layer2 = service.addLayer();

      expect(layer2.zIndex).toBeGreaterThan(layer1.zIndex);
    });

    it('should generate unique layer ID', () => {
      const layer1 = service.addLayer();
      const layer2 = service.addLayer();

      expect(layer1.id).not.toBe(layer2.id);
      expect(layer1.id).toMatch(/^layer-/);
    });

    it('should set new layer as active', () => {
      const newLayer = service.addLayer('Active Layer');
      expect(service.getActiveLayerId()).toBe(newLayer.id);
    });

    it('should make previous layers invisible', () => {
      const firstLayer = service.layers()[0];
      const newLayer = service.addLayer();

      const layers = service.layers();
      const previousLayer = layers.find((l) => l.id === firstLayer.id);

      expect(previousLayer?.visible).toBe(false);
      expect(layers.find((l) => l.id === newLayer.id)?.visible).toBe(true);
    });

    it('should initialize new layer with default properties', () => {
      const newLayer = service.addLayer();

      expect(newLayer.visible).toBe(true);
      expect(newLayer.locked).toBe(false);
      expect(newLayer.elements).toEqual([]);
      expect(newLayer.opacity).toBe(1);
      expect(newLayer.blendMode).toBe('normal');
    });
  });

  describe('removeLayer()', () => {
    it('should remove a layer', () => {
      const newLayer = service.addLayer('To Remove');
      const result = service.removeLayer(newLayer.id);

      expect(result).toBe(true);
      expect(service.layers().length).toBe(1);
    });

    it('should prevent removal of last layer', () => {
      const layers = service.layers();
      const result = service.removeLayer(layers[0].id);

      expect(result).toBe(false);
      expect(service.layers().length).toBe(1);
    });

    it('should return false for non-existent layer', () => {
      const result = service.removeLayer('non-existent');
      expect(result).toBe(false);
    });

    it('should set new active layer if active layer is removed', () => {
      const layer1 = service.layers()[0];
      const layer2 = service.addLayer();

      service.setActiveLayer(layer2.id);
      service.removeLayer(layer2.id);

      expect(service.getActiveLayerId()).toBe(layer1.id);
    });

    it('should keep other layers unchanged', () => {
      const layer1 = service.layers()[0];
      const layer2 = service.addLayer('Keep');
      const layer3 = service.addLayer('Remove');

      service.removeLayer(layer3.id);

      const layers = service.layers();
      expect(layers.length).toBe(2);
      expect(layers.some((l) => l.id === layer1.id)).toBe(true);
      expect(layers.some((l) => l.id === layer2.id)).toBe(true);
    });
  });

  describe('renameLayer()', () => {
    it('should rename a layer', () => {
      const layers = service.layers();
      const result = service.renameLayer(layers[0].id, 'Renamed Layer');

      expect(result).toBe(true);
      expect(service.layers()[0].name).toBe('Renamed Layer');
    });

    it('should return false for non-existent layer', () => {
      const result = service.renameLayer('non-existent', 'New Name');
      expect(result).toBe(false);
    });

    it('should prevent renaming locked layers', () => {
      const layer = service.layers()[0];
      service.toggleLayerLock(layer.id);

      const result = service.renameLayer(layer.id, 'New Name');
      expect(result).toBe(false);
    });

    it('should trim whitespace from name', () => {
      const layer = service.layers()[0];
      service.renameLayer(layer.id, '  Trimmed Name  ');

      expect(service.layers()[0].name).toBe('Trimmed Name');
    });

    it('should use default name if empty after trim', () => {
      const layer = service.layers()[0];
      service.renameLayer(layer.id, '   ');

      expect(service.layers()[0].name).toBe('Layer 1');
    });
  });

  describe('reorderLayer()', () => {
    it('should change layer zIndex', () => {
      const layer = service.layers()[0];
      const result = service.reorderLayer(layer.id, 10);

      expect(result).toBe(true);
      expect(service.layers()[0].zIndex).toBe(10);
    });

    it('should return false for non-existent layer', () => {
      const result = service.reorderLayer('non-existent', 5);
      expect(result).toBe(false);
    });

    it('should prevent reordering locked layers', () => {
      const layer = service.layers()[0];
      service.toggleLayerLock(layer.id);

      const result = service.reorderLayer(layer.id, 5);
      expect(result).toBe(false);
    });
  });

  describe('moveLayerUp()', () => {
    it('should move layer up in z-order', () => {
      const layer1 = service.layers()[0];
      const layer2 = service.addLayer();

      const initialZ1 = layer1.zIndex;
      const initialZ2 = layer2.zIndex;

      service.setActiveLayer(layer1.id); // Unlock by activating
      const result = service.moveLayerUp(layer1.id);

      expect(result).toBe(true);
      const layers = service.layers();
      const updatedLayer1 = layers.find((l) => l.id === layer1.id);
      const updatedLayer2 = layers.find((l) => l.id === layer2.id);

      expect(updatedLayer1?.zIndex).toBe(initialZ2);
      expect(updatedLayer2?.zIndex).toBe(initialZ1);
    });

    it('should return false if layer is already at top', () => {
      const layer2 = service.addLayer();

      const result = service.moveLayerUp(layer2.id);
      expect(result).toBe(false);
    });

    it('should prevent moving locked layers', () => {
      const layer1 = service.layers()[0];
      service.addLayer();
      service.setActiveLayer(layer1.id);
      service.toggleLayerLock(layer1.id);

      const result = service.moveLayerUp(layer1.id);
      expect(result).toBe(false);
    });

    it('should return false for non-existent layer', () => {
      const result = service.moveLayerUp('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('moveLayerDown()', () => {
    it('should move layer down in z-order', () => {
      const layer1 = service.layers()[0];
      const layer2 = service.addLayer();

      const initialZ1 = layer1.zIndex;
      const initialZ2 = layer2.zIndex;

      const result = service.moveLayerDown(layer2.id);

      expect(result).toBe(true);
      const layers = service.layers();
      const updatedLayer1 = layers.find((l) => l.id === layer1.id);
      const updatedLayer2 = layers.find((l) => l.id === layer2.id);

      expect(updatedLayer1?.zIndex).toBe(initialZ2);
      expect(updatedLayer2?.zIndex).toBe(initialZ1);
    });

    it('should return false if layer is already at bottom', () => {
      const layer1 = service.layers()[0];
      service.addLayer();

      service.setActiveLayer(layer1.id);
      const result = service.moveLayerDown(layer1.id);
      expect(result).toBe(false);
    });

    it('should prevent moving locked layers', () => {
      service.addLayer();
      const layer2 = service.addLayer();
      service.toggleLayerLock(layer2.id);

      const result = service.moveLayerDown(layer2.id);
      expect(result).toBe(false);
    });
  });

  describe('toggleLayerVisibility()', () => {
    it('should toggle layer visibility', () => {
      const layer = service.layers()[0];
      const initialVisibility = layer.visible;

      service.toggleLayerVisibility(layer.id);
      expect(service.layers()[0].visible).toBe(!initialVisibility);

      service.toggleLayerVisibility(layer.id);
      expect(service.layers()[0].visible).toBe(initialVisibility);
    });

    it('should return false for non-existent layer', () => {
      const result = service.toggleLayerVisibility('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('toggleLayerLock()', () => {
    it('should toggle layer lock state', () => {
      const layer = service.layers()[0];

      service.toggleLayerLock(layer.id);
      expect(service.layers()[0].locked).toBe(true);

      service.toggleLayerLock(layer.id);
      expect(service.layers()[0].locked).toBe(false);
    });

    it('should allow locking the active layer without switching', () => {
      const layer1 = service.layers()[0];
      service.addLayer(); // Add another layer to ensure we have options

      service.setActiveLayer(layer1.id);
      service.toggleLayerLock(layer1.id);

      // Should stay on layer1 even though it's locked
      const activeId = service.getActiveLayerId();
      expect(activeId).toBe(layer1.id);
      expect(service.layers()[0].locked).toBe(true);
    });

    it('should return false for non-existent layer', () => {
      const result = service.toggleLayerLock('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('setLayerOpacity()', () => {
    it('should set layer opacity', () => {
      const layer = service.layers()[0];
      const result = service.setLayerOpacity(layer.id, 0.5);

      expect(result).toBe(true);
      expect(service.layers()[0].opacity).toBe(0.5);
    });

    it('should clamp opacity to 0-1 range', () => {
      const layer = service.layers()[0];

      service.setLayerOpacity(layer.id, 1.5);
      expect(service.layers()[0].opacity).toBe(1);

      service.setLayerOpacity(layer.id, -0.5);
      expect(service.layers()[0].opacity).toBe(0);
    });

    it('should prevent changing opacity of locked layers', () => {
      const layer = service.layers()[0];
      service.toggleLayerLock(layer.id);

      const result = service.setLayerOpacity(layer.id, 0.5);
      expect(result).toBe(false);
    });

    it('should return false for non-existent layer', () => {
      const result = service.setLayerOpacity('non-existent', 0.5);
      expect(result).toBe(false);
    });
  });

  describe('setLayerBlendMode()', () => {
    it('should set layer blend mode', () => {
      const layer = service.layers()[0];
      const result = service.setLayerBlendMode(layer.id, 'multiply');

      expect(result).toBe(true);
      expect(service.layers()[0].blendMode).toBe('multiply');
    });

    it('should prevent changing blend mode of locked layers', () => {
      const layer = service.layers()[0];
      service.toggleLayerLock(layer.id);

      const result = service.setLayerBlendMode(layer.id, 'overlay');
      expect(result).toBe(false);
    });

    it('should return false for non-existent layer', () => {
      const result = service.setLayerBlendMode('non-existent', 'screen');
      expect(result).toBe(false);
    });
  });

  describe('setActiveLayer()', () => {
    it('should set active layer', () => {
      const layer2 = service.addLayer();
      const result = service.setActiveLayer(layer2.id);

      expect(result).toBe(true);
      expect(service.getActiveLayerId()).toBe(layer2.id);
    });

    it('should allow activating locked layers', () => {
      const layer2 = service.addLayer();
      service.toggleLayerLock(layer2.id);

      const result = service.setActiveLayer(layer2.id);
      expect(result).toBe(true);
      expect(service.getActiveLayerId()).toBe(layer2.id);
    });

    it('should make only active layer visible', () => {
      const layer1 = service.layers()[0];
      const layer2 = service.addLayer();
      const layer3 = service.addLayer();

      service.setActiveLayer(layer2.id);

      const layers = service.layers();
      expect(layers.find((l) => l.id === layer1.id)?.visible).toBe(false);
      expect(layers.find((l) => l.id === layer2.id)?.visible).toBe(true);
      expect(layers.find((l) => l.id === layer3.id)?.visible).toBe(false);
    });

    it('should return false for non-existent layer', () => {
      const result = service.setActiveLayer('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('Computed Signals', () => {
    it('should compute activeLayer', () => {
      const layer2 = service.addLayer('Test');
      service.setActiveLayer(layer2.id);

      const activeLayer = service.activeLayer();
      expect(activeLayer?.id).toBe(layer2.id);
      expect(activeLayer?.name).toBe('Test');
    });

    it('should compute sortedLayers by zIndex', () => {
      service.addLayer();
      service.addLayer();

      const sorted = service.sortedLayers();
      expect(sorted[0].zIndex).toBeLessThanOrEqual(sorted[1].zIndex);
      expect(sorted[1].zIndex).toBeLessThanOrEqual(sorted[2].zIndex);
    });

    it('should compute visibleLayers', () => {
      service.addLayer();
      service.addLayer();
      const layer3 = service.addLayer();

      // layer3 is the only visible one (active layer)
      const visible = service.visibleLayers();
      expect(visible.length).toBe(1);
      expect(visible[0].id).toBe(layer3.id);
      expect(visible.every((l) => l.visible)).toBe(true);
    });

    it('should compute unlockedLayers', () => {
      const layer1 = service.layers()[0];
      service.addLayer();
      service.addLayer();

      service.setActiveLayer(layer1.id);
      service.toggleLayerLock(layer1.id);

      const unlocked = service.unlockedLayers();
      expect(unlocked.length).toBe(2);
      expect(unlocked.every((l) => !l.locked)).toBe(true);
    });
  });

  describe('isActiveLayerValid()', () => {
    it('should return true for valid active layer', () => {
      expect(service.isActiveLayerValid()).toBe(true);
    });

    it('should return false if active layer is locked', () => {
      const layer = service.layers()[0];
      service.toggleLayerLock(layer.id);

      expect(service.isActiveLayerValid()).toBe(false);
    });

    it('should return false if active layer is hidden', () => {
      const layer = service.layers()[0];
      service.toggleLayerVisibility(layer.id);

      expect(service.isActiveLayerValid()).toBe(false);
    });
  });

  describe('getActiveLayerIssues()', () => {
    it('should return empty array for valid layer', () => {
      const issues = service.getActiveLayerIssues();
      expect(issues.length).toBe(0);
    });

    it('should return issue if layer is hidden', () => {
      const layer = service.layers()[0];
      service.toggleLayerVisibility(layer.id);

      const issues = service.getActiveLayerIssues();
      expect(issues).toContain('Active layer is hidden');
    });

    it('should return issue if layer is locked', () => {
      const layer = service.layers()[0];
      service.toggleLayerLock(layer.id);

      const issues = service.getActiveLayerIssues();
      expect(issues).toContain('Active layer is locked');
    });

    it('should return multiple issues if both hidden and locked', () => {
      const layer = service.layers()[0];
      service.toggleLayerVisibility(layer.id);
      service.toggleLayerLock(layer.id);

      const issues = service.getActiveLayerIssues();
      expect(issues.length).toBe(2);
    });
  });

  describe('Element Assignment', () => {
    it('should assign element to active layer', () => {
      const result = service.assignElementToActiveLayer('element-1');

      expect(result).toBe(true);
      const activeLayer = service.activeLayer();
      expect(activeLayer?.elements).toContain('element-1');
    });

    it('should assign element to specific layer', () => {
      const layer2 = service.addLayer();
      const result = service.assignElementToLayer('element-1', layer2.id);

      expect(result).toBe(true);
      const layers = service.layers();
      const targetLayer = layers.find((l) => l.id === layer2.id);
      expect(targetLayer?.elements).toContain('element-1');
    });

    it('should prevent assigning to locked layer', () => {
      const layer2 = service.addLayer();
      service.toggleLayerLock(layer2.id);

      const result = service.assignElementToLayer('element-1', layer2.id);
      expect(result).toBe(false);
    });

    it('should remove element from other layers first', () => {
      const layer1 = service.layers()[0];
      const layer2 = service.addLayer();

      // Assign to layer1 first
      service.setActiveLayer(layer1.id);
      const result1 = service.assignElementToLayer('element-1', layer1.id);
      expect(result1).toBe(true);

      // Verify it's in layer1
      let layers = service.layers();
      expect(layers.find((l) => l.id === layer1.id)?.elements).toContain('element-1');

      // Now assign to layer2 - should remove from layer1
      service.setActiveLayer(layer2.id);
      const result2 = service.assignElementToLayer('element-1', layer2.id);
      expect(result2).toBe(true);

      // BUG IN SERVICE: This fails because assignElementToLayer uses stale layers array
      // It should re-fetch layers after removeElementFromAllLayers()
      layers = service.layers();
      expect(layers.find((l) => l.id === layer1.id)?.elements).not.toContain('element-1');
      expect(layers.find((l) => l.id === layer2.id)?.elements).toContain('element-1');
    });

    it('should not duplicate element in same layer', () => {
      const layer = service.layers()[0];

      service.assignElementToLayer('element-1', layer.id);
      service.assignElementToLayer('element-1', layer.id);

      const elements = service.layers()[0].elements;
      expect(elements.filter((id) => id === 'element-1').length).toBe(1);
    });

    it('should return false for non-existent layer', () => {
      const result = service.assignElementToLayer('element-1', 'non-existent');
      expect(result).toBe(false);
    });
  });

  describe('removeElementFromAllLayers()', () => {
    it('should remove element from all layers', () => {
      const layer1 = service.layers()[0];
      service.addLayer();

      service.assignElementToLayer('element-1', layer1.id);
      service.removeElementFromAllLayers('element-1');

      const layers = service.layers();
      expect(layers.every((l) => !l.elements.includes('element-1'))).toBe(true);
    });

    it('should handle removing non-existent element', () => {
      expect(() => service.removeElementFromAllLayers('non-existent')).not.toThrow();
    });
  });

  describe('getElementLayer()', () => {
    it('should return layer containing element', () => {
      const layer1 = service.layers()[0];
      service.assignElementToLayer('element-1', layer1.id);

      const result = service.getElementLayer('element-1');
      expect(result?.id).toBe(layer1.id);
    });

    it('should return null if element not in any layer', () => {
      const result = service.getElementLayer('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('Rendering Helpers', () => {
    const createMockElement = (id: string): WhiteboardElement => ({
      id,
      type: ElementType.Rectangle,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rx: 5,
      rotation: 0,
      opacity: 100,
      zIndex: 1,
      selectAfterDraw: false,
      style: {},
    });

    describe('getVisibleElements()', () => {
      it('should return elements from visible layers', () => {
        const layer1 = service.layers()[0];
        const layer2 = service.addLayer();

        // Assign elements to both layers
        service.setActiveLayer(layer1.id);
        service.assignElementToLayer('element-1', layer1.id);

        service.setActiveLayer(layer2.id);
        service.assignElementToLayer('element-2', layer2.id);

        // At this point, only layer2 is visible (active layer)
        // layer1 is hidden because setActiveLayer makes all others invisible

        const allElements = [createMockElement('element-1'), createMockElement('element-2')];
        const visible = service.getVisibleElements(allElements);

        // Only element-2 should be visible (from layer2)
        expect(visible.length).toBe(1);
        expect(visible[0].id).toBe('element-2');
      });

      it('should return empty array if no layers visible', () => {
        const layer = service.layers()[0];
        service.assignElementToLayer('element-1', layer.id);
        service.toggleLayerVisibility(layer.id);

        const allElements = [createMockElement('element-1')];
        const visible = service.getVisibleElements(allElements);

        expect(visible.length).toBe(0);
      });
    });

    describe('getEditableElements()', () => {
      it('should return elements from unlocked layers', () => {
        const layer1 = service.layers()[0];
        const layer2 = service.addLayer();

        service.assignElementToLayer('element-1', layer1.id);
        service.assignElementToLayer('element-2', layer2.id);

        service.setActiveLayer(layer1.id);
        service.toggleLayerLock(layer1.id);

        const allElements = [createMockElement('element-1'), createMockElement('element-2')];
        const editable = service.getEditableElements(allElements);

        expect(editable.length).toBe(1);
        expect(editable[0].id).toBe('element-2');
      });
    });

    describe('getSortedElements()', () => {
      it('should sort elements by layer zIndex', () => {
        const layer1 = service.layers()[0];
        const layer2 = service.addLayer();
        const layer3 = service.addLayer();

        service.assignElementToLayer('element-1', layer3.id);
        service.assignElementToLayer('element-2', layer1.id);
        service.assignElementToLayer('element-3', layer2.id);

        const allElements = [
          createMockElement('element-1'),
          createMockElement('element-2'),
          createMockElement('element-3'),
        ];

        const sorted = service.getSortedElements(allElements);

        expect(sorted[0].id).toBe('element-2'); // layer1 has lowest zIndex
        expect(sorted[1].id).toBe('element-3'); // layer2
        expect(sorted[2].id).toBe('element-1'); // layer3 has highest zIndex
      });
    });
  });

  describe('Export/Import', () => {
    it('should export layer state', () => {
      service.addLayer('Layer 2');
      service.addLayer('Layer 3');

      const state = service.exportLayerState();

      expect(state.layers.length).toBe(3);
      expect(state.activeLayerId).toBeDefined();
    });

    it('should import layer state', () => {
      const state: LayerState = {
        layers: [
          {
            id: 'custom-1',
            name: 'Custom Layer 1',
            visible: true,
            locked: false,
            zIndex: 0,
            elements: ['element-1'],
            opacity: 1,
            blendMode: 'normal',
          },
          {
            id: 'custom-2',
            name: 'Custom Layer 2',
            visible: false,
            locked: true,
            zIndex: 1,
            elements: ['element-2'],
            opacity: 0.8,
            blendMode: 'multiply',
          },
        ],
        activeLayerId: 'custom-1',
      };

      service.importLayerState(state);

      expect(service.layers().length).toBe(2);
      expect(service.getActiveLayerId()).toBe('custom-1');
      expect(service.layers()[0].name).toBe('Custom Layer 1');
      expect(service.layers()[1].name).toBe('Custom Layer 2');
    });

    it('should validate active layer on import', () => {
      const state: LayerState = {
        layers: [
          {
            id: 'layer-1',
            name: 'Layer 1',
            visible: true,
            locked: false,
            zIndex: 0,
            elements: [],
            opacity: 1,
            blendMode: 'normal',
          },
        ],
        activeLayerId: 'non-existent',
      };

      service.importLayerState(state);

      // Should fallback to first layer
      expect(service.getActiveLayerId()).toBe('layer-1');
    });

    it('should initialize default layer on invalid import', () => {
      const state: LayerState = {
        layers: [],
        activeLayerId: '',
      };

      service.importLayerState(state);

      expect(service.layers().length).toBe(1);
      expect(service.layers()[0].id).toBe('default');
    });
  });

  describe('reset()', () => {
    it('should reset to default state', () => {
      service.addLayer('Layer 2');
      service.addLayer('Layer 3');
      service.assignElementToActiveLayer('element-1');

      service.reset();

      expect(service.layers().length).toBe(1);
      expect(service.layers()[0].id).toBe('default');
      expect(service.getActiveLayerId()).toBe('default');
      expect(service.layers()[0].elements.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid layer additions', () => {
      for (let i = 0; i < 10; i++) {
        service.addLayer(`Layer ${i}`);
      }

      expect(service.layers().length).toBe(11); // Including default
    });

    it('should handle element assignment with no active layer', () => {
      // This shouldn't happen in practice, but test resilience
      const result = service.assignElementToActiveLayer('element-1');
      expect(result).toBeDefined();
    });

    it('should maintain layer integrity during multiple operations', () => {
      const layer1 = service.layers()[0];
      const layer2 = service.addLayer();
      const layer3 = service.addLayer();

      service.assignElementToLayer('element-1', layer1.id);
      service.assignElementToLayer('element-2', layer2.id);
      service.assignElementToLayer('element-3', layer3.id);

      service.removeLayer(layer2.id);

      const layers = service.layers();
      expect(layers.length).toBe(2);
      expect(layers.some((l) => l.elements.includes('element-2'))).toBe(false);
    });
  });
});
