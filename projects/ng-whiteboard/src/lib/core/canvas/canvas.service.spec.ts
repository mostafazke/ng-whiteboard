import { TestBed } from '@angular/core/testing';
import { CanvasService } from './canvas.service';
import { ConfigService } from '../config/config.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { WhiteboardConfig, LineCap, LineJoin } from '../types';
import { WhiteboardEvent } from '../types/events';
import { PenType } from '../types/pen-presets';

describe('CanvasService', () => {
  let service: CanvasService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockConfigService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEventBusService: any;
  let mockSvgElement: SVGSVGElement;

  const defaultConfig: WhiteboardConfig = {
    drawingEnabled: true,
    canvasWidth: 800,
    canvasHeight: 600,
    fullScreen: false,
    center: false,
    canvasX: 0,
    canvasY: 0,
    strokeColor: '#000000',
    strokeWidth: 2,
    backgroundColor: '#ffffff',
    lineJoin: LineJoin.Round,
    lineCap: LineCap.Round,
    fill: '#ffffff',
    zoom: 1,
    fontFamily: 'Arial',
    fontSize: 16,
    dasharray: '',
    dashoffset: 0,
    x: 0,
    y: 0,
    enableGrid: false,
    gridSize: 20,
    snapToGrid: false,
    keyboardShortcutsEnabled: true,
    penType: PenType.Pen,
  };

  beforeEach(() => {
    mockConfigService = {
      getConfig: jest.fn().mockReturnValue({ ...defaultConfig }),
      updateConfig: jest.fn(),
    };

    mockEventBusService = {
      emit: jest.fn(),
    };

    // Create a mock SVG element
    mockSvgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    Object.defineProperty(mockSvgElement, 'clientWidth', {
      writable: true,
      value: 1024,
    });
    Object.defineProperty(mockSvgElement, 'clientHeight', {
      writable: true,
      value: 768,
    });

    TestBed.configureTestingModule({
      providers: [
        CanvasService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventBusService, useValue: mockEventBusService },
      ],
    });

    service = TestBed.inject(CanvasService);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize canvas and emit ready event', () => {
      jest.useFakeTimers();
      service.initializeCanvas(mockSvgElement);

      expect(mockEventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.Ready);
      jest.useRealTimers();
    });

    it('should center canvas on initialization when center is true', () => {
      jest.useFakeTimers();
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        center: true,
        fullScreen: false,
      });

      service.initializeCanvas(mockSvgElement);
      jest.advanceTimersByTime(1);

      expect(mockConfigService.updateConfig).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should not center canvas when fullScreen is true', () => {
      jest.useFakeTimers();
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        fullScreen: true,
        center: true,
      });

      service.initializeCanvas(mockSvgElement);
      jest.advanceTimersByTime(1);

      // Should only emit ready event, not center
      expect(mockEventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.Ready);
      jest.useRealTimers();
    });

    it('should return canvas element after initialization', () => {
      service.initializeCanvas(mockSvgElement);
      const canvas = service.getCanvas();
      expect(canvas).toBe(mockSvgElement);
    });

    it('should throw error when getting canvas before initialization', () => {
      expect(() => service.getCanvas()).toThrow('SVG container not initialized');
    });

    it('should check if canvas is initialized', () => {
      expect(service.isCanvasInitialized()).toBe(false);
      service.initializeCanvas(mockSvgElement);
      expect(service.isCanvasInitialized()).toBe(true);
    });
  });

  describe('Configuration Access', () => {
    it('should get current config', () => {
      const config = service.getConfig();
      expect(mockConfigService.getConfig).toHaveBeenCalled();
      expect(config).toEqual(defaultConfig);
    });
  });

  describe('Canvas Dimensions and Positioning', () => {
    it('should set canvas dimensions', () => {
      service.setCanvasDimensions(1024, 768);
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        canvasWidth: 1024,
        canvasHeight: 768,
      });
    });

    it('should set canvas position', () => {
      service.setCanvasPosition(100, 200);
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        x: 100,
        y: 200,
      });
    });

    it('should get canvas dimensions', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        canvasWidth: 1024,
        canvasHeight: 768,
      });

      const dimensions = service.getCanvasDimensions();
      expect(dimensions).toEqual({ width: 1024, height: 768 });
    });

    it('should get canvas position', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        x: 100,
        y: 200,
      });

      const position = service.getCanvasPosition();
      expect(position).toEqual({ x: 100, y: 200 });
    });

    it('should get container dimensions when canvas is initialized', () => {
      service.initializeCanvas(mockSvgElement);
      const dimensions = service.getContainerDimensions();
      expect(dimensions).toEqual({ width: 1024, height: 768 });
    });

    it('should return zero dimensions when canvas is not initialized', () => {
      const dimensions = service.getContainerDimensions();
      expect(dimensions).toEqual({ width: 0, height: 0 });
    });
  });

  describe('Canvas Modes and Layout', () => {
    beforeEach(() => {
      service.initializeCanvas(mockSvgElement);
    });

    it('should enter fullscreen mode', () => {
      service.fullScreen();

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        canvasWidth: 1024,
        canvasHeight: 768,
      });
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        fullScreen: true,
      });
    });

    it('should exit fullscreen mode with default dimensions', () => {
      service.exitFullScreen();

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        canvasWidth: 800,
        canvasHeight: 600,
      });
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        fullScreen: false,
        zoom: 1,
      });
    });

    it('should exit fullscreen mode with custom dimensions', () => {
      service.exitFullScreen(1200, 900);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        canvasWidth: 1200,
        canvasHeight: 900,
      });
    });

    it('should center canvas in fullscreen mode', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        fullScreen: true,
      });

      service.centerCanvas();

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        x: 0,
        y: 0,
        canvasX: 0,
        canvasY: 0,
      });
    });

    it('should center canvas in normal mode without center flag', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        canvasWidth: 800,
        canvasHeight: 600,
        zoom: 1,
        center: false,
      });

      service.centerCanvas();

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        x: 0,
        y: 0,
        canvasX: expect.any(Number),
        canvasY: expect.any(Number),
      });
    });

    it('should center canvas in normal mode with center flag', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        canvasWidth: 800,
        canvasHeight: 600,
        zoom: 1,
        center: true,
      });

      service.centerCanvas();

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        x: 400,
        y: 300,
        canvasX: expect.any(Number),
        canvasY: expect.any(Number),
      });
    });

    it('should reset canvas to default state', () => {
      service.resetCanvas();

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        x: 0,
        y: 0,
        zoom: 1,
        canvasX: 0,
        canvasY: 0,
      });
    });
  });

  describe('Grid Operations', () => {
    it('should toggle grid on', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        enableGrid: false,
      });

      service.toggleGrid();

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        enableGrid: true,
      });
    });

    it('should toggle grid off', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        enableGrid: true,
      });

      service.toggleGrid();

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        enableGrid: false,
      });
    });

    it('should set grid visible', () => {
      service.setGridVisible(true);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        enableGrid: true,
      });
    });

    it('should set grid invisible', () => {
      service.setGridVisible(false);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        enableGrid: false,
      });
    });

    it('should set grid size', () => {
      service.setGridSize(30);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        gridSize: 30,
      });
    });

    it('should toggle snap to grid on', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        snapToGrid: false,
      });

      service.toggleSnapToGrid();

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        snapToGrid: true,
      });
    });

    it('should toggle snap to grid off', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        snapToGrid: true,
      });

      service.toggleSnapToGrid();

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        snapToGrid: false,
      });
    });
  });

  describe('Transform Calculations', () => {
    it('should get transform signal', () => {
      const transformSignal = service.getTransform();
      expect(transformSignal).toBeTruthy();
      expect(typeof transformSignal).toBe('function');
    });

    it('should get transform string with default values', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 1,
        x: 0,
        y: 0,
      });

      const transform = service.getTransformString();
      expect(transform).toBe('translate(0, 0) scale(1)');
    });

    it('should get transform string with custom values', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 1.5,
        x: 100,
        y: 200,
      });

      const transform = service.getTransformString();
      expect(transform).toBe('translate(100, 200) scale(1.5)');
    });

    it('should convert screen to canvas coordinates', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 1,
        x: 0,
        y: 0,
      });

      const result = service.screenToCanvas(100, 200);
      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('should convert screen to canvas coordinates with zoom', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 2,
        x: 0,
        y: 0,
      });

      const result = service.screenToCanvas(100, 200);
      expect(result).toEqual({ x: 50, y: 100 });
    });

    it('should convert screen to canvas coordinates with offset', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 1,
        x: 50,
        y: 50,
      });

      const result = service.screenToCanvas(150, 250);
      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('should convert canvas to screen coordinates', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 1,
        x: 0,
        y: 0,
      });

      const result = service.canvasToScreen(100, 200);
      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('should convert canvas to screen coordinates with zoom', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 2,
        x: 0,
        y: 0,
      });

      const result = service.canvasToScreen(100, 200);
      expect(result).toEqual({ x: 200, y: 400 });
    });

    it('should convert canvas to screen coordinates with offset', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 1,
        x: 50,
        y: 50,
      });

      const result = service.canvasToScreen(100, 200);
      expect(result).toEqual({ x: 150, y: 250 });
    });
  });

  describe('Viewport Utilities', () => {
    beforeEach(() => {
      service.initializeCanvas(mockSvgElement);
    });

    it('should get visible bounds with default values', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 1,
        x: 0,
        y: 0,
      });

      const bounds = service.getVisibleBounds();
      // Use toBeCloseTo to handle -0 vs 0 floating point precision
      expect(bounds.left).toBeCloseTo(0, 10);
      expect(bounds.top).toBeCloseTo(0, 10);
      expect(bounds.right).toBe(1024);
      expect(bounds.bottom).toBe(768);
    });

    it('should get visible bounds with zoom', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 2,
        x: 0,
        y: 0,
      });

      const bounds = service.getVisibleBounds();
      // Use toBeCloseTo to handle -0 vs 0 floating point precision
      expect(bounds.left).toBeCloseTo(0, 10);
      expect(bounds.top).toBeCloseTo(0, 10);
      expect(bounds.right).toBe(512);
      expect(bounds.bottom).toBe(384);
    });

    it('should get visible bounds with pan offset', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 1,
        x: -100,
        y: -100,
      });

      const bounds = service.getVisibleBounds();
      expect(bounds).toEqual({
        left: 100,
        top: 100,
        right: 1124,
        bottom: 868,
      });
    });

    it('should check if point is visible', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 1,
        x: 0,
        y: 0,
      });

      expect(service.isPointVisible(100, 100)).toBe(true);
      expect(service.isPointVisible(2000, 2000)).toBe(false);
      expect(service.isPointVisible(-100, -100)).toBe(false);
    });

    it('should check if rectangle is visible', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 1,
        x: 0,
        y: 0,
      });

      // Completely inside viewport
      expect(service.isRectVisible(100, 100, 200, 200)).toBe(true);

      // Partially visible
      expect(service.isRectVisible(900, 600, 200, 200)).toBe(true);

      // Completely outside viewport
      expect(service.isRectVisible(2000, 2000, 100, 100)).toBe(false);
      expect(service.isRectVisible(-200, -200, 100, 100)).toBe(false);
    });

    it('should detect rectangle intersecting viewport from left', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 1,
        x: 0,
        y: 0,
      });

      expect(service.isRectVisible(-50, 100, 100, 100)).toBe(true);
    });

    it('should detect rectangle intersecting viewport from top', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 1,
        x: 0,
        y: 0,
      });

      expect(service.isRectVisible(100, -50, 100, 100)).toBe(true);
    });
  });

  describe('Provider Functions', () => {
    beforeEach(() => {
      service.initializeCanvas(mockSvgElement);
    });

    it('should provide canvas dimensions function', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        canvasWidth: 1024,
        canvasHeight: 768,
      });

      const provider = service.getCanvasDimensionsProvider();
      const dimensions = provider();

      expect(dimensions).toEqual({ width: 1024, height: 768 });
    });

    it('should provide container dimensions function', () => {
      const provider = service.getContainerDimensionsProvider();
      const dimensions = provider();

      expect(dimensions).toEqual({ width: 1024, height: 768 });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle container dimensions when container has zero size', () => {
      const smallSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      Object.defineProperty(smallSvg, 'clientWidth', {
        writable: true,
        value: 0,
      });
      Object.defineProperty(smallSvg, 'clientHeight', {
        writable: true,
        value: 0,
      });

      service.initializeCanvas(smallSvg);
      const dimensions = service.getContainerDimensions();

      expect(dimensions).toEqual({ width: 0, height: 0 });
    });

    it('should handle extreme zoom values in coordinate conversion', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 0.1,
        x: 0,
        y: 0,
      });

      const result = service.screenToCanvas(10, 10);
      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('should handle negative coordinates in conversions', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        zoom: 1,
        x: 0,
        y: 0,
      });

      const result = service.screenToCanvas(-100, -200);
      expect(result).toEqual({ x: -100, y: -200 });
    });

    it('should handle centering with different zoom levels', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        canvasWidth: 800,
        canvasHeight: 600,
        zoom: 2,
        center: true,
      });

      service.initializeCanvas(mockSvgElement);
      service.centerCanvas();

      expect(mockConfigService.updateConfig).toHaveBeenCalled();
    });
  });

  describe('Multiple Operations Sequence', () => {
    beforeEach(() => {
      service.initializeCanvas(mockSvgElement);
    });

    it('should handle fullscreen -> exit fullscreen sequence', () => {
      service.fullScreen();
      mockConfigService.updateConfig.mockClear();

      service.exitFullScreen();

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        canvasWidth: 800,
        canvasHeight: 600,
      });
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
        fullScreen: false,
        zoom: 1,
      });
    });

    it('should handle dimension changes and centering', () => {
      service.setCanvasDimensions(1200, 900);
      mockConfigService.getConfig.mockReturnValue({
        ...defaultConfig,
        canvasWidth: 1200,
        canvasHeight: 900,
      });

      service.centerCanvas();

      expect(mockConfigService.updateConfig).toHaveBeenCalled();
    });

    it('should handle multiple grid operations', () => {
      service.setGridSize(30);
      service.setGridVisible(true);
      service.toggleSnapToGrid();

      expect(mockConfigService.updateConfig).toHaveBeenCalledTimes(3);
    });
  });

  describe('Extension Points (Protected Methods)', () => {
    // Create a test subclass to access protected methods
    class TestableCanvasService extends CanvasService {
      public testTransformCoordinates(x: number, y: number) {
        return this.transformCoordinates(x, y);
      }

      public testValidateZoom(zoom: number) {
        return this.validateZoom(zoom);
      }
    }

    let testableService: TestableCanvasService;

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          TestableCanvasService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: EventBusService, useValue: mockEventBusService },
        ],
      });
      testableService = TestBed.inject(TestableCanvasService);
    });

    describe('transformCoordinates', () => {
      it('should return coordinates unchanged by default', () => {
        const result = testableService.testTransformCoordinates(100, 200);
        expect(result).toEqual({ x: 100, y: 200 });
      });

      it('should handle zero coordinates', () => {
        const result = testableService.testTransformCoordinates(0, 0);
        expect(result).toEqual({ x: 0, y: 0 });
      });

      it('should handle negative coordinates', () => {
        const result = testableService.testTransformCoordinates(-50, -100);
        expect(result).toEqual({ x: -50, y: -100 });
      });

      it('should handle large coordinates', () => {
        const result = testableService.testTransformCoordinates(10000, 20000);
        expect(result).toEqual({ x: 10000, y: 20000 });
      });

      it('should handle decimal coordinates', () => {
        const result = testableService.testTransformCoordinates(123.456, 789.012);
        expect(result).toEqual({ x: 123.456, y: 789.012 });
      });
    });

    describe('validateZoom', () => {
      it('should return zoom value when within valid range', () => {
        expect(testableService.testValidateZoom(1)).toBe(1);
        expect(testableService.testValidateZoom(2)).toBe(2);
        expect(testableService.testValidateZoom(5)).toBe(5);
      });

      it('should clamp zoom to minimum value of 0.1', () => {
        expect(testableService.testValidateZoom(0.05)).toBe(0.1);
        expect(testableService.testValidateZoom(0)).toBe(0.1);
        expect(testableService.testValidateZoom(-1)).toBe(0.1);
      });

      it('should clamp zoom to maximum value of 10', () => {
        expect(testableService.testValidateZoom(15)).toBe(10);
        expect(testableService.testValidateZoom(100)).toBe(10);
        expect(testableService.testValidateZoom(1000)).toBe(10);
      });

      it('should handle boundary values correctly', () => {
        expect(testableService.testValidateZoom(0.1)).toBe(0.1);
        expect(testableService.testValidateZoom(10)).toBe(10);
      });

      it('should handle values just outside boundaries', () => {
        expect(testableService.testValidateZoom(0.09)).toBe(0.1);
        expect(testableService.testValidateZoom(10.01)).toBe(10);
      });

      it('should handle decimal zoom values', () => {
        expect(testableService.testValidateZoom(1.5)).toBe(1.5);
        expect(testableService.testValidateZoom(0.25)).toBe(0.25);
        expect(testableService.testValidateZoom(7.89)).toBe(7.89);
      });
    });

    describe('Custom Extension Implementation', () => {
      // Create a custom service that overrides extension points
      class CustomCanvasService extends CanvasService {
        public coordinateTransformCalled = false;
        public zoomValidationCalled = false;
        public canvasInitializedCalled = false;

        protected override transformCoordinates(x: number, y: number): { x: number; y: number } {
          this.coordinateTransformCalled = true;
          // Custom implementation: apply a scale factor
          return { x: x * 2, y: y * 2 };
        }

        protected override validateZoom(zoom: number): number {
          this.zoomValidationCalled = true;
          // Custom implementation: different range (0.5 to 5)
          return Math.max(0.5, Math.min(5, zoom));
        }

        // Public methods to test the overridden protected methods
        public testTransformCoordinates(x: number, y: number) {
          return this.transformCoordinates(x, y);
        }

        public testValidateZoom(zoom: number) {
          return this.validateZoom(zoom);
        }
      }

      let customService: CustomCanvasService;

      beforeEach(() => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            { provide: CanvasService, useClass: CustomCanvasService },
            { provide: ConfigService, useValue: mockConfigService },
            { provide: EventBusService, useValue: mockEventBusService },
          ],
        });
        customService = TestBed.inject(CanvasService) as CustomCanvasService;
      });

      it('should allow custom coordinate transformation', () => {
        const result = customService.testTransformCoordinates(10, 20);
        expect(result).toEqual({ x: 20, y: 40 });
        expect(customService.coordinateTransformCalled).toBe(true);
      });

      it('should allow custom zoom validation with different range', () => {
        expect(customService.testValidateZoom(0.3)).toBe(0.5); // Min is 0.5
        expect(customService.testValidateZoom(7)).toBe(5); // Max is 5
        expect(customService.testValidateZoom(2)).toBe(2); // Within range
        expect(customService.zoomValidationCalled).toBe(true);
      });

      it('should demonstrate extensibility pattern', () => {
        // This test demonstrates how developers can extend the service
        const coords = customService.testTransformCoordinates(5, 10);
        const zoom = customService.testValidateZoom(3);

        expect(coords).toEqual({ x: 10, y: 20 });
        expect(zoom).toBe(3);
        expect(customService.coordinateTransformCalled).toBe(true);
        expect(customService.zoomValidationCalled).toBe(true);
      });
    });
  });
});
