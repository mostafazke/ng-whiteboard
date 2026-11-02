import { TestBed } from '@angular/core/testing';
import { ApiService } from '../../api/api.service';
import { ConfigService } from '../../config/config.service';
import { ElementsService } from '../../elements/elements.service';
import { LayerManagementService } from '../../elements/layer-management.service';
import { EventBusService } from '../../event-bus/event-bus.service';
import { SelectionService } from '../../elements/selection.service';
import { HistoryService } from '../../history/history.service';
import { ElementType, WhiteboardElement, WhiteboardEvent } from '../../types';
import { EditorStateService } from './editor-state.service';
import { MIXED } from './utils/selected-properties';

const rect = (id: string, x: number, y: number, width: number, height: number, extra = {}): WhiteboardElement =>
  ({
    id,
    type: ElementType.Rectangle,
    x,
    y,
    width,
    height,
    rx: 0,
    rotation: 0,
    opacity: 100,
    zIndex: 1,
    selectAfterDraw: false,
    style: {},
    ...extra,
  }) as WhiteboardElement;

describe('EditorStateService', () => {
  let service: EditorStateService;
  let elements: ElementsService;
  let selection: SelectionService;
  let history: HistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EditorStateService, ApiService] });
    service = TestBed.inject(EditorStateService);
    elements = TestBed.inject(ElementsService);
    selection = TestBed.inject(SelectionService);
    history = TestBed.inject(HistoryService);
  });

  describe('alignElements', () => {
    it('skips locked elements and is one undo step', () => {
      elements.setElements([
        rect('a', 0, 0, 10, 10),
        rect('b', 50, 20, 20, 40, { locked: true }),
        rect('c', 100, 5, 10, 10),
      ]);
      selection.selectElements(['a', 'b', 'c']);
      history.clearHistory();
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      service.alignElements('align-center');

      const byId = (id: string) => elements.getElements().find((e) => e.id === id) as WhiteboardElement;
      expect(byId('a').x).toBeCloseTo(51.67, 1);
      expect(byId('b').x).toBe(50);
      expect(byId('c').x).toBeCloseTo(51.67, 1);
      expect(warn).not.toHaveBeenCalled();

      const before = history.undo() as WhiteboardElement[];
      expect(before.find((e) => e.id === 'a')?.x).toBe(0);
      expect(before.find((e) => e.id === 'c')?.x).toBe(100);
      expect(before.find((e) => e.id === 'b')?.x).toBe(50);
      expect(history.undo()).toBeNull();
      warn.mockRestore();
    });

    it('leaves an element on a locked layer in place and aligns the rest in one undo step', () => {
      const layers = TestBed.inject(LayerManagementService);
      const base = layers.activeLayerId();
      const locked = layers.addLayer('Locked');
      layers.setActiveLayer(base);
      elements.addElements([
        rect('a', 40, 0, 10, 10),
        rect('onLockedLayer', 70, 20, 10, 10, { layerId: locked.id }),
        rect('c', 100, 5, 10, 10),
      ]);
      layers.toggleLayerLock(locked.id);
      selection.selectElements(['a', 'onLockedLayer', 'c']);
      history.clearHistory();

      service.alignElements('align-left');

      const byId = (id: string) => elements.getElements().find((e) => e.id === id) as WhiteboardElement;
      expect([byId('a').x, byId('onLockedLayer').x, byId('c').x]).toEqual([40, 70, 40]);
      expect(history.undo()).not.toBeNull();
      expect(history.undo()).toBeNull();
    });

    it('ApiService.undo restores the board the alignment changed', () => {
      elements.setElements([rect('a', 0, 0, 10, 10), rect('b', 50, 20, 20, 40)]);
      selection.selectElements(['a', 'b']);
      history.clearHistory();
      const api = TestBed.inject(ApiService);
      const xs = () => elements.getElements().map((e) => e.x);

      service.alignElements('align-right');
      expect(xs()).toEqual([60, 50]);

      expect(api.undo()).toBe(true);
      expect(xs()).toEqual([0, 50]);
      expect(api.redo()).toBe(true);
      expect(xs()).toEqual([60, 50]);
    });
  });

  describe('toggleTheme', () => {
    it('leaves the EditorConfig untouched', () => {
      const config = TestBed.inject(ConfigService);
      config.updateEditorConfigValue('title', 'Plan');
      const before = config.getEditorConfig();

      service.toggleTheme();
      service.toggleTheme();

      expect(config.getEditorConfig()).toBe(before);
      expect(config.getEditorConfig()).toEqual({ title: 'Plan' });
    });
  });

  describe('updateElementProperty', () => {
    it('stroke width edit applies to all selected in one undo step', () => {
      elements.setElements([
        rect('a', 0, 0, 10, 10, { style: { strokeWidth: 1 } }),
        rect('b', 20, 0, 10, 10, { style: { strokeWidth: 3 } }),
      ]);
      selection.selectElements(['a', 'b']);
      history.clearHistory();

      service.updateElementProperty('strokeWidth', 7);

      const widths = elements.getElements().map((e) => e.style.strokeWidth);
      expect(widths).toEqual([7, 7]);

      const before = history.undo() as WhiteboardElement[];
      expect(before.map((e) => e.style.strokeWidth)).toEqual([1, 3]);
      expect(history.undo()).toBeNull();
    });

    it('line style scales the dasharray to each element stroke width in one undo step', () => {
      elements.setElements([
        rect('a', 0, 0, 10, 10, { style: { strokeWidth: 2 } }),
        rect('b', 20, 0, 10, 10, { style: { strokeWidth: 8 } }),
      ]);
      selection.selectElements(['a', 'b']);
      history.clearHistory();

      service.updateElementProperty('lineStyle', 'dashed');

      expect(elements.getElements().map((e) => e.style.dasharray)).toEqual(['6,6', '24,24']);
      const before = history.undo() as WhiteboardElement[];
      expect(before.map((e) => e.style.dasharray)).toEqual([undefined, undefined]);
      expect(history.undo()).toBeNull();
    });

    it('solid line style clears the dasharray on every selected element', () => {
      elements.setElements([
        rect('a', 0, 0, 10, 10, { style: { strokeWidth: 2, dasharray: '6,6' } }),
        rect('b', 20, 0, 10, 10, { style: { strokeWidth: 8, dasharray: '8,16' } }),
      ]);
      selection.selectElements(['a', 'b']);

      service.updateLineStyle('solid');

      expect(elements.getElements().map((e) => e.style.dasharray)).toEqual(['', '']);
    });

    it('setting opacity folds a preset style opacity so the shown value is the rendered one', () => {
      elements.setElements([rect('a', 0, 0, 10, 10, { style: { opacity: 0.4 } })]);
      selection.selectElements(['a']);
      expect(service.selectedPropertiesSignal()?.opacity).toBe(40);

      service.updateElementProperty('opacity', 70);

      const el = elements.getElements()[0];
      expect(el.opacity).toBe(70);
      expect(el.style.opacity).toBeUndefined();
      expect(service.selectedPropertiesSignal()?.opacity).toBe(70);
    });

    it('a color edit on a multi-selection is one undo step', () => {
      elements.setElements([
        rect('a', 0, 0, 10, 10, { style: { strokeColor: '#000000', fill: '#ffffff' } }),
        rect('b', 20, 0, 10, 10, { style: { strokeColor: '#ff0000', fill: '#00ff00' } }),
      ]);
      selection.selectElements(['a', 'b']);
      history.clearHistory();

      service.updateStrokeColor('#123456');
      service.updateFillColor('#abcdef');

      expect(elements.getElements().map((e) => [e.style.strokeColor, e.style.fill])).toEqual([
        ['#123456', '#abcdef'],
        ['#123456', '#abcdef'],
      ]);
      expect((history.undo() as WhiteboardElement[]).map((e) => e.style.fill)).toEqual(['#ffffff', '#00ff00']);
      expect((history.undo() as WhiteboardElement[]).map((e) => e.style.strokeColor)).toEqual(['#000000', '#ff0000']);
      expect(history.undo()).toBeNull();
    });

    it('a dash edit on a multi-selection is one undo step', () => {
      elements.setElements([
        rect('a', 0, 0, 10, 10, { style: { dasharray: '' } }),
        rect('b', 20, 0, 10, 10, { style: { dasharray: '2,2' } }),
      ]);
      selection.selectElements(['a', 'b']);
      history.clearHistory();

      service.updateElementProperty('dasharray', '5,5');

      expect(elements.getElements().map((e) => e.style.dasharray)).toEqual(['5,5', '5,5']);
      expect((history.undo() as WhiteboardElement[]).map((e) => e.style.dasharray)).toEqual(['', '2,2']);
      expect(history.undo()).toBeNull();
    });

    it('mixed effective opacity (highlighter style opacity + plain) shows MIXED and one edit sets both', () => {
      elements.setElements([
        rect('highlight', 0, 0, 10, 10, { style: { opacity: 0.4 } }),
        rect('plain', 20, 0, 10, 10),
      ]);
      selection.selectElements(['highlight', 'plain']);
      history.clearHistory();
      expect(service.selectedPropertiesSignal()?.opacity).toBe(MIXED);

      service.updateElementProperty('opacity', 70);

      expect(elements.getElements().map((e) => [e.opacity, e.style.opacity])).toEqual([
        [70, undefined],
        [70, undefined],
      ]);
      expect(service.selectedPropertiesSignal()?.opacity).toBe(70);
      const before = history.undo() as WhiteboardElement[];
      expect(before.map((e) => [e.opacity, e.style.opacity])).toEqual([
        [100, 0.4],
        [100, undefined],
      ]);
      expect(history.undo()).toBeNull();
    });

    it('reports MIXED for differing selected values', () => {
      elements.setElements([
        rect('a', 0, 0, 10, 10, { style: { strokeColor: '#000' } }),
        rect('b', 20, 0, 10, 10, { style: { strokeColor: '#f00' } }),
      ]);
      selection.selectElements(['a', 'b']);

      expect(service.selectedPropertiesSignal()?.strokeColor).toBe(MIXED);
    });
  });

  describe('locked elements', () => {
    let warn: jest.SpyInstance;

    const mixedLockedSelection = () => {
      const layers = TestBed.inject(LayerManagementService);
      const base = layers.activeLayerId();
      const locked = layers.addLayer('Locked');
      layers.setActiveLayer(base);
      elements.addElements([
        rect('free', 0, 0, 10, 10, { style: { strokeWidth: 1 } }),
        rect('pinned', 50, 20, 20, 40, { locked: true, style: { strokeWidth: 1 } }),
        rect('onLockedLayer', 100, 5, 10, 10, { layerId: locked.id, style: { strokeWidth: 1 } }),
      ]);
      layers.toggleLayerLock(locked.id);
      selection.selectElements(['free', 'pinned', 'onLockedLayer']);
      history.clearHistory();
    };
    const byId = (id: string) => elements.getElements().find((e) => e.id === id) as WhiteboardElement;

    beforeEach(() => {
      warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => warn.mockRestore());

    it('edits only unlocked elements without lock warnings', () => {
      mixedLockedSelection();

      service.updateStrokeColor('#ff0000');
      service.updateFillColor('#00ff00');
      service.updateStrokeWidth(5);
      service.updateOpacity(40);
      service.updateDashArray('2,2');
      service.updateElementProperty('lineCap', 'round');
      service.alignElements('align-left');

      expect(warn).not.toHaveBeenCalled();
      expect(byId('free').style.strokeWidth).toBe(5);
      expect(byId('free').opacity).toBe(40);
      expect(byId('pinned').style.strokeWidth).toBe(1);
      expect(byId('pinned').x).toBe(50);
      expect(byId('onLockedLayer').style.strokeWidth).toBe(1);
      expect(byId('onLockedLayer').opacity).toBe(100);
    });

    it('drops no-op updates', () => {
      mixedLockedSelection();
      const updateSpy = jest.spyOn(elements, 'updateElements');

      service.updateStrokeWidth(1);
      service.updateOpacity(100);

      expect(updateSpy).not.toHaveBeenCalled();
      expect(history.undo()).toBeNull();
    });
  });

  describe('grid and snap toggles', () => {
    let config: ConfigService;

    beforeEach(() => (config = TestBed.inject(ConfigService)));

    it('first snap click flips the configured value', () => {
      const initial = config.getConfig().snapToGrid;
      service.toggleSnapToGrid();
      expect(config.getConfig().snapToGrid).toBe(!initial);
    });

    it('first grid click turns off a grid the consumer enabled', () => {
      config.updateConfig({ enableGrid: true });
      service.toggleGrid();
      expect(config.getConfig().enableGrid).toBe(false);
      service.toggleGrid();
      expect(config.getConfig().enableGrid).toBe(true);
    });

    it('config edits from the editor emit no ZoomChange', () => {
      const emitted: WhiteboardEvent[] = [];
      const sub = TestBed.inject(EventBusService)
        .listen()
        .subscribe((e) => emitted.push(e.type));

      service.toggleGrid();
      service.toggleSnapToGrid();
      service.updateBackgroundColor('#123456');
      sub.unsubscribe();

      expect(emitted).not.toContain(WhiteboardEvent.ZoomChange);
      expect(config.getConfig().backgroundColor).toBe('#123456');
    });
  });

  describe('undo / redo', () => {
    it('go through ApiService so (undo)/(redo) events fire', () => {
      elements.setElements([rect('a', 0, 0, 10, 10, { style: { strokeWidth: 1 } })]);
      selection.selectElements(['a']);
      history.clearHistory();
      service.updateStrokeWidth(4);

      const emitted: WhiteboardEvent[] = [];
      const sub = TestBed.inject(EventBusService)
        .listen()
        .subscribe((e) => emitted.push(e.type));
      service.undo();
      service.redo();
      sub.unsubscribe();

      expect(emitted).toEqual(expect.arrayContaining([WhiteboardEvent.Undo, WhiteboardEvent.Redo]));
      expect(elements.getElements()[0].style.strokeWidth).toBe(4);
    });
  });
});
