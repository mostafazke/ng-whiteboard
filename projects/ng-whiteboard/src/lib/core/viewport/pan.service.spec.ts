import { TestBed } from '@angular/core/testing';
import { PanService } from './pan.service';
import { ConfigService } from '../config/config.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { WhiteboardConfig } from '../types';

describe('PanService', () => {
  let service: PanService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockEventBusService: jest.Mocked<EventBusService>;

  const mockConfig: WhiteboardConfig = {
    x: 0,
    y: 0,
  } as WhiteboardConfig;

  beforeEach(() => {
    mockConfigService = {
      getConfig: jest.fn().mockReturnValue(mockConfig),
      updateConfig: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    mockEventBusService = {
      emit: jest.fn(),
      on: jest.fn(),
    } as unknown as jest.Mocked<EventBusService>;

    TestBed.configureTestingModule({
      providers: [
        PanService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventBusService, useValue: mockEventBusService },
      ],
    });

    service = TestBed.inject(PanService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('pan', () => {
    it('should pan the canvas by delta amounts', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 100, y: 50 } as WhiteboardConfig);

      service.pan(20, 30);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 120, y: 80 });
    });

    it('should pan with negative deltas', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 100, y: 100 } as WhiteboardConfig);

      service.pan(-50, -25);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 50, y: 75 });
    });

    it('should pan from origin', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 0, y: 0 } as WhiteboardConfig);

      service.pan(10, 20);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 10, y: 20 });
    });

    it('should constrain pan position within bounds when set', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 0, y: 0 } as WhiteboardConfig);
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      service.pan(150, 150);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 100, y: 100 });
    });

    it('should allow pan within bounds', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 10, y: 10 } as WhiteboardConfig);
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      service.pan(20, 30);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 30, y: 40 });
    });

    it('should constrain negative pan to bounds', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 50, y: 50 } as WhiteboardConfig);
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      service.pan(-100, -100);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 0, y: 0 });
    });
  });

  describe('panTo', () => {
    it('should pan to specific position', () => {
      service.panTo(100, 200);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 100, y: 200 });
    });

    it('should pan to negative position', () => {
      service.panTo(-50, -75);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: -50, y: -75 });
    });

    it('should pan to origin', () => {
      service.panTo(0, 0);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 0, y: 0 });
    });

    it('should constrain panTo within bounds', () => {
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      service.panTo(150, 200);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 100, y: 100 });
    });

    it('should constrain panTo negative values to bounds', () => {
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      service.panTo(-50, -75);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 0, y: 0 });
    });
  });

  describe('getPanPosition', () => {
    it('should return current pan position', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 100, y: 200 } as WhiteboardConfig);

      const position = service.getPanPosition();

      expect(position).toEqual({ x: 100, y: 200 });
    });

    it('should return origin position', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 0, y: 0 } as WhiteboardConfig);

      const position = service.getPanPosition();

      expect(position).toEqual({ x: 0, y: 0 });
    });
  });

  describe('resetPan', () => {
    it('should reset pan to origin', () => {
      service.resetPan();

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 0, y: 0 });
    });
  });

  describe('setPanBounds', () => {
    it('should set pan bounds', () => {
      service.setPanBounds({ x: 0, y: 0, width: 500, height: 400 });

      const bounds = service.getPanBounds();

      expect(bounds).toEqual({ x: 0, y: 0, width: 500, height: 400 });
    });

    it('should set negative bounds', () => {
      service.setPanBounds({ x: -100, y: -100, width: 200, height: 200 });

      const bounds = service.getPanBounds();

      expect(bounds).toEqual({ x: -100, y: -100, width: 200, height: 200 });
    });

    it('should constrain subsequent pans within new bounds', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 0, y: 0 } as WhiteboardConfig);
      service.setPanBounds({ x: 0, y: 0, width: 50, height: 50 });

      service.pan(100, 100);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 50, y: 50 });
    });
  });

  describe('resetPanBounds', () => {
    it('should reset pan bounds to unlimited', () => {
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });
      service.resetPanBounds();

      const bounds = service.getPanBounds();

      expect(bounds).toEqual({ x: -Infinity, y: -Infinity, width: Infinity, height: Infinity });
    });

    it('should allow unlimited panning after reset', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 0, y: 0 } as WhiteboardConfig);
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });
      service.resetPanBounds();

      service.pan(1000, 1000);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 1000, y: 1000 });
    });
  });

  describe('getPanBounds', () => {
    it('should return default bounds initially', () => {
      const bounds = service.getPanBounds();

      expect(bounds).toEqual({ x: -Infinity, y: -Infinity, width: Infinity, height: Infinity });
    });

    it('should return set bounds', () => {
      service.setPanBounds({ x: 10, y: 20, width: 300, height: 400 });

      const bounds = service.getPanBounds();

      expect(bounds).toEqual({ x: 10, y: 20, width: 300, height: 400 });
    });

    it('should return a copy of bounds', () => {
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      const bounds = service.getPanBounds();
      bounds.x = 999;

      const newBounds = service.getPanBounds();
      expect(newBounds.x).toBe(0);
    });
  });

  describe('isPositionWithinBounds', () => {
    it('should return true for any position when bounds are unlimited', () => {
      expect(service.isPositionWithinBounds(1000, 1000)).toBe(true);
      expect(service.isPositionWithinBounds(-1000, -1000)).toBe(true);
    });

    it('should return true for position within bounds', () => {
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      expect(service.isPositionWithinBounds(50, 50)).toBe(true);
    });

    it('should return true for position at bounds edges', () => {
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      expect(service.isPositionWithinBounds(0, 0)).toBe(true);
      expect(service.isPositionWithinBounds(100, 100)).toBe(true);
    });

    it('should return false for position outside bounds', () => {
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      expect(service.isPositionWithinBounds(150, 50)).toBe(false);
      expect(service.isPositionWithinBounds(50, 150)).toBe(false);
      expect(service.isPositionWithinBounds(-10, 50)).toBe(false);
      expect(service.isPositionWithinBounds(50, -10)).toBe(false);
    });

    it('should handle negative bounds', () => {
      service.setPanBounds({ x: -100, y: -100, width: 200, height: 200 });

      expect(service.isPositionWithinBounds(0, 0)).toBe(true);
      expect(service.isPositionWithinBounds(-50, -50)).toBe(true);
      expect(service.isPositionWithinBounds(50, 50)).toBe(true);
      expect(service.isPositionWithinBounds(-150, 0)).toBe(false);
      expect(service.isPositionWithinBounds(150, 0)).toBe(false);
    });
  });

  describe('getDistanceToBounds', () => {
    it('should return Infinity for all sides when bounds are unlimited', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 100, y: 100 } as WhiteboardConfig);

      const distance = service.getDistanceToBounds();

      expect(distance).toEqual({ left: Infinity, top: Infinity, right: Infinity, bottom: Infinity });
    });

    it('should calculate distances to bounds from center', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 50, y: 50 } as WhiteboardConfig);
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      const distance = service.getDistanceToBounds();

      expect(distance).toEqual({ left: 50, top: 50, right: 50, bottom: 50 });
    });

    it('should calculate distances from origin', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 0, y: 0 } as WhiteboardConfig);
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      const distance = service.getDistanceToBounds();

      expect(distance).toEqual({ left: 0, top: 0, right: 100, bottom: 100 });
    });

    it('should calculate distances from edge', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 100, y: 100 } as WhiteboardConfig);
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      const distance = service.getDistanceToBounds();

      expect(distance).toEqual({ left: 100, top: 100, right: 0, bottom: 0 });
    });

    it('should handle negative position relative to bounds', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: -50, y: -50 } as WhiteboardConfig);
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      const distance = service.getDistanceToBounds();

      expect(distance).toEqual({ left: -50, top: -50, right: 150, bottom: 150 });
    });
  });

  describe('panWithEasing', () => {
    it('should pan to target position', () => {
      service.panWithEasing(100, 200);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 100, y: 200 });
    });

    it('should respect bounds', () => {
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      service.panWithEasing(200, 200);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 100, y: 100 });
    });
  });

  describe('panWithMomentum', () => {
    it('should pan by delta', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 50, y: 50 } as WhiteboardConfig);

      service.panWithMomentum(25, 35);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 75, y: 85 });
    });

    it('should respect bounds', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 90, y: 90 } as WhiteboardConfig);
      service.setPanBounds({ x: 0, y: 0, width: 100, height: 100 });

      service.panWithMomentum(50, 50);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 100, y: 100 });
    });
  });

  describe('edge cases', () => {
    it('should handle zero deltas', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 100, y: 100 } as WhiteboardConfig);

      service.pan(0, 0);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 100, y: 100 });
    });

    it('should handle very large deltas', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 0, y: 0 } as WhiteboardConfig);

      service.pan(10000, 10000);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 10000, y: 10000 });
    });

    it('should handle decimal positions', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 0, y: 0 } as WhiteboardConfig);

      service.pan(10.5, 20.7);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 10.5, y: 20.7 });
    });

    it('should handle zero-sized bounds', () => {
      mockConfigService.getConfig.mockReturnValue({ ...mockConfig, x: 10, y: 10 } as WhiteboardConfig);
      service.setPanBounds({ x: 0, y: 0, width: 0, height: 0 });

      service.pan(5, 5);

      expect(mockConfigService.updateConfig).toHaveBeenCalledWith({ x: 0, y: 0 });
    });
  });
});
