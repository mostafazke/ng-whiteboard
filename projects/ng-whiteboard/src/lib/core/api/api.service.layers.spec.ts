import { TestBed } from '@angular/core/testing';
import { ElementsService } from '../elements/elements.service';
import { LayerManagementService } from '../elements/layer-management.service';
import { HistoryService } from '../history/history.service';
import { ElementType, WhiteboardElement } from '../types';
import { IOService } from '../input/io.service';
import { ApiService } from './api.service';

describe('ApiService undoable layer operations', () => {
  let api: ApiService;
  let history: HistoryService;
  let layers: LayerManagementService;
  let elements: ElementsService;
  let bottom: string;
  let top: string;

  const el = (id: string, layerId: string) =>
    ({ id, type: ElementType.Rectangle, x: 0, y: 0, zIndex: 1, layerId }) as unknown as WhiteboardElement;

  const stackSize = () => {
    let n = 0;
    while (api.undo()) n++;
    for (let i = 0; i < n; i++) api.redo();
    return n;
  };

  const layerOf = (id: string) => layers.layers().find((l) => l.id === id);
  const elementLayer = (id: string) => elements.getElements().find((e) => e.id === id)?.layerId;
  const canUndo = () => history.getCanUndoSignal()();

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ApiService] });
    api = TestBed.inject(ApiService);
    history = TestBed.inject(HistoryService);
    layers = TestBed.inject(LayerManagementService);
    elements = TestBed.inject(ElementsService);
    bottom = layers.layers()[0].id;
    top = layers.addLayer('Top').id;
    history.clearHistory();
  });

  it('records one undoable step for addLayer', () => {
    api.addLayer('Extra');
    expect(layers.layers().length).toBe(3);
    expect(stackSize()).toBe(1);
    api.undo();
    expect(layers.layers().length).toBe(2);
  });

  it('records one undoable step each for rename, visibility, lock, opacity and blend mode', () => {
    const name = layerOf(top)?.name;
    api.renameLayer(top, 'New');
    expect(layerOf(top)?.name).toBe('New');
    api.undo();
    expect(layerOf(top)?.name).toBe(name);

    const visible = layerOf(top)?.visible;
    api.toggleLayerVisibility(top);
    expect(layerOf(top)?.visible).toBe(!visible);
    api.undo();
    expect(layerOf(top)?.visible).toBe(visible);

    api.toggleLayerLock(top);
    expect(layerOf(top)?.locked).toBe(true);
    api.undo();
    expect(layerOf(top)?.locked).toBe(false);

    api.setLayerOpacity(top, 0.4);
    expect(layerOf(top)?.opacity).toBe(0.4);
    api.undo();
    expect(layerOf(top)?.opacity).toBe(1);

    api.setLayerBlendMode(top, 'multiply');
    expect(layerOf(top)?.blendMode).toBe('multiply');
    api.undo();
    expect(layerOf(top)?.blendMode).toBe('normal');
    expect(canUndo()).toBe(false);
  });

  it('records one step for moveLayerDown, moveLayerUp and reorderLayersByIndex', () => {
    api.moveLayerDown(top);
    expect(layerOf(top)!.zIndex).toBeLessThan(layerOf(bottom)!.zIndex);
    api.undo();
    expect(layerOf(top)!.zIndex).toBeGreaterThan(layerOf(bottom)!.zIndex);

    api.moveLayerUp(bottom);
    expect(layerOf(bottom)!.zIndex).toBeGreaterThan(layerOf(top)!.zIndex);
    api.undo();
    expect(layerOf(bottom)!.zIndex).toBeLessThan(layerOf(top)!.zIndex);

    api.reorderLayersByIndex(0, 1);
    api.undo();
    expect(layerOf(top)!.zIndex).toBeGreaterThan(layerOf(bottom)!.zIndex);
    expect(canUndo()).toBe(false);
  });

  it('records one step for duplicateLayer and undo removes the layer and its copies', () => {
    elements.setElements([el('a', top), el('b', top)]);
    history.clearHistory();
    api.duplicateLayer(top);
    expect(layers.layers().length).toBe(3);
    expect(elements.getElements().length).toBe(4);
    expect(stackSize()).toBe(1);
    api.undo();
    expect(layers.layers().length).toBe(2);
    expect(elements.getElements().length).toBe(2);
  });

  it('removeLayer delete-elements removes members and undo restores layer and elements in one step', () => {
    elements.setElements([el('a', top), el('b', top), el('c', bottom)]);
    history.clearHistory();
    expect(api.removeLayer(top, 'delete-elements')).toBe(true);
    expect(layerOf(top)).toBeUndefined();
    expect(elements.getElements().map((e) => e.id)).toEqual(['c']);
    expect(stackSize()).toBe(1);
    api.undo();
    expect(layerOf(top)).toBeDefined();
    expect(
      elements
        .getElements()
        .map((e) => e.id)
        .sort()
    ).toEqual(['a', 'b', 'c']);
  });

  it('removeLayer defaults to delete-elements', () => {
    elements.setElements([el('a', top)]);
    api.removeLayer(top);
    expect(elements.getElements()).toEqual([]);
  });

  it('removeLayer move-elements moves members to the layer below and leaves none orphaned', () => {
    elements.setElements([el('a', top), el('b', top)]);
    history.clearHistory();
    expect(api.removeLayer(top, 'move-elements')).toBe(true);
    expect(elementLayer('a')).toBe(bottom);
    expect(elementLayer('b')).toBe(bottom);
    expect(stackSize()).toBe(1);
    api.undo();
    expect(elementLayer('a')).toBe(top);
    expect(layerOf(top)).toBeDefined();
  });

  it('removeLayer move-elements on the lowest layer moves members above', () => {
    elements.setElements([el('a', bottom)]);
    api.removeLayer(bottom, 'move-elements');
    expect(elementLayer('a')).toBe(top);
  });

  it('moves members into a locked layer below', () => {
    elements.setElements([el('a', top)]);
    layers.toggleLayerLock(bottom);
    history.clearHistory();
    expect(api.removeLayer(top, 'move-elements')).toBe(true);
    expect(elementLayer('a')).toBe(bottom);
  });

  it('removing the only layer returns false and records nothing', () => {
    api.removeLayer(top);
    history.clearHistory();
    expect(api.removeLayer(bottom)).toBe(false);
    expect(canUndo()).toBe(false);
    expect(layers.layers().length).toBe(1);
  });

  it('mergeLayerDown moves members down, keeps the lower layer properties and records one step', () => {
    layers.renameLayer(bottom, 'Lower');
    layers.setLayerOpacity(bottom, 0.5);
    elements.setElements([el('a', top), el('c', bottom)]);
    history.clearHistory();
    expect(api.mergeLayerDown(top)).toBe(true);
    expect(layerOf(top)).toBeUndefined();
    expect(layerOf(bottom)?.name).toBe('Lower');
    expect(layerOf(bottom)?.opacity).toBe(0.5);
    expect(elementLayer('a')).toBe(bottom);
    expect(stackSize()).toBe(1);
    api.undo();
    expect(layerOf(top)).toBeDefined();
    expect(elementLayer('a')).toBe(top);
  });

  it('mergeLayerDown on the bottom layer returns false and records nothing', () => {
    expect(api.mergeLayerDown(bottom)).toBe(false);
    expect(canUndo()).toBe(false);
  });

  describe('stacking after members move', () => {
    const stackKey = (id: string) => {
      const e = elements.getElements().find((x) => x.id === id)!;
      return (layerOf(e.layerId!)?.zIndex ?? 0) * 1000 + (e.zIndex ?? 0);
    };
    const draw = (id: string, layerId: string) => {
      elements.addElements([{ id, type: ElementType.Rectangle, x: 0, y: 0, layerId } as unknown as WhiteboardElement]);
    };

    it('merge down places the merged elements above every element of the target, in one undo step', () => {
      draw('a1', bottom);
      draw('b1', top);
      draw('b2', top);
      draw('a2', bottom);
      history.clearHistory();
      const before = Object.fromEntries(elements.getElements().map((e) => [e.id, e.zIndex]));

      expect(api.mergeLayerDown(top)).toBe(true);

      expect(stackKey('b1')).toBeGreaterThan(stackKey('a1'));
      expect(stackKey('b1')).toBeGreaterThan(stackKey('a2'));
      expect(stackKey('b2')).toBeGreaterThan(stackKey('b1'));
      expect(stackSize()).toBe(1);
      api.undo();
      expect(Object.fromEntries(elements.getElements().map((e) => [e.id, e.zIndex]))).toEqual(before);
      expect(elementLayer('b1')).toBe(top);
    });

    it('delete and move into the layer below sits above its elements', () => {
      draw('b1', top);
      draw('a1', bottom);
      api.removeLayer(top, 'move-elements');
      expect(stackKey('b1')).toBeGreaterThan(stackKey('a1'));
    });

    it('delete and move from the lowest layer sits below the layer above', () => {
      draw('a1', bottom);
      draw('b1', top);
      draw('a2', bottom);
      api.removeLayer(bottom, 'move-elements');
      expect(stackKey('a1')).toBeLessThan(stackKey('b1'));
      expect(stackKey('a2')).toBeLessThan(stackKey('b1'));
      expect(stackKey('a1')).toBeLessThan(stackKey('a2'));
    });
  });

  describe('public layers signal', () => {
    it('derives each layer elements from element.layerId', () => {
      api.removeLayer(top);
      elements.setElements([
        { id: 'x', type: ElementType.Rectangle, x: 0, y: 0 },
        { id: 'y', type: ElementType.Rectangle, x: 0, y: 0 },
        { id: 'z', type: ElementType.Rectangle, x: 0, y: 0 },
      ] as unknown as WhiteboardElement[]);
      expect(api.layers()[0].elements.length).toBe(3);
      expect(api.activeLayer().elements.length).toBe(3);
    });

    it('follows moves between layers', () => {
      elements.setElements([el('a', top), el('b', bottom)]);
      elements.moveToLayer(['a'], bottom, true);
      expect(
        api
          .layers()
          .find((l) => l.id === bottom)
          ?.elements.sort()
      ).toEqual(['a', 'b']);
      expect(api.layers().find((l) => l.id === top)?.elements).toEqual([]);
    });
  });

  it('wraps an opacity drag in one history step', () => {
    api.beginLayerOpacityEdit(top);
    api.setLayerOpacity(top, 0.8);
    api.setLayerOpacity(top, 0.6);
    api.setLayerOpacity(top, 0.3);
    api.endLayerOpacityEdit();
    expect(layerOf(top)?.opacity).toBe(0.3);
    expect(stackSize()).toBe(1);
    api.undo();
    expect(layerOf(top)?.opacity).toBe(1);
  });
});

