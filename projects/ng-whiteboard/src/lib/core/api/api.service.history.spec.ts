import { TestBed } from '@angular/core/testing';
import { ElementsService } from '../elements/elements.service';
import { LayerManagementService } from '../elements/layer-management.service';
import { HistoryService } from '../history/history.service';
import { ElementType, WhiteboardElement } from '../types';
import { ApiService } from './api.service';

describe('ApiService undo/redo with layers', () => {
  let api: ApiService;
  let history: HistoryService;
  let layers: LayerManagementService;
  let elements: ElementsService;

  const rect = { id: 'e1', type: ElementType.Rectangle, x: 0, y: 0, zIndex: 1 } as unknown as WhiteboardElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ApiService] });
    api = TestBed.inject(ApiService);
    history = TestBed.inject(HistoryService);
    layers = TestBed.inject(LayerManagementService);
    elements = TestBed.inject(ElementsService);
  });

  it('restores the previous layer name on undo and re-applies it on redo, leaving elements unchanged', () => {
    elements.setElements([rect]);
    const layerId = layers.layers()[0].id;
    const before = { elements: elements.getElements(), layers: layers.exportLayerState(elements.getElements()) };
    layers.renameLayer(layerId, 'Renamed');
    const after = { elements: elements.getElements(), layers: layers.exportLayerState(elements.getElements()) };
    history.recordBoardChange(before, after, 'Rename layer');

    const oldName = before.layers.layers[0].name;
    expect(api.undo()).toBe(true);
    expect(layers.layers()[0].name).toBe(oldName);
    expect(elements.getElements().map((e) => e.id)).toEqual(['e1']);

    expect(api.redo()).toBe(true);
    expect(layers.layers()[0].name).toBe('Renamed');
  });
});
