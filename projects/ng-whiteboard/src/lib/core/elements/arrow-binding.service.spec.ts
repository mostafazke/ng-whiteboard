import { TestBed } from '@angular/core/testing';
import { ArrowBindingService } from './arrow-binding.service';
import { ConnectionPointsService } from './connection-points.service';
import { ElementsService } from './elements.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { HistoryService } from '../history/history.service';
import { LayerManagementService } from './layer-management.service';
import { ElementType } from '../types';
import { createElement } from './element.utils';
import { ArrowElement } from './arrow-element';
import { RectangleElement } from './rectangle-element';

describe('ArrowBindingService', () => {
  let service: ArrowBindingService;
  let elementsService: ElementsService;

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
  });

  describe('createBinding', () => {
    it('should create a binding object', () => {
      const binding = service.createBinding('elem1', 'top', 5);
      expect(binding.elementId).toBe('elem1');
      expect(binding.pointId).toBe('top');
      expect(binding.gap).toBe(5);
      expect(binding.focus).toBe(0.5);
    });
  });

  describe('getArrowsBoundTo', () => {
    it('should return arrows bound to a specific element', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const arrow = createElement(ElementType.Arrow, {
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
  });

  describe('hasBindings', () => {
    it('should return true when arrow has a start binding', () => {
      const arrow = createElement(ElementType.Arrow, {
        startBinding: { elementId: 'elem1', pointId: 'top', focus: 0.5, gap: 0 },
        endBinding: null,
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

  describe('detachAllFromElement', () => {
    it('should return updates to detach bindings from a removed element', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const arrow = createElement(ElementType.Arrow, {
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
  });
});
