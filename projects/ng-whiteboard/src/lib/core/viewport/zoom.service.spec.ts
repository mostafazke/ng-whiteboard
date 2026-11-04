import { TestBed } from '@angular/core/testing';
import { ZoomService } from './zoom.service';
import { ConfigService } from '../config/config.service';
import { CanvasService } from '../canvas/canvas.service';
import { ElementsService } from '../elements/elements.service';
import { SelectionService } from '../elements/selection.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { WhiteboardConfig, WhiteboardElement, WhiteboardEvent } from '../types';
import { Subject } from 'rxjs';
import { getCanvasCoordinates } from '../utils/geometry';

describe('ZoomService', () => {
  let service: ZoomService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockCanvasService: jest.Mocked<CanvasService>;
  let mockElementsService: jest.Mocked<ElementsService>;
  let mockSelectionService: jest.Mocked<SelectionService>;
  let mockEventBusService: jest.Mocked<EventBusService>;
  let zoomChangeSubject: Subject<unknown>;

  const mockConfig: WhiteboardConfig = {
    zoom: 1,
    center: false,
    fullScreen: false,
    canvasWidth: 800,
    canvasHeight: 600,
    canvasX: 0,
    canvasY: 0,
  } as WhiteboardConfig;

  beforeEach(() => {
    zoomChangeSubject = new Subject();

    mockConfigService = {
      getConfig: jest.fn().mockReturnValue(mockConfig),
      updateConfig: jest.fn(),
      updateConfigValue: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    mockCanvasService = {
      getCanvasDimensions: jest.fn().mockReturnValue({ width: 800, height: 600 }),
      getContainerDimensions: jest.fn().mockReturnValue({ width: 1000, height: 800 }),
    } as unknown as jest.Mocked<CanvasService>;

    mockElementsService = {
      getElements: jest.fn().mockReturnValue([]),
      calculateElementsBounds: jest.fn(),
    } as unknown as jest.Mocked<ElementsService>;

    mockSelectionService = {
      getSelectedElements: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<SelectionService>;

    mockEventBusService = {
      emit: jest.fn(),
      on: jest.fn().mockReturnValue(zoomChangeSubject.asObservable()),
    } as unknown as jest.Mocked<EventBusService>;

    TestBed.configureTestingModule({
      providers: [
        ZoomService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CanvasService, useValue: mockCanvasService },
        { provide: ElementsService, useValue: mockElementsService },
        { provide: SelectionService, useValue: mockSelectionService },
        { provide: EventBusService, useValue: mockEventBusService },
      ],
    });

    service = TestBed.inject(ZoomService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should subscribe to zoom change events on construction', () => {
    expect(mockEventBusService.on).toHaveBeenCalledWith(WhiteboardEvent.ZoomChange);
  });

  it('should center canvas on zoom change when center is true', () => {
    mockConfigService.getConfig.mockReturnValue({
      ...mockConfig,
      center: true,
      fullScreen: false,
      zoom: 1.5,
    } as WhiteboardConfig);

    zoomChangeSubject.next({});

    expect(mockConfigService.updateConfig).toHaveBeenCalledWith(
      { canvasX: expect.any(Number), canvasY: expect.any(Number) },
      false
    );
  });

  it('should not center canvas when fullScreen is true', () => {
    mockConfigService.getConfig.mockReturnValue({
      ...mockConfig,
      center: true,
      fullScreen: true,
      zoom: 1.5,
    } as WhiteboardConfig);

    zoomChangeSubject.next({});

    expect(mockConfigService.updateConfig).not.toHaveBeenCalled();
  });

  it('should unsubscribe on destroy', () => {
    const unsubscribeSpy = jest.spyOn(service['zoomSubscription'], 'unsubscribe');

    service.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  describe('zoom', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set zoom without animation', () => {
      service.zoom(1.5, false);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ zoom: 1.5 });
      expect(mockEventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ZoomChange, { zoom: expect.any(Number) });
    });

    it('should animate zoom when animated is true', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);

      service.zoom(2, true, 100);

      jest.advanceTimersByTime(50);
      expect(mockConfigService.updateConfig).toHaveBeenCalled();

      jest.advanceTimersByTime(100);
    });

    it('should clamp zoom to max value', () => {
      service.zoom(100, false);

      // MAX_ZOOM is 5.0
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ zoom: 5 });
    });

    it('should clamp zoom to min value', () => {
      service.zoom(0.01, false);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ zoom: 0.1 });
    });

    it('should round zoom to 2 decimal places', () => {
      service.zoom(1.23456, false);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ zoom: 1.23 });
    });

    it('should not zoom if zoom is zero or negative', () => {
      service.zoom(0, false);

      expect(mockConfigService.updateConfig).not.toHaveBeenCalled();
    });

    it('should center canvas when center is true', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...mockConfig,
        center: true,
        fullScreen: false,
      } as WhiteboardConfig);

      service.zoom(1.5, false);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith(
        { canvasX: expect.any(Number), canvasY: expect.any(Number) },
        false
      );
    });
  });

  describe('zoomIn', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should increase zoom by step amount', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);

      service.zoomIn(false);

      // ZOOM_STEP is 0.25, so 1 + 0.25 = 1.25
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ zoom: 1.25 });
    });

    it('should not exceed max zoom', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 5 } as WhiteboardConfig);

      service.zoomIn(false);

      expect(mockConfigService.updateConfig).not.toHaveBeenCalled();
    });

    it('should animate by default', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);

      service.zoomIn(true, 100);

      jest.advanceTimersByTime(100);
      expect(mockConfigService.updateConfig).toHaveBeenCalled();
    });

    it('should round result to 2 decimal places', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1.05 } as WhiteboardConfig);

      service.zoomIn(false);

      // ZOOM_STEP is 0.25, so 1.05 + 0.25 = 1.30
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ zoom: 1.3 });
    });
  });

  describe('zoomOut', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should decrease zoom by step amount', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1.5 } as WhiteboardConfig);

      service.zoomOut(false);

      // ZOOM_STEP is 0.25, so 1.5 - 0.25 = 1.25
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ zoom: 1.25 });
    });

    it('should not go below min zoom', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 0.1 } as WhiteboardConfig);

      service.zoomOut(false);

      expect(mockConfigService.updateConfig).not.toHaveBeenCalled();
    });

    it('should animate by default', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1.5 } as WhiteboardConfig);

      service.zoomOut(true, 100);

      jest.advanceTimersByTime(100);
      expect(mockConfigService.updateConfig).toHaveBeenCalled();
    });

    it('should round result to 2 decimal places', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1.55 } as WhiteboardConfig);

      service.zoomOut(false);

      // ZOOM_STEP is 0.25, so 1.55 - 0.25 = 1.30
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ zoom: 1.3 });
    });
  });

  describe('resetZoom', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should reset zoom to 1 without animation', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 2 } as WhiteboardConfig);

      service.resetZoom(false);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ zoom: 1 });
    });

    it('should animate reset by default', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 2 } as WhiteboardConfig);

      service.resetZoom(true, 100);

      jest.advanceTimersByTime(100);
      expect(mockConfigService.updateConfig).toHaveBeenCalled();
    });
  });

  describe('getZoomLevel', () => {
    it('should return current zoom level', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1.5 } as WhiteboardConfig);

      expect(service.getZoomLevel()).toBe(1.5);
    });
  });

  describe('getZoomPercentage', () => {
    it('should return zoom as percentage', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1.5 } as WhiteboardConfig);

      expect(service.getZoomPercentage()).toBe(150);
    });

    it('should round percentage', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1.234 } as WhiteboardConfig);

      expect(service.getZoomPercentage()).toBe(123);
    });
  });

  describe('zoomToFit', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should reset zoom when no elements exist', () => {
      mockElementsService.getElements.mockReturnValue([]);

      service.zoomToFit(0.9, false);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ zoom: 1 });
    });

    it('should zoom to fit all elements', () => {
      const mockElements = [{ id: '1' }] as WhiteboardElement[];
      mockElementsService.getElements.mockReturnValue(mockElements);
      mockElementsService.calculateElementsBounds.mockReturnValue({
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        centerX: 200,
        centerY: 150,
      });

      service.zoomToFit(0.9, false);

      expect(mockElementsService.calculateElementsBounds).toHaveBeenCalledWith(mockElements);
      expect(mockConfigService.updateConfig).toHaveBeenCalled();
    });

    it('should use default margin', () => {
      const mockElements = [{ id: '1' }] as WhiteboardElement[];
      mockElementsService.getElements.mockReturnValue(mockElements);
      mockElementsService.calculateElementsBounds.mockReturnValue({
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        centerX: 200,
        centerY: 150,
      });

      service.zoomToFit();

      jest.advanceTimersByTime(300);
      expect(mockElementsService.calculateElementsBounds).toHaveBeenCalled();
    });
  });

  describe('zoomToSelection', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should not zoom if no elements selected', () => {
      mockSelectionService.getSelectedElements.mockReturnValue([]);

      service.zoomToSelection(0.9, false);

      expect(mockConfigService.updateConfig).not.toHaveBeenCalled();
    });

    it('should zoom to fit selected elements', () => {
      const mockElements = [{ id: '1' }] as WhiteboardElement[];
      mockSelectionService.getSelectedElements.mockReturnValue(mockElements);
      mockElementsService.calculateElementsBounds.mockReturnValue({
        x: 0,
        y: 0,
        width: 200,
        height: 150,
        centerX: 100,
        centerY: 75,
      });

      service.zoomToSelection(0.9, false);

      expect(mockElementsService.calculateElementsBounds).toHaveBeenCalledWith(mockElements);
      expect(mockConfigService.updateConfig).toHaveBeenCalled();
    });
  });

  describe('zoomToElements', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should not zoom if elements array is empty', () => {
      service.zoomToElements([], 0.9, false);

      expect(mockConfigService.updateConfig).not.toHaveBeenCalled();
    });

    it('should not zoom if bounds are null', () => {
      const mockElements = [{ id: '1' }] as WhiteboardElement[];
      mockElementsService.calculateElementsBounds.mockReturnValue(null);

      service.zoomToElements(mockElements, 0.9, false);

      expect(mockConfigService.updateConfig).not.toHaveBeenCalled();
    });

    it('should calculate zoom based on bounds width', () => {
      const mockElements = [{ id: '1' }] as WhiteboardElement[];
      mockElementsService.calculateElementsBounds.mockReturnValue({
        x: 0,
        y: 0,
        width: 400,
        height: 100,
        centerX: 200,
        centerY: 50,
      });

      service.zoomToElements(mockElements, 0.9, false);

      expect(mockConfigService.updateConfig).toHaveBeenCalled();
    });

    it('should calculate zoom based on bounds height', () => {
      const mockElements = [{ id: '1' }] as WhiteboardElement[];
      mockElementsService.calculateElementsBounds.mockReturnValue({
        x: 0,
        y: 0,
        width: 100,
        height: 400,
        centerX: 50,
        centerY: 200,
      });

      service.zoomToElements(mockElements, 0.9, false);

      expect(mockConfigService.updateConfig).toHaveBeenCalled();
    });

    it('should use container dimensions when fullScreen is true', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, fullScreen: true } as WhiteboardConfig);
      const mockElements = [{ id: '1' }] as WhiteboardElement[];
      mockElementsService.calculateElementsBounds.mockReturnValue({
        x: 0,
        y: 0,
        width: 500,
        height: 400,
        centerX: 250,
        centerY: 200,
      });

      service.zoomToElements(mockElements, 0.9, false);

      expect(mockCanvasService.getContainerDimensions).toHaveBeenCalled();
    });

    it('should pan so the elements are centred (fullScreen content-level pan)', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, fullScreen: true } as WhiteboardConfig);
      mockElementsService.calculateElementsBounds.mockReturnValue({
        x: 100,
        y: 75,
        width: 200,
        height: 150,
        centerX: 200,
        centerY: 150,
      });

      // container 1000x800, margin 1 → zoom = min(1000/200, 800/150) clamped to MAX 5
      // fullScreen pan: x = 800/(2·5) − 200 = −120; y = 600/(2·5) − 150 = −90
      service.zoomToElements([{ id: '1' }] as WhiteboardElement[], 1, false);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: -120, y: -90 });
    });

    it('should pan so the elements are centred (non-fullScreen, combining canvas offset)', () => {
      // default mock: non-fullScreen, container 1000x800, canvas 800x600, canvasX/Y 0
      mockElementsService.calculateElementsBounds.mockReturnValue({
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        centerX: 200,
        centerY: 150,
      });

      // zoom = min(800/400, 600/300) = 2 → x = (1000/2 − 0)/2 − 200 = 50; y = (800/2 − 0)/2 − 150 = 50
      service.zoomToElements([{ id: '1' }] as WhiteboardElement[], 1, false);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 50, y: 50 });
    });
  });

  describe('zoomToArea', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should zoom to fit specified area', () => {
      service.zoomToArea(0, 0, 400, 300, 0.9, false);

      expect(mockConfigService.updateConfig).toHaveBeenCalled();
    });

    it('should animate by default', () => {
      service.zoomToArea(0, 0, 400, 300, 0.9, true, 100);

      jest.advanceTimersByTime(100);
      expect(mockConfigService.updateConfig).toHaveBeenCalled();
    });

    it('should handle very small areas', () => {
      service.zoomToArea(0, 0, 10, 10, 0.9, false);

      expect(mockConfigService.updateConfig).toHaveBeenCalled();
    });

    it('should ignore a degenerate (zero-size) area', () => {
      service.zoomToArea(0, 0, 0, 0, 0.9, false);

      expect(mockConfigService.updateConfig).not.toHaveBeenCalled();
    });

    it('should pan so the area is centred (fullScreen)', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, fullScreen: true } as WhiteboardConfig);

      // area (100,100,200,200) → centre (200,200); container 1000x800, margin 1
      // zoom = min(1000/200, 800/200) = 4 → x = 800/(2·4) − 200 = −100; y = 600/(2·4) − 200 = −125
      service.zoomToArea(100, 100, 200, 200, 1, false);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: -100, y: -125 });
    });
  });

  describe('zoomToRegion', () => {
    it('should zoom into the region and pan to centre it (fullScreen)', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, fullScreen: true } as WhiteboardConfig);

      // same maths as zoomToArea, run instantly
      service.zoomToRegion(100, 100, 200, 200, 1);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: -100, y: -125 });
    });

    it('should ignore a degenerate (zero-size) region', () => {
      service.zoomToRegion(0, 0, 0, 0);

      expect(mockConfigService.updateConfig).not.toHaveBeenCalled();
    });
  });

  describe('getOptimalZoom', () => {
    it('should calculate optimal zoom for content', () => {
      const zoom = service.getOptimalZoom(400, 300, 0.9);

      expect(zoom).toBeGreaterThan(0);
      expect(zoom).toBeLessThanOrEqual(10);
    });

    it('should clamp result to valid zoom range', () => {
      const zoom = service.getOptimalZoom(10, 10, 0.9);

      expect(zoom).toBeLessThanOrEqual(10);
    });

    it('should handle very large content', () => {
      const zoom = service.getOptimalZoom(10000, 10000, 0.9);

      expect(zoom).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('clampZoom', () => {
    it('should clamp zoom below minimum', () => {
      expect(service.clampZoom(0.05)).toBe(0.1);
    });

    it('should clamp zoom above maximum', () => {
      // MAX_ZOOM is 5.0
      expect(service.clampZoom(20)).toBe(5);
    });

    it('should not clamp valid zoom', () => {
      expect(service.clampZoom(1.5)).toBe(1.5);
    });

    it('should handle edge values', () => {
      expect(service.clampZoom(0.1)).toBe(0.1);
      // MAX_ZOOM is 5.0
      expect(service.clampZoom(5)).toBe(5);
    });
  });

  describe('isValidZoom', () => {
    it('should return true for valid zoom', () => {
      expect(service.isValidZoom(1)).toBe(true);
      expect(service.isValidZoom(0.5)).toBe(true);
      expect(service.isValidZoom(5)).toBe(true);
    });

    it('should return false for invalid zoom', () => {
      expect(service.isValidZoom(0.05)).toBe(false);
      expect(service.isValidZoom(20)).toBe(false);
    });

    it('should return true for edge values', () => {
      expect(service.isValidZoom(0.1)).toBe(true);
      // MAX_ZOOM is 5.0
      expect(service.isValidZoom(5)).toBe(true);
    });
  });

  describe('getZoomLimits', () => {
    it('should return min and max zoom', () => {
      const limits = service.getZoomLimits();

      // MAX_ZOOM is 5.0
      expect(limits).toEqual({ min: 0.1, max: 5 });
    });
  });

  describe('animation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should emit zoom change event after animation completes', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);

      service.zoom(2, true, 100);

      // Wait for animation to complete
      jest.advanceTimersByTime(150);

      expect(mockEventBusService.emit).toHaveBeenCalledWith(
        WhiteboardEvent.ZoomChange,
        expect.objectContaining({ zoom: expect.any(Number) })
      );
    });

    it('should update config multiple times during animation', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);

      service.zoom(2, true, 100);

      jest.advanceTimersByTime(25);
      const firstCallCount = mockConfigService.updateConfig.mock.calls.length;

      jest.advanceTimersByTime(25);
      const secondCallCount = mockConfigService.updateConfig.mock.calls.length;

      expect(secondCallCount).toBeGreaterThan(firstCallCount);
    });
  });

  describe('edge cases', () => {
    it('should handle zero duration animation', () => {
      jest.useFakeTimers();
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);

      // Mock requestAnimationFrame to execute synchronously
      const callbacks: FrameRequestCallback[] = [];
      global.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
        callbacks.push(callback);
        return 0;
      }) as jest.MockedFunction<typeof requestAnimationFrame>;

      service.zoom(2, true, 0);

      // Execute all animation frame callbacks
      const timestamp = performance.now();
      callbacks.forEach((cb) => cb(timestamp));

      expect(mockConfigService.updateConfig).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should handle negative zoom values', () => {
      service.zoom(-1, false);

      expect(mockConfigService.updateConfig).not.toHaveBeenCalled();
    });

    it('should handle very large margin values', () => {
      const mockElements = [{ id: '1' }] as WhiteboardElement[];
      mockElementsService.getElements.mockReturnValue(mockElements);
      mockElementsService.calculateElementsBounds.mockReturnValue({
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        centerX: 200,
        centerY: 150,
      });

      service.zoomToFit(2, false);

      expect(mockConfigService.updateConfig).toHaveBeenCalled();
    });
  });
  describe('zoomAtPoint', () => {
    function canvasPointAt(config: Partial<WhiteboardConfig>, sx: number, sy: number) {
      return getCanvasCoordinates({ ...mockConfig, ...config } as WhiteboardConfig, { x: sx, y: sy });
    }

    function lastUpdate(): Partial<WhiteboardConfig> {
      const calls = mockConfigService.updateConfig.mock.calls;
      return calls[calls.length - 1][0];
    }

    it('zoomAtPoint keeps point fixed', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1, x: 0, y: 0 } as WhiteboardConfig);
      const before = canvasPointAt({ zoom: 1, x: 0, y: 0 }, 100, 100);

      service.zoomAtPoint(2, 100, 100);

      expect(mockConfigService.updateConfig).toHaveBeenCalledTimes(1);
      const update = lastUpdate();
      expect(update).toEqual({ zoom: 2, x: -50, y: -50 });
      expect(canvasPointAt(update, 100, 100)).toEqual(before);
    });

    it('keeps the point fixed in fullScreen with an existing pan', () => {
      const start = { zoom: 1.5, x: 20, y: -10, fullScreen: true };
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, ...start } as WhiteboardConfig);
      const before = canvasPointAt(start, 300, 200);

      service.zoomAtPoint(0.75, 300, 200);

      const after = canvasPointAt({ ...start, ...lastUpdate() }, 300, 200);
      expect(after.x).toBeCloseTo(before.x);
      expect(after.y).toBeCloseTo(before.y);
    });

    it('accounts for re-centering of the page when center is on', () => {
      const start = { zoom: 1, x: 0, y: 0, center: true, fullScreen: false, canvasX: 100, canvasY: 100 };
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, ...start } as WhiteboardConfig);
      const before = canvasPointAt(start, 400, 300);

      service.zoomAtPoint(1.2, 400, 300);

      const update = lastUpdate();
      // container 1000x800, canvas 800x600 → centred page offset at zoom 1.2
      expect(update.canvasX).toBeCloseTo((1000 - 800 * 1.2) / 2);
      expect(update.canvasY).toBeCloseTo((800 - 600 * 1.2) / 2);
      const after = canvasPointAt({ ...start, ...update }, 400, 300);
      expect(after.x).toBeCloseTo(before.x);
      expect(after.y).toBeCloseTo(before.y);

      // The ZoomChange re-centre that follows lands on the same offset, so it doesn't fight the pinch
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, ...start, ...update } as WhiteboardConfig);
      mockConfigService.updateConfig.mockClear();
      zoomChangeSubject.next({});
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith(
        { canvasX: update.canvasX, canvasY: update.canvasY },
        false
      );
    });

    it('zoomAtPoint clamps', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1, x: 0, y: 0 } as WhiteboardConfig);

      service.zoomAtPoint(1000, 50, 50);

      expect(lastUpdate().zoom).toBe(service.getZoomLimits().max);
    });

    it('does not round the zoom level', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1, x: 0, y: 0 } as WhiteboardConfig);

      service.zoomAtPoint(1.004, 50, 50);

      expect(lastUpdate().zoom).toBe(1.004);
    });

    it('is instant (no animation frame)', () => {
      const rafSpy = jest.spyOn(global, 'requestAnimationFrame');
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1, x: 0, y: 0 } as WhiteboardConfig);

      service.zoomAtPoint(2, 0, 0);

      expect(rafSpy).not.toHaveBeenCalled();
      rafSpy.mockRestore();
    });

    it('ignores non-positive zoom', () => {
      service.zoomAtPoint(0, 0, 0);
      expect(mockConfigService.updateConfig).not.toHaveBeenCalled();
    });
  });
});
