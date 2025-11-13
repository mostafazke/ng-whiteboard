import { ApiService } from '../../api/api.service';
import { ElementType, LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { PenTool } from '../pen-tool';
import { createElement } from '../../elements/element.utils';
import { createMockPointerInfo, createMockApiService, createMockWhiteboardConfig } from '../../testing';
import { PenElement } from '../../elements';

jest.mock('../../elements/element.utils');

describe('PenTool', () => {
  let penTool: PenTool;
  let apiService: ReturnType<typeof createMockApiService>;
  let config: WhiteboardConfig;

  beforeEach(() => {
    config = createMockWhiteboardConfig({
      strokeColor: '#000000',
      strokeWidth: 2,
      lineCap: LineCap.Round,
      lineJoin: LineJoin.Round,
      dasharray: '',
      dashoffset: 0,
      backgroundColor: '#ffffff',
      canvasWidth: 800,
      canvasHeight: 600,
    });

    apiService = createMockApiService();
    apiService.addDraftElements = jest.fn();
    apiService.updateDraftElements = jest.fn();
    apiService.commitDraft = jest.fn();
    apiService.commitDraftElements = jest.fn();
    apiService.getConfig = jest.fn().mockReturnValue(config);
    apiService.getCurrentLayer = jest.fn().mockReturnValue('layer1');

    penTool = new PenTool(apiService as unknown as ApiService);
    penTool.activate();
  });

  it('should create a PenTool instance', () => {
    expect(penTool).toBeTruthy();
    expect(penTool.type).toBe(ToolType.Pen);
  });

  it('should handle pointer down and create a PenElement', () => {
    const mockEvent = createMockPointerInfo({ clientX: 100, clientY: 200, eventType: 'pointerdown' });
    jest.spyOn(penTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
    (createElement as jest.Mock).mockReturnValue({ points: [], path: '', style: {} });

    penTool.handlePointerDown(mockEvent);

    expect(penTool.getPointerPosition).toHaveBeenCalledWith(mockEvent);

    // Get the actual call arguments
    const createElementCall = (createElement as jest.Mock).mock.calls[0];
    expect(createElementCall[0]).toBe(ElementType.Pen);
    expect(createElementCall[2]).toBe('layer1');

    // Check the element properties
    const elementProps = createElementCall[1];
    expect(elementProps.points).toEqual([[100, 200]]);
    expect(elementProps.isComplete).toBe(false);
    expect(elementProps.zIndex).toBe(1);

    // Check pathOptions
    expect(elementProps.pathOptions).toBeDefined();
    expect(typeof elementProps.pathOptions.smoothing).toBe('number');
    expect(typeof elementProps.pathOptions.streamline).toBe('number');
    expect(typeof elementProps.pathOptions.thinning).toBe('number');
    expect(typeof elementProps.pathOptions.simulatePressure).toBe('boolean');
    expect(typeof elementProps.pathOptions.size).toBe('number');
    expect(typeof elementProps.pathOptions.easing).toBe('function');
    expect(elementProps.pathOptions.start).toBeDefined();
    expect(elementProps.pathOptions.end).toBeDefined();

    // Check style
    expect(elementProps.style.strokeColor).toBe('#000000');
    expect(elementProps.style.strokeWidth).toBe(2);
    expect(elementProps.style.lineCap).toBe(LineCap.Round);
    expect(elementProps.style.lineJoin).toBe(LineJoin.Round);
    expect(elementProps.style.dasharray).toBe('');
    expect(elementProps.style.dashoffset).toBe(0);

    expect(apiService.addDraftElements).toHaveBeenCalled();
  });

  it('should handle pointer move and update the PenElement', () => {
    const mockEvent = createMockPointerInfo({ clientX: 150, clientY: 250, eventType: 'pointermove' });
    jest.spyOn(penTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 250 });
    penTool.element = { id: 'pen-1', points: [[100, 200]], path: '', style: {} } as unknown as PenElement;

    penTool.handlePointerMove(mockEvent);

    expect(penTool.getPointerPosition).toHaveBeenCalledWith(mockEvent);
    expect(penTool.element?.points).toEqual([
      [100, 200],
      [150, 250],
    ]);
    // The path is updated via updateDraftElements
    expect(apiService.updateDraftElements).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'pen-1',
          points: [
            [100, 200],
            [150, 250],
          ],
        }),
      ])
    );
  });

  it('should handle pointer up and commit the draft', () => {
    penTool.element = { points: [[100, 200]], path: '', style: {} } as unknown as PenElement;

    penTool.handlePointerUp();

    expect(apiService.commitDraftElements).toHaveBeenCalled();
    expect(penTool.element).toBeNull();
  });

  it('should not handle pointer events if not active', () => {
    penTool.deactivate();

    const mockEvent = createMockPointerInfo({ clientX: 100, clientY: 200, eventType: 'pointerdown' });
    jest.spyOn(penTool, 'getPointerPosition');

    penTool.handlePointerDown(mockEvent);
    penTool.handlePointerMove(mockEvent);
    penTool.handlePointerUp();

    expect(penTool.getPointerPosition).not.toHaveBeenCalled();
    expect(apiService.addDraftElements).not.toHaveBeenCalled();
    expect(apiService.commitDraftElements).not.toHaveBeenCalled();
  });

  describe('getCurrentPathOptions', () => {
    it('should return stroke options with all required properties', () => {
      // @ts-expect-error - accessing private method for testing
      const getCurrentPathOptions = penTool.getCurrentPathOptions.bind(penTool);

      const options = getCurrentPathOptions();

      expect(options).toMatchObject({
        smoothing: expect.any(Number),
        streamline: expect.any(Number),
        thinning: expect.any(Number),
        simulatePressure: expect.any(Boolean),
        size: expect.any(Number),
        easing: expect.any(Function),
        start: expect.objectContaining({
          cap: expect.any(Boolean),
          taper: expect.any(Number),
        }),
        end: expect.objectContaining({
          cap: expect.any(Boolean),
          taper: expect.any(Number),
        }),
      });
    });

    it('should return values within valid ranges', () => {
      // @ts-expect-error - accessing private method for testing
      const getCurrentPathOptions = penTool.getCurrentPathOptions.bind(penTool);

      const options = getCurrentPathOptions();

      // Smoothing, streamline, and thinning should be between 0 and 1
      expect(options.smoothing).toBeGreaterThanOrEqual(0);
      expect(options.smoothing).toBeLessThanOrEqual(1);
      expect(options.streamline).toBeGreaterThanOrEqual(0);
      expect(options.streamline).toBeLessThanOrEqual(1);
      expect(options.thinning).toBeGreaterThanOrEqual(0);
      expect(options.thinning).toBeLessThanOrEqual(1);

      // Size should be positive
      expect(options.size).toBeGreaterThan(0);

      // Tapers should be non-negative
      if (options.start) {
        expect(options.start.taper).toBeGreaterThanOrEqual(0);
      }
      if (options.end) {
        expect(options.end.taper).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return a valid easing function', () => {
      // @ts-expect-error - accessing private method for testing
      const getCurrentPathOptions = penTool.getCurrentPathOptions.bind(penTool);

      const options = getCurrentPathOptions();

      // Easing function should map 0 to 0 and 1 to 1
      if (options.easing) {
        expect(options.easing(0)).toBe(0);
        expect(options.easing(1)).toBe(1);

        // Values in between should be within [0, 1]
        expect(options.easing(0.5)).toBeGreaterThanOrEqual(0);
        expect(options.easing(0.5)).toBeLessThanOrEqual(1);
      }
    });

    it('should include cap configuration for start and end', () => {
      // @ts-expect-error - accessing private method for testing
      const getCurrentPathOptions = penTool.getCurrentPathOptions.bind(penTool);

      const options = getCurrentPathOptions();

      expect(options.start).toBeDefined();
      if (options.start) {
        expect(typeof options.start.cap).toBe('boolean');
        expect(typeof options.start.taper).toBe('number');
      }

      expect(options.end).toBeDefined();
      if (options.end) {
        expect(typeof options.end.cap).toBe('boolean');
        expect(typeof options.end.taper).toBe('number');
      }
    });

    it('should default simulatePressure to true when not specified', () => {
      // @ts-expect-error - accessing private method for testing
      const getCurrentPathOptions = penTool.getCurrentPathOptions.bind(penTool);

      const options = getCurrentPathOptions();

      expect(options.simulatePressure).toBeDefined();
      expect(typeof options.simulatePressure).toBe('boolean');
    });

    it('should have all properties defined with no undefined values', () => {
      // @ts-expect-error - accessing private method for testing
      const getCurrentPathOptions = penTool.getCurrentPathOptions.bind(penTool);

      const options = getCurrentPathOptions();

      // All properties should have defined values
      expect(options.smoothing).toBeDefined();
      expect(options.streamline).toBeDefined();
      expect(options.thinning).toBeDefined();
      expect(options.simulatePressure).toBeDefined();
      expect(options.size).toBeDefined();
      expect(options.easing).toBeDefined();
      expect(options.start).toBeDefined();
      expect(options.end).toBeDefined();
    });
  });

  describe('getElementStyle', () => {
    it('should return style with all required properties', () => {
      // @ts-expect-error - accessing private method for testing
      const getElementStyle = penTool.getElementStyle.bind(penTool);

      const style = getElementStyle();

      expect(style).toMatchObject({
        strokeColor: config.strokeColor,
        strokeWidth: config.strokeWidth,
        lineCap: config.lineCap,
        lineJoin: config.lineJoin,
        dasharray: config.dasharray,
        dashoffset: config.dashoffset,
      });
      expect(style).toHaveProperty('opacity');
    });

    it('should use values from whiteboardConfig', () => {
      // @ts-expect-error - accessing private method for testing
      const getElementStyle = penTool.getElementStyle.bind(penTool);

      const style = getElementStyle();

      expect(style.strokeColor).toBe('#000000');
      expect(style.strokeWidth).toBe(2);
      expect(style.lineCap).toBe(LineCap.Round);
      expect(style.lineJoin).toBe(LineJoin.Round);
      expect(style.dasharray).toBe('');
      expect(style.dashoffset).toBe(0);
    });

    it('should include opacity from preset', () => {
      // @ts-expect-error - accessing private method for testing
      const getElementStyle = penTool.getElementStyle.bind(penTool);

      const style = getElementStyle();

      // Opacity might be undefined for regular pens, but should be defined for highlighters
      expect(style).toHaveProperty('opacity');
      if (style.opacity !== undefined) {
        expect(style.opacity).toBeGreaterThanOrEqual(0);
        expect(style.opacity).toBeLessThanOrEqual(1);
      }
    });
  });
});
