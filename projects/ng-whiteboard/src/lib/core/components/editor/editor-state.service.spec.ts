import { TestBed } from '@angular/core/testing';
import { ElementsService } from '../../elements/elements.service';
import { SelectionService } from '../../elements/selection.service';
import { HistoryService } from '../../history/history.service';
import { ElementType, WhiteboardElement } from '../../types';
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
    TestBed.configureTestingModule({ providers: [EditorStateService] });
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
      expect(warn).toHaveBeenCalled();

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
});
