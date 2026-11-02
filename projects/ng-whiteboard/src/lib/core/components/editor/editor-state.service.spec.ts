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