describe('Whole-board operations', () => {
  let api: ApiService;
  let io: IOService;
  let history: HistoryService;
  let layers: LayerManagementService;
  let elements: ElementsService;

  const el = (id: string, layerId?: string) =>
    ({ id, type: ElementType.Rectangle, x: 0, y: 0, zIndex: 1, layerId }) as unknown as WhiteboardElement;

  const stackSize = () => {
    let n = 0;
    while (api.undo()) n++;
    for (let i = 0; i < n; i++) api.redo();
    return n;
  };

  const ids = () =>
    elements
      .getElements()
      .map((e) => e.id)
      .sort();

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ApiService] });
    api = TestBed.inject(ApiService);
    io = TestBed.inject(IOService);
    history = TestBed.inject(HistoryService);
    layers = TestBed.inject(LayerManagementService);
    elements = TestBed.inject(ElementsService);
    const second = layers.addLayer('Second').id;
    elements.setElements([el('a', layers.layers()[0].id), el('b', second), el('c', second)]);
    history.clearHistory();
  });

  const opened = () => {
    const layerList = [
      { id: 'L1', name: 'One', visible: true, locked: false, zIndex: 0, elements: [], opacity: 1, blendMode: 'normal' },
      { id: 'L2', name: 'Two', visible: true, locked: false, zIndex: 1, elements: [], opacity: 1, blendMode: 'normal' },
      {
        id: 'L3',
        name: 'Three',
        visible: true,
        locked: false,
        zIndex: 2,
        elements: [],
        opacity: 1,
        blendMode: 'normal',
      },
    ];
    return JSON.stringify({
      elements: [el('x', 'L1'), el('y', 'L3')],
      layers: { layers: layerList, activeLayerId: 'L3' },
    });
  };

  it('importData is exactly one undo step restoring elements and layers', () => {
    const layerIdsBefore = layers.layers().map((l) => l.id);
    io.importData(opened());
    expect(ids()).toEqual(['x', 'y']);
    const layerIdsAfter = layers.layers().map((l) => l.id);
    expect(layerIdsAfter).toEqual(['L1', 'L2', 'L3']);
    expect(stackSize()).toBe(1);

    api.undo();
    expect(ids()).toEqual(['a', 'b', 'c']);
    expect(layers.layers().map((l) => l.id)).toEqual(layerIdsBefore);

    api.redo();
    expect(ids()).toEqual(['x', 'y']);
    expect(layers.layers().map((l) => l.id)).toEqual(layerIdsAfter);
    expect(layers.getActiveLayerId()).toBe('L3');
  });

  it('importData records the step as Open board', () => {
    io.importData(opened());
    expect(history.getUndoDescriptionSignal()()).toBe('Open board');
  });

  it('importData without layers yields one default layer with visible elements', () => {
    io.importData(JSON.stringify({ elements: [el('p'), el('q')] }));
    expect(layers.layers().length).toBe(1);
    expect(ids()).toEqual(['p', 'q']);
    const layerId = layers.layers()[0].id;
    expect(elements.getElements().every((e) => !e.layerId || e.layerId === layerId)).toBe(true);
    expect(stackSize()).toBe(1);
  });

  it('resetBoard clears elements, keeps one layer, and is one undoable step', () => {
    api.resetBoard();
    expect(elements.getElements().length).toBe(0);
    expect(layers.layers().length).toBe(1);
    expect(stackSize()).toBe(1);

    api.undo();
    expect(ids()).toEqual(['a', 'b', 'c']);
    expect(layers.layers().length).toBe(2);

    api.redo();
    expect(elements.getElements().length).toBe(0);
    expect(layers.layers().length).toBe(1);
  });

  it('hasContent reflects persistent elements', () => {
    expect(api.hasContent()).toBe(true);
    api.resetBoard();
    expect(api.hasContent()).toBe(false);
  });
});
