import { TestBed } from '@angular/core/testing';
import { ArrowBindingService } from './arrow-binding.service';
import { ConnectionPointsService } from './connection-points.service';
import { ElementsService } from './elements.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { HistoryService } from '../history/history.service';
import { LayerManagementService } from './layer-management.service';
import { ElementType, WhiteboardEvent } from '../types';
import { createElement } from './element.utils';
import { ArrowElement } from './arrow-element';
import { RectangleElement } from './rectangle-element';

describe('ArrowBindingService', () => {
  let service: ArrowBindingService;
  let elementsService: ElementsService;
  let eventBus: EventBusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ArrowBindingService,
        ConnectionPointsService,
        ElementsService,
        EventBusService,
        HistoryService,
        LayerManagementService,
      ],
    });
    service = TestBed.inject(ArrowBindingService);
    elementsService = TestBed.inject(ElementsService);
    eventBus = TestBed.inject(EventBusService);
  });

  describe('createBinding', () => {
    it('should create a binding object', () => {
      const binding = service.createBinding('elem1', 'top', 5);
      expect(binding.elementId).toBe('elem1');
      expect(binding.pointId).toBe('top');
      expect(binding.gap).toBe(5);
      expect(binding.focus).toBe(0.5);
    });

    it('should default gap to 0', () => {
      const binding = service.createBinding('elem1', null);
      expect(binding.gap).toBe(0);
    });
  });

  describe('getArrowsBoundTo', () => {
    it('should return arrows bound to a specific element via startBinding', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 200,
        y1: 100,
        x2: 400,
        y2: 300,
        startBinding: { elementId: rect.id, pointId: 'top', focus: 0.5, gap: 0 },
        endBinding: null,
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);
      const result = service.getArrowsBoundTo(rect.id);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(arrow.id);
    });

    it('should return arrows bound via endBinding', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 200,
        y2: 150,
        startBinding: null,
        endBinding: { elementId: rect.id, pointId: 'right', focus: 0.5, gap: 0 },
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);
      const result = service.getArrowsBoundTo(rect.id);
      expect(result.length).toBe(1);
    });

    it('should return empty array when no arrows are bound', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;

      elementsService.addElements([rect]);
      expect(service.getArrowsBoundTo(rect.id)).toEqual([]);
    });
  });

  describe('arrows computed signal', () => {
    it('should return all arrow elements', () => {
      const arrow1 = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
      }) as ArrowElement;
      const arrow2 = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 50,
        y1: 50,
        x2: 200,
        y2: 200,
      }) as ArrowElement;
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;

      elementsService.addElements([arrow1, rect, arrow2]);
      const arrows = service.arrows();
      expect(arrows.length).toBe(2);
      expect(arrows.every((a) => a.type === ElementType.Arrow)).toBe(true);
    });

    it('should return empty array when no arrows exist', () => {
      expect(service.arrows()).toEqual([]);
    });
  });

  describe('resolveEndpoint', () => {
    it('should return freePoint when binding is null', () => {
      const freePoint = { x: 42, y: 99 };
      const result = service.resolveEndpoint(null, freePoint, { x: 0, y: 0 });
      expect(result).toEqual(freePoint);
    });

    it('should return freePoint when bound target element is deleted', () => {
      const binding = service.createBinding('nonexistent', 'top', 0);
      const freePoint = { x: 10, y: 20 };
      const result = service.resolveEndpoint(binding, freePoint, { x: 0, y: 0 });
      expect(result).toEqual(freePoint);
    });

    it('should resolve to target connection point when binding is valid', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 200,
        height: 100,
      }) as RectangleElement;

      elementsService.addElements([rect]);

      const binding = service.createBinding(rect.id, 'top', 0);
      const result = service.resolveEndpoint(binding, { x: 0, y: 0 }, { x: 100, y: 200 });
      expect(result).toBeDefined();
      expect(typeof result.x).toBe('number');
    });

    it('should resolve to closest edge when pointId is null', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 200,
        height: 100,
      }) as RectangleElement;

      elementsService.addElements([rect]);

      const binding = service.createBinding(rect.id, null, 5);
      const result = service.resolveEndpoint(binding, { x: 0, y: 0 }, { x: 300, y: 50 });
      expect(result).toBeDefined();
    });
  });

  describe('attachStart', () => {
    it('should attach arrow start to a shape', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 200,
        height: 100,
      }) as RectangleElement;
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 50,
        y1: 50,
        x2: 300,
        y2: 200,
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);

      const update = service.attachStart(arrow, rect.id, 'top', 0);
      expect(update.id).toBe(arrow.id);
      expect(update.startBinding).toBeDefined();
      expect(update.startBinding!.elementId).toBe(rect.id);
      expect(update.x1).toBeDefined();
      expect(update.y1).toBeDefined();
    });

    it('should use default gap of 0', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 200,
        height: 100,
      }) as RectangleElement;
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);

      const update = service.attachStart(arrow, rect.id, 'top');
      expect(update.startBinding!.gap).toBe(0);
    });
  });

  describe('attachEnd', () => {
    it('should attach arrow end to a shape', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 200,
        y: 200,
        width: 100,
        height: 100,
      }) as RectangleElement;
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 250,
        y2: 250,
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);

      const update = service.attachEnd(arrow, rect.id, 'left', 3);
      expect(update.id).toBe(arrow.id);
      expect(update.endBinding).toBeDefined();
      expect(update.endBinding!.elementId).toBe(rect.id);
      expect(update.endBinding!.gap).toBe(3);
      expect(update.x2).toBeDefined();
      expect(update.y2).toBeDefined();
    });

    it('should use default gap of 0', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);

      const update = service.attachEnd(arrow, rect.id, 'right');
      expect(update.endBinding!.gap).toBe(0);
    });
  });

  describe('detachStart', () => {
    it('should return update with null startBinding', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        startBinding: { elementId: 'elem1', pointId: 'top', focus: 0.5, gap: 0 },
      }) as ArrowElement;

      const update = service.detachStart(arrow);
      expect(update.id).toBe(arrow.id);
      expect(update.startBinding).toBeNull();
    });
  });

  describe('detachEnd', () => {
    it('should return update with null endBinding', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        endBinding: { elementId: 'elem1', pointId: 'bottom', focus: 0.5, gap: 0 },
      }) as ArrowElement;

      const update = service.detachEnd(arrow);
      expect(update.id).toBe(arrow.id);
      expect(update.endBinding).toBeNull();
    });
  });

  describe('recomputeBindingsForElements', () => {
    it('should recompute start binding when its target moved', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 200,
        height: 100,
      }) as RectangleElement;
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 100,
        y1: 0,
        x2: 300,
        y2: 200,
        startBinding: { elementId: rect.id, pointId: 'top', focus: 0.5, gap: 0 },
        endBinding: null,
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);

      const updates = service.recomputeBindingsForElements(new Set([rect.id]));
      expect(updates.length).toBe(1);
      expect(updates[0].id).toBe(arrow.id);
      expect(updates[0].x1).toBeDefined();
      expect(updates[0].y1).toBeDefined();
    });

    it('should recompute end binding when its target moved', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 200,
        y: 200,
        width: 100,
        height: 100,
      }) as RectangleElement;
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 250,
        y2: 250,
        startBinding: null,
        endBinding: { elementId: rect.id, pointId: 'left', focus: 0.5, gap: 0 },
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);

      const updates = service.recomputeBindingsForElements(new Set([rect.id]));
      expect(updates.length).toBe(1);
      expect(updates[0].x2).toBeDefined();
      expect(updates[0].y2).toBeDefined();
    });

    it('should recompute both start and end bindings', () => {
      const rect1 = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;
      const rect2 = createElement(ElementType.Rectangle, {
        x: 300,
        y: 300,
        width: 100,
        height: 100,
      }) as RectangleElement;
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 50,
        y1: 50,
        x2: 350,
        y2: 350,
        startBinding: { elementId: rect1.id, pointId: 'bottom', focus: 0.5, gap: 0 },
        endBinding: { elementId: rect2.id, pointId: 'top', focus: 0.5, gap: 0 },
      }) as ArrowElement;

      elementsService.addElements([rect1, rect2, arrow]);

      const updates = service.recomputeBindingsForElements(new Set([rect1.id, rect2.id]));
      expect(updates.length).toBe(1);
      expect(updates[0].x1).toBeDefined();
      expect(updates[0].y1).toBeDefined();
      expect(updates[0].x2).toBeDefined();
      expect(updates[0].y2).toBeDefined();
    });

    it('should return empty array when no arrows are affected', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        startBinding: null,
        endBinding: null,
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);

      const updates = service.recomputeBindingsForElements(new Set([rect.id]));
      expect(updates).toEqual([]);
    });

    it('should use updated x1 for end binding otherEnd computation', () => {
      const rect1 = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;
      const rect2 = createElement(ElementType.Rectangle, {
        x: 200,
        y: 200,
        width: 100,
        height: 100,
      }) as RectangleElement;
      const arrow = createElement(ElementType.Arrow, {
        x: 10,
        y: 10,
        x1: 40,
        y1: 40,
        x2: 240,
        y2: 240,
        startBinding: { elementId: rect1.id, pointId: 'bottom', focus: 0.5, gap: 0 },
        endBinding: { elementId: rect2.id, pointId: 'top', focus: 0.5, gap: 0 },
      }) as ArrowElement;

      elementsService.addElements([rect1, rect2, arrow]);

      const updates = service.recomputeBindingsForElements(new Set([rect1.id, rect2.id]));
      expect(updates.length).toBe(1);
      // Both endpoints should be updated
      expect(updates[0].x1).toBeDefined();
      expect(updates[0].x2).toBeDefined();
    });
  });

  describe('detachAllFromElement', () => {
    it('should return updates to detach start bindings', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 200,
        y1: 100,
        x2: 400,
        y2: 300,
        startBinding: { elementId: rect.id, pointId: 'top', focus: 0.5, gap: 0 },
        endBinding: null,
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);

      const updates = service.detachAllFromElement(rect.id);
      expect(updates.length).toBe(1);
      expect(updates[0].id).toBe(arrow.id);
      expect(updates[0].startBinding).toBeNull();
    });

    it('should detach end bindings too', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;

      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 50,
        y2: 50,
        startBinding: null,
        endBinding: { elementId: rect.id, pointId: 'right', focus: 0.5, gap: 0 },
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);

      const updates = service.detachAllFromElement(rect.id);
      expect(updates.length).toBe(1);
      expect(updates[0].endBinding).toBeNull();
    });

    it('should detach both start and end when both bound', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;

      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 50,
        y1: 0,
        x2: 50,
        y2: 100,
        startBinding: { elementId: rect.id, pointId: 'top', focus: 0.5, gap: 0 },
        endBinding: { elementId: rect.id, pointId: 'bottom', focus: 0.5, gap: 0 },
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);

      const updates = service.detachAllFromElement(rect.id);
      expect(updates.length).toBe(1);
      expect(updates[0].startBinding).toBeNull();
      expect(updates[0].endBinding).toBeNull();
    });
  });

  describe('hasBindings', () => {
    it('should return true when arrow has a start binding', () => {
      const arrow = createElement(ElementType.Arrow, {
        startBinding: { elementId: 'elem1', pointId: 'top', focus: 0.5, gap: 0 },
        endBinding: null,
      }) as ArrowElement;
      expect(service.hasBindings(arrow)).toBe(true);
    });

    it('should return true when arrow has an end binding', () => {
      const arrow = createElement(ElementType.Arrow, {
        startBinding: null,
        endBinding: { elementId: 'elem1', pointId: 'bottom', focus: 0.5, gap: 0 },
      }) as ArrowElement;
      expect(service.hasBindings(arrow)).toBe(true);
    });

    it('should return false when arrow has no bindings', () => {
      const arrow = createElement(ElementType.Arrow, {
        startBinding: null,
        endBinding: null,
      }) as ArrowElement;
      expect(service.hasBindings(arrow)).toBe(false);
    });
  });

  describe('describeBindings', () => {
    it('should describe start binding only', () => {
      const arrow = createElement(ElementType.Arrow, {
        startBinding: { elementId: 'shapeA', pointId: 'top', focus: 0.5, gap: 0 },
        endBinding: null,
      }) as ArrowElement;

      expect(service.describeBindings(arrow)).toBe('start→shapeA(top)');
    });

    it('should use "edge" when start pointId is null', () => {
      const arrow = createElement(ElementType.Arrow, {
        startBinding: { elementId: 'shapeA', pointId: null, focus: 0.5, gap: 0 },
        endBinding: null,
      }) as ArrowElement;

      expect(service.describeBindings(arrow)).toBe('start→shapeA(edge)');
    });

    it('should describe end binding only', () => {
      const arrow = createElement(ElementType.Arrow, {
        startBinding: null,
        endBinding: { elementId: 'shapeB', pointId: null, focus: 0.5, gap: 0 },
      }) as ArrowElement;

      expect(service.describeBindings(arrow)).toBe('end→shapeB(edge)');
    });

    it('should describe both bindings', () => {
      const arrow = createElement(ElementType.Arrow, {
        startBinding: { elementId: 'shapeA', pointId: 'top', focus: 0.5, gap: 0 },
        endBinding: { elementId: 'shapeB', pointId: 'bottom', focus: 0.5, gap: 0 },
      }) as ArrowElement;

      expect(service.describeBindings(arrow)).toBe('start→shapeA(top), end→shapeB(bottom)');
    });

    it('should return "unbound" when no bindings', () => {
      const arrow = createElement(ElementType.Arrow, {
        startBinding: null,
        endBinding: null,
      }) as ArrowElement;

      expect(service.describeBindings(arrow)).toBe('unbound');
    });
  });

  describe('constructor auto-detach on ElementsRemoved', () => {
    it('should auto-detach bindings when a shape is removed', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 50,
        y1: 0,
        x2: 200,
        y2: 200,
        startBinding: { elementId: rect.id, pointId: 'top', focus: 0.5, gap: 0 },
        endBinding: null,
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);
      const updateSpy = jest.spyOn(elementsService, 'updateElements');

      eventBus.emit(WhiteboardEvent.ElementsRemoved, [rect]);

      expect(updateSpy).toHaveBeenCalledTimes(1);
      const updates = updateSpy.mock.calls[0][0];
      expect(updates.length).toBe(1);
      expect((updates[0] as any).startBinding).toBeNull();
    });

    it('should not call updateElements when removed elements have no bound arrows', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;

      elementsService.addElements([rect]);
      const updateSpy = jest.spyOn(elementsService, 'updateElements');

      eventBus.emit(WhiteboardEvent.ElementsRemoved, [rect]);

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should skip when removedElements is null or empty', () => {
      const updateSpy = jest.spyOn(elementsService, 'updateElements');

      eventBus.emit(WhiteboardEvent.ElementsRemoved, null as unknown as undefined);
      expect(updateSpy).not.toHaveBeenCalled();

      eventBus.emit(WhiteboardEvent.ElementsRemoved, []);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should skip when removedElements is not an array', () => {
      const updateSpy = jest.spyOn(elementsService, 'updateElements');
      eventBus.emit(WhiteboardEvent.ElementsRemoved, 'not-array' as unknown as undefined);
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from event bus', () => {
      const updateSpy = jest.spyOn(elementsService, 'updateElements');

      service.ngOnDestroy();

      // After destroy, emitting should not trigger updates
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        startBinding: { elementId: rect.id, pointId: 'top', focus: 0.5, gap: 0 },
        endBinding: null,
      }) as ArrowElement;

      elementsService.addElements([rect, arrow]);
      eventBus.emit(WhiteboardEvent.ElementsRemoved, [rect]);

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});
