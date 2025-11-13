import { TestBed } from '@angular/core/testing';
import { WheelHandlerService } from './wheel-handler.service';
import { ApiService } from '../api/api.service';
import { WhiteboardConfig } from '../types';

describe('WheelHandlerService', () => {
  let service: WheelHandlerService;
  let mockApiService: jest.Mocked<ApiService>;

  const mockConfig: WhiteboardConfig = {
    zoom: 1,
  } as WhiteboardConfig;

  const createWheelEvent = (options: { deltaY: number; ctrlKey?: boolean; shiftKey?: boolean }): WheelEvent => {
    const event = new WheelEvent('wheel', {
      deltaY: options.deltaY,
      ctrlKey: options.ctrlKey || false,
      shiftKey: options.shiftKey || false,
      bubbles: true,
      cancelable: true,
    });
    jest.spyOn(event, 'preventDefault');
    return event;
  };

  beforeEach(() => {
    mockApiService = {
      zoomIn: jest.fn(),
      zoomOut: jest.fn(),
      pan: jest.fn(),
      getConfig: jest.fn().mockReturnValue(mockConfig),
    } as unknown as jest.Mocked<ApiService>;

    TestBed.configureTestingModule({
      providers: [WheelHandlerService, { provide: ApiService, useValue: mockApiService }],
    });

    service = TestBed.inject(WheelHandlerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('handleWheel', () => {
    describe('zoom handling (Ctrl key)', () => {
      it('should prevent default on all wheel events', () => {
        const event = createWheelEvent({ deltaY: -100 });

        service.handleWheel(event);

        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should zoom in when Ctrl+wheel up (negative deltaY)', () => {
        const event = createWheelEvent({ deltaY: -100, ctrlKey: true });

        service.handleWheel(event);

        expect(mockApiService.zoomIn).toHaveBeenCalled();
        expect(mockApiService.zoomOut).not.toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should zoom out when Ctrl+wheel down (positive deltaY)', () => {
        const event = createWheelEvent({ deltaY: 100, ctrlKey: true });

        service.handleWheel(event);

        expect(mockApiService.zoomOut).toHaveBeenCalled();
        expect(mockApiService.zoomIn).not.toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should handle zero deltaY with ctrl key', () => {
        const event = createWheelEvent({ deltaY: 0, ctrlKey: true });

        service.handleWheel(event);

        expect(mockApiService.zoomOut).toHaveBeenCalled();
      });

      it('should handle very small negative deltaY', () => {
        const event = createWheelEvent({ deltaY: -1, ctrlKey: true });

        service.handleWheel(event);

        expect(mockApiService.zoomIn).toHaveBeenCalled();
      });

      it('should handle very small positive deltaY', () => {
        const event = createWheelEvent({ deltaY: 1, ctrlKey: true });

        service.handleWheel(event);

        expect(mockApiService.zoomOut).toHaveBeenCalled();
      });
    });

    describe('horizontal pan handling (Shift key)', () => {
      it('should pan horizontally when Shift+wheel down', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: 100, shiftKey: true });

        service.handleWheel(event);

        // PAN_SENSITIVITY is 0.5, so 100 * 0.5 / 1 = 50
        expect(mockApiService.pan).toHaveBeenCalledWith(50, 0);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should pan horizontally when Shift+wheel up', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: -100, shiftKey: true });

        service.handleWheel(event);

        // PAN_SENSITIVITY is 0.5, so -100 * 0.5 / 1 = -50
        expect(mockApiService.pan).toHaveBeenCalledWith(-50, 0);
      });

      it('should adjust pan for zoom level', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 2 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: 100, shiftKey: true });

        service.handleWheel(event);

        // PAN_SENSITIVITY is 0.5, so 100 * 0.5 / 2 = 25
        expect(mockApiService.pan).toHaveBeenCalledWith(25, 0);
      });

      it('should adjust pan for zoom level 0.5', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 0.5 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: 100, shiftKey: true });

        service.handleWheel(event);

        // PAN_SENSITIVITY is 0.5, so 100 * 0.5 / 0.5 = 100
        expect(mockApiService.pan).toHaveBeenCalledWith(100, 0);
      });

      it('should handle zero deltaY with shift key', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: 0, shiftKey: true });

        service.handleWheel(event);

        expect(mockApiService.pan).toHaveBeenCalledWith(0, 0);
      });

      it('should handle large deltaY values', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: 1000, shiftKey: true });

        service.handleWheel(event);

        // PAN_SENSITIVITY is 0.5, so 1000 * 0.5 / 1 = 500
        expect(mockApiService.pan).toHaveBeenCalledWith(500, 0);
      });
    });

    describe('vertical pan handling (no modifier keys)', () => {
      it('should pan vertically when wheel down', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: 100 });

        service.handleWheel(event);

        // PAN_SENSITIVITY is 0.5, so 100 * 0.5 / 1 = 50
        expect(mockApiService.pan).toHaveBeenCalledWith(0, 50);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should pan vertically when wheel up', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: -100 });

        service.handleWheel(event);

        // PAN_SENSITIVITY is 0.5, so -100 * 0.5 / 1 = -50
        expect(mockApiService.pan).toHaveBeenCalledWith(0, -50);
      });

      it('should adjust vertical pan for zoom level', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 2 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: 100 });

        service.handleWheel(event);

        // PAN_SENSITIVITY is 0.5, so 100 * 0.5 / 2 = 25
        expect(mockApiService.pan).toHaveBeenCalledWith(0, 25);
      });

      it('should adjust vertical pan for zoom level 0.5', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 0.5 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: 100 });

        service.handleWheel(event);

        // PAN_SENSITIVITY is 0.5, so 100 * 0.5 / 0.5 = 100
        expect(mockApiService.pan).toHaveBeenCalledWith(0, 100);
      });

      it('should handle zero deltaY without modifier keys', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: 0 });

        service.handleWheel(event);

        expect(mockApiService.pan).toHaveBeenCalledWith(0, 0);
      });

      it('should handle large deltaY values', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: 1000 });

        service.handleWheel(event);

        // PAN_SENSITIVITY is 0.5, so 1000 * 0.5 / 1 = 500
        expect(mockApiService.pan).toHaveBeenCalledWith(0, 500);
      });
    });

    describe('priority handling', () => {
      it('should prioritize Ctrl over Shift', () => {
        const event = createWheelEvent({ deltaY: -100, ctrlKey: true, shiftKey: true });

        service.handleWheel(event);

        expect(mockApiService.zoomIn).toHaveBeenCalled();
        expect(mockApiService.pan).not.toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle decimal deltaY values', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 1 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: 10.5 });

        service.handleWheel(event);

        // PAN_SENSITIVITY is 0.5, so 10.5 * 0.5 / 1 = 5.25
        expect(mockApiService.pan).toHaveBeenCalledWith(0, 5.25);
      });

      it('should handle very small zoom levels', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 0.1 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: 100, shiftKey: true });

        service.handleWheel(event);

        // PAN_SENSITIVITY is 0.5, so 100 * 0.5 / 0.1 = 500
        expect(mockApiService.pan).toHaveBeenCalledWith(500, 0);
      });

      it('should handle very large zoom levels', () => {
        mockApiService.getConfig.mockReturnValue({ ...mockConfig, zoom: 10 } as WhiteboardConfig);
        const event = createWheelEvent({ deltaY: 100 });

        service.handleWheel(event);

        // PAN_SENSITIVITY is 0.5, so 100 * 0.5 / 10 = 5
        expect(mockApiService.pan).toHaveBeenCalledWith(0, 5);
      });
    });
  });
});
