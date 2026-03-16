import { TestBed } from '@angular/core/testing';
import { ConnectionUIService } from './connection-ui.service';
import { ConnectionPoint, Point } from '../types';

describe('ConnectionUIService', () => {
  let service: ConnectionUIService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConnectionUIService],
    });
    service = TestBed.inject(ConnectionUIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('snapIndicator', () => {
    it('should initialize with null', () => {
      expect(service.snapIndicator()).toBeNull();
    });

    it('should set snap indicator point', () => {
      const point: Point = { x: 100, y: 200 };
      service.setSnapIndicator(point);
      expect(service.snapIndicator()).toEqual({ x: 100, y: 200 });
    });

    it('should clear snap indicator with null', () => {
      service.setSnapIndicator({ x: 50, y: 50 });
      service.setSnapIndicator(null);
      expect(service.snapIndicator()).toBeNull();
    });
  });

  describe('visibleConnectionPoints', () => {
    it('should initialize with empty array', () => {
      expect(service.visibleConnectionPoints()).toEqual([]);
    });

    it('should set visible connection points', () => {
      const points: ConnectionPoint[] = [
        { id: 'top', position: { x: 100, y: 0 }, normal: { x: 0, y: -1 } },
        { id: 'bottom', position: { x: 100, y: 200 }, normal: { x: 0, y: 1 } },
      ];
      service.setVisibleConnectionPoints(points);
      expect(service.visibleConnectionPoints()).toEqual(points);
      expect(service.visibleConnectionPoints().length).toBe(2);
    });

    it('should replace previous points', () => {
      service.setVisibleConnectionPoints([{ id: 'top', position: { x: 50, y: 0 }, normal: { x: 0, y: -1 } }]);
      service.setVisibleConnectionPoints([{ id: 'left', position: { x: 0, y: 50 }, normal: { x: -1, y: 0 } }]);
      expect(service.visibleConnectionPoints().length).toBe(1);
      expect(service.visibleConnectionPoints()[0].id).toBe('left');
    });
  });

  describe('clearAll', () => {
    it('should clear both snap indicator and visible connection points', () => {
      service.setSnapIndicator({ x: 100, y: 200 });
      service.setVisibleConnectionPoints([{ id: 'top', position: { x: 100, y: 0 }, normal: { x: 0, y: -1 } }]);

      service.clearAll();

      expect(service.snapIndicator()).toBeNull();
      expect(service.visibleConnectionPoints()).toEqual([]);
    });

    it('should be safe to call when already cleared', () => {
      service.clearAll();
      expect(service.snapIndicator()).toBeNull();
      expect(service.visibleConnectionPoints()).toEqual([]);
    });
  });
});
