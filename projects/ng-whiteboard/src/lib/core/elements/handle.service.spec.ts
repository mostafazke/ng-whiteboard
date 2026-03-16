import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { HandleService, EndpointHandle, CurveHandle } from './handle.service';
import { SelectionService } from './selection.service';
import { ApiService } from '../api';
import { ElementType, WhiteboardElement } from '../types';
import { createElement } from './element.utils';
import { ArrowElement } from './arrow-element';
import { LineElement } from './line-element';

describe('HandleService', () => {
  let service: HandleService;
  let selectedIdsSignal: WritableSignal<string[]>;
  let allElementsSignal: WritableSignal<WhiteboardElement[]>;
  let isLineOnlySignal: WritableSignal<boolean>;

  beforeEach(() => {
    selectedIdsSignal = signal<string[]>([]);
    allElementsSignal = signal<WhiteboardElement[]>([]);
    isLineOnlySignal = signal<boolean>(false);

    const mockSelectionService = {
      selectedIdsSignal,
      isLineOnlySelectionSignal: isLineOnlySignal,
    };

    const mockApiService = {
      allElements: allElementsSignal,
    };

    TestBed.configureTestingModule({
      providers: [
        HandleService,
        { provide: SelectionService, useValue: mockSelectionService },
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(HandleService);
  });

  describe('isLineOnlySelection', () => {
    it('should delegate to selectionService.isLineOnlySelectionSignal', () => {
      expect(service.isLineOnlySelection()).toBe(false);
      isLineOnlySignal.set(true);
      expect(service.isLineOnlySelection()).toBe(true);
    });
  });

  describe('lineEndpointHandles', () => {
    it('should return empty array when no ids are selected', () => {
      expect(service.lineEndpointHandles()).toEqual([]);
    });

    it('should return start and end handles for a selected arrow', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 10,
        y: 20,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 50,
        rotation: 0,
        startBinding: null,
        endBinding: null,
      }) as ArrowElement;

      allElementsSignal.set([arrow]);
      selectedIdsSignal.set([arrow.id]);

      const handles = service.lineEndpointHandles();
      expect(handles.length).toBe(2);

      const startHandle = handles.find((h) => h.end === 'start')!;
      expect(startHandle.elementId).toBe(arrow.id);
      expect(startHandle.x).toBe(10); // x + x1
      expect(startHandle.y).toBe(20); // y + y1
      expect(startHandle.bound).toBe(false);
      expect(startHandle.elementType).toBe(ElementType.Arrow);

      const endHandle = handles.find((h) => h.end === 'end')!;
      expect(endHandle.x).toBe(110);
      expect(endHandle.y).toBe(70);
      expect(endHandle.bound).toBe(false);
    });

    it('should set bound flag when arrow has bindings', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        rotation: 0,
        startBinding: { elementId: 'rect1', pointId: 'top', focus: 0.5, gap: 0 },
        endBinding: { elementId: 'rect2', pointId: 'bottom', focus: 0.5, gap: 0 },
      }) as ArrowElement;

      allElementsSignal.set([arrow]);
      selectedIdsSignal.set([arrow.id]);

      const handles = service.lineEndpointHandles();
      expect(handles.find((h) => h.end === 'start')!.bound).toBe(true);
      expect(handles.find((h) => h.end === 'end')!.bound).toBe(true);
    });

    it('should return handles for selected line elements', () => {
      const line = createElement(ElementType.Line, {
        x: 5,
        y: 15,
        x1: 0,
        y1: 0,
        x2: 200,
        y2: 100,
        rotation: 0,
      }) as LineElement;

      allElementsSignal.set([line]);
      selectedIdsSignal.set([line.id]);

      const handles = service.lineEndpointHandles();
      expect(handles.length).toBe(2);
      expect(handles[0].elementType).toBe(ElementType.Line);
      expect(handles[0].bound).toBe(false);
      expect(handles[1].bound).toBe(false);
      expect(handles[0].x).toBe(5);
      expect(handles[1].x).toBe(205);
    });

    it('should skip non-arrow/line elements', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });

      allElementsSignal.set([rect]);
      selectedIdsSignal.set([rect.id]);

      const handles = service.lineEndpointHandles();
      expect(handles).toEqual([]);
    });

    it('should skip when element is not found in allElements', () => {
      selectedIdsSignal.set(['nonexistent-id']);
      allElementsSignal.set([]);

      const handles = service.lineEndpointHandles();
      expect(handles).toEqual([]);
    });

    it('should handle multiple selected elements', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        rotation: 0,
        startBinding: null,
        endBinding: null,
      }) as ArrowElement;
      const line = createElement(ElementType.Line, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 50,
        y2: 50,
        rotation: 0,
      }) as LineElement;

      allElementsSignal.set([arrow, line]);
      selectedIdsSignal.set([arrow.id, line.id]);

      const handles = service.lineEndpointHandles();
      expect(handles.length).toBe(4); // 2 per element
    });
  });

  describe('curveHandles', () => {
    it('should return empty array when no ids are selected', () => {
      expect(service.curveHandles()).toEqual([]);
    });

    it('should skip non-arrow elements', () => {
      const line = createElement(ElementType.Line, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        rotation: 0,
      }) as LineElement;

      allElementsSignal.set([line]);
      selectedIdsSignal.set([line.id]);

      expect(service.curveHandles()).toEqual([]);
    });

    it('should skip elements not found in allElements', () => {
      selectedIdsSignal.set(['missing']);
      allElementsSignal.set([]);
      expect(service.curveHandles()).toEqual([]);
    });

    it('should return midpoint handle for straight arrow (no pathType)', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 10,
        y: 20,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
      }) as ArrowElement;
      // Ensure no pathType
      (arrow as any).pathType = undefined;

      allElementsSignal.set([arrow]);
      selectedIdsSignal.set([arrow.id]);

      const handles = service.curveHandles();
      expect(handles.length).toBe(1);
      expect(handles[0].isCurved).toBe(false);
      expect(handles[0].x).toBeCloseTo(60, 1); // midX = (10 + 110) / 2
      expect(handles[0].y).toBeCloseTo(20, 1); // midY = (20 + 20) / 2
    });

    it('should return curve handle for quadratic arrow without rotation', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
      }) as ArrowElement;
      (arrow as any).pathType = { type: 'quadratic', cx: 50, cy: 30 };

      allElementsSignal.set([arrow]);
      selectedIdsSignal.set([arrow.id]);

      const handles = service.curveHandles();
      expect(handles.length).toBe(1);
      expect(handles[0].isCurved).toBe(true);
      expect(handles[0].x).toBe(50); // arrow.x + cx
      expect(handles[0].y).toBe(30); // arrow.y + cy
    });

    it('should return curve handle for quadratic arrow with rotation', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 90,
      }) as ArrowElement;
      (arrow as any).pathType = { type: 'quadratic', cx: 50, cy: 0 };

      allElementsSignal.set([arrow]);
      selectedIdsSignal.set([arrow.id]);

      const handles = service.curveHandles();
      expect(handles.length).toBe(1);
      expect(handles[0].isCurved).toBe(true);
      // After 90° rotation around pivot (50, 0):
      // cx=50, cy=0, pivot=(50,0), dx=0, dy=0 → cx stays 50, cy stays 0
      expect(handles[0].x).toBeCloseTo(50, 1);
      expect(handles[0].y).toBeCloseTo(0, 1);
    });

    it('should handle quadratic with scaleX and scaleY', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
        scaleX: 2,
        scaleY: 3,
      }) as ArrowElement;
      (arrow as any).pathType = { type: 'quadratic', cx: 50, cy: 20 };

      allElementsSignal.set([arrow]);
      selectedIdsSignal.set([arrow.id]);

      const handles = service.curveHandles();
      expect(handles.length).toBe(1);
      expect(handles[0].x).toBe(100); // 0 + 50*2
      expect(handles[0].y).toBe(60); // 0 + 20*3
    });

    it('should return curve handle for elbow arrow with rotation=0', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 10,
        y: 20,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 80,
        rotation: 0,
      }) as ArrowElement;
      (arrow as any).pathType = { type: 'elbow', midRatio: 0.5 };

      allElementsSignal.set([arrow]);
      selectedIdsSignal.set([arrow.id]);

      const handles = service.curveHandles();
      expect(handles.length).toBe(1);
      expect(handles[0].isCurved).toBe(true);
      // localX = 0 + (100-0)*0.5 = 50, localY = (0+80)/2 = 40
      // rot=0: bendX = 10 + 50 = 60, bendY = 20 + 40 = 60
      expect(handles[0].x).toBeCloseTo(60, 1);
      expect(handles[0].y).toBeCloseTo(60, 1);
    });

    it('should return curve handle for elbow arrow with rotation!=0', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 180,
      }) as ArrowElement;
      (arrow as any).pathType = { type: 'elbow', midRatio: 0.5 };

      allElementsSignal.set([arrow]);
      selectedIdsSignal.set([arrow.id]);

      const handles = service.curveHandles();
      expect(handles.length).toBe(1);
      expect(handles[0].isCurved).toBe(true);
      // localX = 0 + 100*0.5 = 50, localY = 0
      // pivot = (50, 0), dx=0, dy=0 → rotated stays same
      // bendX = 0 + 50 + 0 = 50, bendY = 0 + 0 + 0 = 0
      expect(handles[0].x).toBeCloseTo(50, 0);
      expect(handles[0].y).toBeCloseTo(0, 0);
    });

    it('should use default midRatio of 0.5 for elbow when not specified', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 200,
        y2: 100,
        rotation: 0,
      }) as ArrowElement;
      (arrow as any).pathType = { type: 'elbow' };

      allElementsSignal.set([arrow]);
      selectedIdsSignal.set([arrow.id]);

      const handles = service.curveHandles();
      expect(handles.length).toBe(1);
      // midRatio defaults to 0.5: localX = 0 + 200*0.5 = 100
      expect(handles[0].x).toBeCloseTo(100, 1);
    });

    it('should handle elbow with scale factors', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 50,
        rotation: 0,
        scaleX: 2,
        scaleY: 2,
      }) as ArrowElement;
      (arrow as any).pathType = { type: 'elbow', midRatio: 0.5 };

      allElementsSignal.set([arrow]);
      selectedIdsSignal.set([arrow.id]);

      const handles = service.curveHandles();
      expect(handles.length).toBe(1);
      // localX = 0*2 + (100-0)*2*0.5 = 100
      // localY = (0*2 + 50*2)/2 = 50
      expect(handles[0].x).toBeCloseTo(100, 1);
      expect(handles[0].y).toBeCloseTo(50, 1);
    });

    it('should handle quadratic with undefined scaleX/scaleY (default to 1)', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 5,
        y: 10,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
      }) as ArrowElement;
      // Remove scaleX/scaleY to test ?? 1 fallback
      delete (arrow as any).scaleX;
      delete (arrow as any).scaleY;
      (arrow as any).pathType = { type: 'quadratic', cx: 50, cy: 25 };

      allElementsSignal.set([arrow]);
      selectedIdsSignal.set([arrow.id]);

      const handles = service.curveHandles();
      expect(handles.length).toBe(1);
      expect(handles[0].x).toBe(55); // 5 + 50*1
      expect(handles[0].y).toBe(35); // 10 + 25*1
    });

    it('should handle elbow with undefined scaleX/scaleY/rotation', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
      }) as ArrowElement;
      delete (arrow as any).scaleX;
      delete (arrow as any).scaleY;
      delete (arrow as any).rotation;
      (arrow as any).pathType = { type: 'elbow', midRatio: 0.5 };

      allElementsSignal.set([arrow]);
      selectedIdsSignal.set([arrow.id]);

      const handles = service.curveHandles();
      expect(handles.length).toBe(1);
      // scaleX=1, scaleY=1, rotation=0
      // localX = 0 + 100*0.5 = 50, localY = (0+100)/2 = 50
      expect(handles[0].x).toBeCloseTo(50, 1);
      expect(handles[0].y).toBeCloseTo(50, 1);
    });

    it('should handle quadratic arrow with undefined rotation (default to 0)', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
      }) as ArrowElement;
      delete (arrow as any).rotation;
      (arrow as any).pathType = { type: 'quadratic', cx: 50, cy: 30 };

      allElementsSignal.set([arrow]);
      selectedIdsSignal.set([arrow.id]);

      const handles = service.curveHandles();
      expect(handles[0].x).toBeCloseTo(50, 1);
      expect(handles[0].y).toBeCloseTo(30, 1);
    });

    it('should return multiple curve handles for multiple selected arrows', () => {
      const arrow1 = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
      }) as ArrowElement;
      const arrow2 = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 200,
        y2: 0,
        rotation: 0,
      }) as ArrowElement;

      allElementsSignal.set([arrow1, arrow2]);
      selectedIdsSignal.set([arrow1.id, arrow2.id]);

      const handles = service.curveHandles();
      expect(handles.length).toBe(2);
    });
  });
});
