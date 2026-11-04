import { TestBed } from '@angular/core/testing';
import { ApiService } from '../../api/api.service';
import { ConfigService } from '../../config/config.service';
import { ElementsService } from '../../elements/elements.service';
import { LayerManagementService } from '../../elements/layer-management.service';
import { EventBusService } from '../../event-bus/event-bus.service';
import { SelectionService } from '../../elements/selection.service';
import { HistoryService } from '../../history/history.service';
import { ArrowBindingService } from '../../elements/arrow-binding.service';
import { ArrowElement, ArrowheadType } from '../../elements';
import { ElementType, LineCap, PenType, WhiteboardElement, WhiteboardEvent } from '../../types';
import { IOService } from '../../input/io.service';
import { EditorStateService } from './editor-state.service';
import { DEFAULT_BOARD_TITLE } from './utils/board-title';
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

const arrow = (id: string, extra = {}): WhiteboardElement =>
  ({
    id,
    type: ElementType.Arrow,
    x: 0,
    y: 0,
    x1: 0,
    y1: 0,
    x2: 100,
    y2: 0,
    rotation: 0,
    opacity: 100,
    zIndex: 1,
    selectAfterDraw: false,
    startBinding: null,
    endBinding: null,
    pathType: { type: 'straight' },
    startHead: { type: ArrowheadType.OpenArrow },
    endHead: { type: ArrowheadType.Arrow },
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

  describe('layersSignal', () => {
    it('counts elements loaded without layerId on the default layer', () => {
      elements.setElements(Array.from({ length: 6 }, (_, i) => rect(`r${i}`, 0, 0, 10, 10)));

      const layers = service.layersSignal();

      expect(layers).toHaveLength(1);
      expect(layers[0].elements).toHaveLength(6);
    });
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

    it('stroke width keeps each element line style in proportion and leaves custom dashes alone', () => {
      elements.setElements([
        rect('a', 0, 0, 10, 10, { style: { strokeWidth: 2, dasharray: '6,6' } }),
        rect('b', 20, 0, 10, 10, { style: { strokeWidth: 2, dasharray: '4,9' } }),
        rect('c', 40, 0, 10, 10, { style: { strokeWidth: 2, dasharray: '' } }),
      ]);
      selection.selectElements(['a', 'b', 'c']);

      service.updateElementProperty('strokeWidth', 5);

      expect(elements.getElements().map((e) => e.style.dasharray)).toEqual(['15,15', '4,9', '']);
    });

    it('stroke width with nothing selected rescales the default line style', () => {
      selection.selectElements([]);
      service.updateElementProperty('lineStyle', 'dotted');
      service.updateElementProperty('strokeWidth', 4);

      expect(TestBed.inject(ConfigService).getConfig().dasharray).toBe('4,8');
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

      service.updateElementProperty('lineStyle', 'dashed');

      const [a, b] = elements.getElements().map((e) => e.style.dasharray);
      expect(a).toBeTruthy();
      expect(b).toBe(a);
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
      service.updateLineStyle('dashed');
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

  describe('arrow, line end, corner radius and brush properties', () => {
    const get = (id: string) => elements.getElements().find((e) => e.id === id) as WhiteboardElement;
    const arrowOf = (id: string) => get(id) as ArrowElement;
    const rxOf = (id: string) => (get(id) as unknown as { rx: number }).rx;
    const config = () => TestBed.inject(ConfigService).getConfig();

    it('updateArrowHead changes every selected arrow in one undoable step', () => {
      elements.setElements([arrow('a'), arrow('b')]);
      selection.selectElements(['a', 'b']);
      history.clearHistory();

      service.updateArrowHead('end', ArrowheadType.Diamond);

      expect(arrowOf('a').endHead.type).toBe('diamond');
      expect(arrowOf('b').endHead.type).toBe('diamond');
      const before = history.undo() as ArrowElement[];
      expect(before.map((e) => e.endHead.type)).toEqual(['arrow', 'arrow']);
      expect(history.undo()).toBeNull();
    });

    it('updateArrowHead skips a locked arrow and stays one step', () => {
      elements.setElements([arrow('a'), arrow('b', { locked: true })]);
      selection.selectElements(['a', 'b']);
      history.clearHistory();

      service.updateArrowHead('start', ArrowheadType.Circle);

      expect(arrowOf('a').startHead.type).toBe('circle');
      expect(arrowOf('b').startHead.type).toBe('open-arrow');
      expect(history.undo()).not.toBeNull();
      expect(history.undo()).toBeNull();
    });

    it('updateArrowHead leaves other element types untouched', () => {
      elements.setElements([arrow('a'), rect('r', 0, 0, 10, 10)]);
      selection.selectElements(['a', 'r']);
      const rectBefore = get('r');

      service.updateArrowHead('end', ArrowheadType.Bar);

      expect(get('r')).toBe(rectBefore);
      expect(arrowOf('a').endHead.type).toBe('bar');
    });

    it('swapArrowHeads swaps both heads and one undo restores', () => {
      elements.setElements([arrow('a'), arrow('b', { startHead: { type: ArrowheadType.Bar } })]);
      selection.selectElements(['a', 'b']);
      history.clearHistory();

      service.swapArrowHeads();

      expect([arrowOf('a').startHead.type, arrowOf('a').endHead.type]).toEqual(['arrow', 'open-arrow']);
      expect([arrowOf('b').startHead.type, arrowOf('b').endHead.type]).toEqual(['arrow', 'bar']);
      const before = history.undo() as ArrowElement[];
      expect([before[0].startHead.type, before[0].endHead.type]).toEqual(['open-arrow', 'arrow']);
      expect(history.undo()).toBeNull();
    });

    it('swapArrowHeads records no history step when every head pair is equal', () => {
      elements.setElements([arrow('a', { startHead: { type: ArrowheadType.Arrow } })]);
      selection.selectElements(['a']);
      history.clearHistory();

      service.swapArrowHeads();

      expect(history.undo()).toBeNull();
    });

    it('updateArrowPath bows a flat default curve in one step', () => {
      elements.setElements([arrow('a', { pathType: { type: 'quadratic', cx: 50, cy: 0 } })]);
      selection.selectElements(['a']);
      history.clearHistory();

      service.updateArrowPath('curve');

      expect(arrowOf('a').pathType).toEqual({ type: 'quadratic', cx: 50, cy: 20 });
      expect(history.undo()).not.toBeNull();
      expect(history.undo()).toBeNull();
    });

    it('updateArrowPath leaves an already bowed curve alone', () => {
      elements.setElements([arrow('a', { pathType: { type: 'quadratic', cx: 50, cy: 30 } })]);
      selection.selectElements(['a']);
      history.clearHistory();

      service.updateArrowPath('curve');

      expect(arrowOf('a').pathType).toEqual({ type: 'quadratic', cx: 50, cy: 30 });
      expect(history.undo()).toBeNull();
    });

    it('updateArrowPath converts to curve then back to straight', () => {
      elements.setElements([arrow('a')]);
      selection.selectElements(['a']);

      service.updateArrowPath('curve');
      expect(arrowOf('a').pathType).toEqual({ type: 'quadratic', cx: 50, cy: 20 });

      service.updateArrowPath('straight');
      expect(arrowOf('a').pathType).toEqual({ type: 'straight' });
    });

    it('a curved arrow bound to a rectangle still follows the rectangle', () => {
      const binding = TestBed.inject(ArrowBindingService);
      const bound = arrow('a', { x1: 0, y1: 50, x2: 150, y2: 50 }) as ArrowElement;
      elements.setElements([rect('r', 200, 0, 100, 100), bound]);
      elements.updateElements([binding.attachEnd(bound, 'r', 'left', 0)] as never);
      selection.selectElements(['a']);

      service.updateArrowPath('curve');
      expect(arrowOf('a').pathType.type).toBe('quadratic');
      const endBefore = { x: arrowOf('a').x2, y: arrowOf('a').y2 };

      elements.updateElements([{ id: 'r', x: 400, y: 300 }] as never);
      expect(() =>
        elements.updateElements(binding.recomputeBindingsForElements(new Set(['r'])) as never)
      ).not.toThrow();

      const moved = arrowOf('a');
      expect(moved.x2).not.toBe(endBefore.x);
      expect(moved.y2).not.toBe(endBefore.y);
      expect(moved.endBinding?.elementId).toBe('r');
    });

    it('updateCornerRadius clamps to 0-50 on rectangles only', () => {
      elements.setElements([rect('r', 0, 0, 100, 100), arrow('a')]);
      selection.selectElements(['r', 'a']);

      service.updateCornerRadius(80);
      expect(rxOf('r')).toBe(50);

      service.updateCornerRadius(-4);
      expect(rxOf('r')).toBe(0);

      service.updateCornerRadius(12.6);
      expect(rxOf('r')).toBe(13);
    });

    it('writes config when nothing is selected', () => {
      service.updateCornerRadius(0);
      expect(config().cornerRadius).toBe(0);

      const before = config().arrowConfig;
      service.updateArrowHead('start', ArrowheadType.Circle);
      expect(config().arrowConfig).not.toBe(before);
      expect(config().arrowConfig).toEqual({ ...before, startHeadStyle: 'circle' });

      service.updateArrowPath('elbow');
      expect(config().arrowConfig.lineStyle).toBe('elbow');

      service.swapArrowHeads();
      expect(config().arrowConfig.startHeadStyle).toBe(before.endHeadStyle);
      expect(config().arrowConfig.endHeadStyle).toBe('circle');

      service.updateLineCap(LineCap.Square);
      expect(config().lineCap).toBe('square');

      service.updatePenType(PenType.Marker);
      expect(config().penType).toBe('marker');
    });

    it('updateLineCap sets style.lineCap on lines and arrows only', () => {
      elements.setElements([arrow('a'), rect('r', 0, 0, 10, 10)]);
      selection.selectElements(['a', 'r']);

      service.updateLineCap(LineCap.Round);

      expect(get('a').style?.lineCap).toBe('round');
      expect(get('r').style?.lineCap).toBeUndefined();
    });

    it('updateElementProperty routes the new properties', () => {
      elements.setElements([arrow('a')]);
      selection.selectElements(['a']);

      service.updateElementProperty('endHead', 'bar');
      expect(arrowOf('a').endHead.type).toBe('bar');

      service.updateElementProperty('swapArrowHeads', true);
      expect(arrowOf('a').startHead.type).toBe('bar');

      service.updateElementProperty('arrowPath', 'elbow');
      expect(arrowOf('a').pathType.type).toBe('elbow');

      service.updateElementProperty('startHead', 'circle');
      expect(arrowOf('a').startHead.type).toBe('circle');
    });
  });
});

describe('EditorStateService board file actions', () => {
  let service: EditorStateService;
  let io: {
    exportDataAsFile: jest.Mock;
    exportData: jest.Mock;
    importDataFromFile: jest.Mock;
    copyToClipboard: jest.Mock;
  };
  let api: ApiService;

  beforeEach(() => {
    io = {
      exportDataAsFile: jest.fn(),
      exportData: jest.fn().mockReturnValue('{"elements":[]}'),
      importDataFromFile: jest.fn().mockResolvedValue(undefined),
      copyToClipboard: jest.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [EditorStateService, ApiService, { provide: IOService, useValue: io }],
    });
    TestBed.inject(ConfigService).updateEditorConfigValue('title', 'Host title');
    service = TestBed.inject(EditorStateService);
    api = TestBed.inject(ApiService);
  });

  it('captures the initial title on construction', () => {
    expect(service.initialTitle).toBe('Host title');
  });

  it('exposes the export session settings with their defaults', () => {
    expect(service.exportSettings()).toEqual({ format: 'png', scale: 2, background: true, embedBoardData: true });
  });

  it('without in-place saving, Save downloads the board as <title>', async () => {
    expect(service.canSaveInPlace).toBe(false);
    service.updateTitle('Sprint plan');
    await service.saveBoard();
    expect(io.exportDataAsFile).toHaveBeenCalledWith('Sprint plan');
    expect(service.statusMessage()).toBe('Downloaded Sprint plan.json');
  });

  it('tracks unsaved changes only after the board was saved or opened', async () => {
    const history = TestBed.inject(HistoryService);
    expect(service.saveState()).toBe('none');
    history.recordChange([], [rect('r', 0, 0, 10, 10)], 'Add');
    expect(service.saveState()).toBe('none');

    await service.saveBoard();
    expect(service.saveState()).toBe('saved');

    history.recordChange([rect('r', 0, 0, 10, 10)], [], 'Delete');
    expect(service.saveState()).toBe('unsaved');
    history.undo();
    expect(service.saveState()).toBe('saved');

    service.updateTitle('Renamed');
    expect(service.saveState()).toBe('unsaved');
  });

  it('marks an opened board as saved and Reset unlinks it', async () => {
    await service.openBoard(new File(['{}'], 'a.json', { type: 'application/json' }));
    expect(service.saveState()).toBe('saved');
    service.resetBoard();
    expect(service.saveState()).toBe('none');
    expect(service.fileName()).toBeNull();
  });

  it('openBoard imports the file', async () => {
    const file = new File(['{}'], 'a.json', { type: 'application/json' });
    await service.openBoard(file);
    expect(io.importDataFromFile).toHaveBeenCalledWith(file);
  });

  it('openBoard logs a failure and does not reject', async () => {
    const file = new File(['{}'], 'a.json', { type: 'application/json' });
    const error = jest.spyOn(console, 'error').mockImplementation();
    const failure = new Error('bad');
    io.importDataFromFile.mockRejectedValueOnce(failure);
    await expect(service.openBoard(file)).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('open'), failure);
    error.mockRestore();
  });

  it('Save falls back to the default title', async () => {
    service.updateTitle('');
    await service.saveBoard();
    expect(io.exportDataAsFile).toHaveBeenCalledWith(DEFAULT_BOARD_TITLE);
  });

  it('a failed open keeps the board unlinked and explains an image without board data', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    io.importDataFromFile.mockRejectedValueOnce(new Error('This image has no board data.'));
    await service.openBoard(new File(['x'], 'a.png', { type: 'image/png' }));
    expect(service.saveState()).toBe('none');
    expect(service.statusMessage()).toBe('This image has no board data');
  });

  it('copyAsPng copies with the export settings, padding 16 and the selection', async () => {
    const elements = TestBed.inject(ElementsService);
    elements.setElements([rect('r', 0, 0, 10, 10)]);
    TestBed.inject(SelectionService).selectElements(['r']);
    service.exportSettings.set({ format: 'png', scale: 3, background: false, embedBoardData: true });

    await service.copyAsPng();

    expect(io.copyToClipboard).toHaveBeenCalledWith('png', {
      scale: 3,
      background: false,
      padding: 16,
      onlySelected: true,
    });
  });

  it('copyAsPng does not reject when the clipboard fails', async () => {
    io.copyToClipboard.mockRejectedValueOnce(new Error('denied'));
    await expect(service.copyAsPng()).resolves.toBeUndefined();
  });

  describe('status message', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('reports a successful copy and hides after 2.5s', async () => {
      await service.copyAsPng();
      expect(service.statusMessage()).toBe('Copied to clipboard');
      jest.advanceTimersByTime(2499);
      expect(service.statusMessage()).toBe('Copied to clipboard');
      jest.advanceTimersByTime(2);
      expect(service.statusMessage()).toBeNull();
    });

    it('reports a failed copy', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      TestBed.inject(IOService).copyToClipboard = jest.fn().mockRejectedValue(new Error('denied'));
      await service.copyAsPng();
      expect(service.statusMessage()).toBe("Couldn't copy");
    });

    it('reports a file that could not be opened', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      TestBed.inject(IOService).importDataFromFile = jest.fn().mockRejectedValue(new Error('bad'));
      await service.openBoard(new File(['x'], 'a.json'));
      expect(service.statusMessage()).toBe("Couldn't open that file");
    });

    it('a newer message restarts the timer', () => {
      service.notify('one');
      jest.advanceTimersByTime(2000);
      service.notify('two');
      jest.advanceTimersByTime(2000);
      expect(service.statusMessage()).toBe('two');
      jest.advanceTimersByTime(600);
      expect(service.statusMessage()).toBeNull();
    });
  });

  it('resetBoard clears the board, restores the title and resets zoom and pan', () => {
    const reset = jest.spyOn(api, 'resetBoard');
    const centre = jest.spyOn(service, 'centerView');
    service.updateTitle('Changed');

    service.resetBoard();

    expect(reset).toHaveBeenCalledTimes(1);
    expect(service.getEditorConfigSignal()().title).toBe('Host title');
    expect(centre).toHaveBeenCalledTimes(1);
  });

  it('hasContent follows the board', () => {
    expect(service.hasContent()).toBe(false);
    TestBed.inject(ElementsService).setElements([rect('r', 0, 0, 10, 10)]);
    expect(service.hasContent()).toBe(true);
  });
});

describe('EditorStateService saving in place', () => {
  type Handle = { name: string; getFile: jest.Mock; createWritable: jest.Mock };
  const win = window as unknown as Record<string, unknown>;
  let service: EditorStateService;
  let io: { exportData: jest.Mock; importDataFromFile: jest.Mock; exportDataAsFile: jest.Mock };
  let saveHandle: Handle;
  let showSaveFilePicker: jest.Mock;
  let showOpenFilePicker: jest.Mock;

  function handle(name: string, file?: File): Handle {
    return {
      name,
      getFile: jest.fn().mockResolvedValue(file),
      createWritable: jest.fn().mockResolvedValue({
        write: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      }),
    };
  }

  beforeEach(() => {
    saveHandle = handle('board.json');
    showSaveFilePicker = jest.fn().mockResolvedValue(saveHandle);
    showOpenFilePicker = jest.fn();
    win['showSaveFilePicker'] = showSaveFilePicker;
    win['showOpenFilePicker'] = showOpenFilePicker;
    io = {
      exportData: jest.fn().mockReturnValue('{"elements":[]}'),
      importDataFromFile: jest.fn().mockResolvedValue(undefined),
      exportDataAsFile: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [EditorStateService, ApiService, { provide: IOService, useValue: io }],
    });
    TestBed.inject(ConfigService).updateEditorConfigValue('title', 'Plan');
    service = TestBed.inject(EditorStateService);
  });

  afterEach(() => {
    delete win['showSaveFilePicker'];
    delete win['showOpenFilePicker'];
  });

  it('asks where to save once, then writes to the same file', async () => {
    expect(service.canSaveInPlace).toBe(true);
    await service.saveBoard();
    expect(showSaveFilePicker).toHaveBeenCalledWith(expect.objectContaining({ suggestedName: 'Plan.json' }));
    expect(saveHandle.createWritable).toHaveBeenCalledTimes(1);
    expect(service.fileName()).toBe('board.json');
    expect(service.statusMessage()).toBe('Saved to board.json');

    await service.saveBoard();
    expect(showSaveFilePicker).toHaveBeenCalledTimes(1);
    expect(saveHandle.createWritable).toHaveBeenCalledTimes(2);
    expect(io.exportDataAsFile).not.toHaveBeenCalled();
  });

  it('Save as always asks for a new file', async () => {
    await service.saveBoard();
    showSaveFilePicker.mockResolvedValueOnce(handle('copy.json'));
    await service.saveBoardAs();
    expect(showSaveFilePicker).toHaveBeenCalledTimes(2);
    expect(service.fileName()).toBe('copy.json');
  });

  it('cancelling the picker is silent and leaves the board unsaved', async () => {
    showSaveFilePicker.mockRejectedValueOnce(new DOMException('cancelled', 'AbortError'));
    await service.saveBoard();
    expect(service.statusMessage()).toBeNull();
    expect(service.saveState()).toBe('none');
  });

  it('reports a failed write without marking the board saved', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    saveHandle.createWritable.mockRejectedValueOnce(new Error('denied'));
    await service.saveBoard();
    expect(service.statusMessage()).toBe("Couldn't save");
    expect(service.saveState()).toBe('none');
  });

  it('opening a board file links it, so Save writes back without asking', async () => {
    const file = new File(['{}'], 'mine.json', { type: 'application/json' });
    const opened = handle('mine.json', file);
    showOpenFilePicker.mockResolvedValue([opened]);
    await service.pickAndOpenBoard();
    expect(io.importDataFromFile).toHaveBeenCalledWith(file);
    expect(service.fileName()).toBe('mine.json');

    await service.saveBoard();
    expect(showSaveFilePicker).not.toHaveBeenCalled();
    expect(opened.createWritable).toHaveBeenCalled();
  });

  it('opening an exported image never links it, so Save asks for a board file', async () => {
    const file = new File(['png'], 'shot.png', { type: 'image/png' });
    showOpenFilePicker.mockResolvedValue([handle('shot.png', file)]);
    await service.pickAndOpenBoard();
    expect(service.fileName()).toBeNull();
    expect(service.saveState()).toBe('saved');

    await service.saveBoard();
    expect(showSaveFilePicker).toHaveBeenCalled();
  });
});
