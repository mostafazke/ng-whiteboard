import { ApiService } from '../../api/api.service';
import { ElementType, LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { PenTool } from '../pen-tool';
import { createElement } from '../../elements/element.utils';
import { getPresetForType } from '../../types/pen-presets';
import { createMockPointerInfo, createMockApiService, createMockWhiteboardConfig } from '../../testing';
import { PenElement } from '../../elements';

jest.mock('../../elements/element.utils');
jest.mock('../../types/pen-presets');

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
    apiService.selectElements = jest.fn();
    apiService.finalizeDraw = jest.fn();
    apiService.getConfig = jest.fn().mockReturnValue(config);
    apiService.getCurrentLayer = jest.fn().mockReturnValue('layer1');

    (getPresetForType as jest.Mock).mockReturnValue({
      strokeOptions: {
        smoothing: 0.9,
        streamline: 0.8,
        thinning: 0.7,
        simulatePressure: true,
        size: 5,
        easing: (t: number) => t,
        start: { cap: true, taper: 0.5 },
        end: { cap: true, taper: 0.6 },
      },
      opacity: 1
    });

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

  it('should filter points during pointer move based on distance', () => {
    penTool.element = { id: 'pen-1', points: [[100, 200]], path: '', style: {} } as unknown as PenElement;

    // Movement within threshold (e.g., 1 pixel move)
    const smallMoveEvent = createMockPointerInfo({ clientX: 101, clientY: 201, eventType: 'pointermove' });
    jest.spyOn(penTool, 'getPointerPosition').mockReturnValue({ x: 101, y: 201 });

    penTool.handlePointerMove(smallMoveEvent);

    expect(penTool.element?.points).toEqual([[100, 200]]);
    expect(apiService.updateDraftElements).not.toHaveBeenCalled();

    // Movement exactly at threshold (2 pixels move: sqrt(2^2 + 0^2) = 2)
    const thresholdMoveEvent = createMockPointerInfo({ clientX: 102, clientY: 200, eventType: 'pointermove' });
    jest.spyOn(penTool, 'getPointerPosition').mockReturnValue({ x: 102, y: 200 });

    penTool.handlePointerMove(thresholdMoveEvent);

    expect(penTool.element?.points).toEqual([
      [100, 200],
      [102, 200],
    ]);
    expect(apiService.updateDraftElements).toHaveBeenCalled();
  });

  it('should handle pointer up and commit the draft', () => {
    penTool.element = { id: 'pen-1', points: [[100, 200]], path: '', style: {} } as unknown as PenElement;

    penTool.handlePointerUp();

    expect(apiService.commitDraftElements).toHaveBeenCalled();
    expect(penTool.element).toBeNull();
  });

  it('should finalize the draw (post-draw select decision delegated) on pointer up', () => {
    penTool.element = {
      id: 'pen-1',
      points: [[100, 200]],
      path: '',
      style: {},
      selectAfterDraw: true
    } as unknown as PenElement;

    penTool.handlePointerUp();

    expect(apiService.finalizeDraw).toHaveBeenCalledWith(expect.objectContaining({ id: 'pen-1' }));
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

  it('should not do anything in handlePointerMove if element is null', () => {
    penTool.element = null;
    const mockEvent = createMockPointerInfo({ clientX: 150, clientY: 250, eventType: 'pointermove' });
    penTool.handlePointerMove(mockEvent);
    expect(apiService.updateDraftElements).not.toHaveBeenCalled();
  });

  it('should not do anything in handlePointerUp if element is null', () => {
    penTool.element = null;
    penTool.handlePointerUp();
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

    it('should use default values when preset options are missing', () => {
      (getPresetForType as jest.Mock).mockReturnValue({
        strokeOptions: {},
      });

      // @ts-expect-error - accessing private method for testing
      const getCurrentPathOptions = penTool.getCurrentPathOptions.bind(penTool);
      const options = getCurrentPathOptions();

      expect(options.smoothing).toBe(0.5);
      expect(options.size).toBe(16);
      expect(typeof options.easing).toBe('function');
      expect(options.easing!(0.5)).toBe(0.5);
    });

    it('should use provided easing function from preset', () => {
      const mockEasing = jest.fn().mockReturnValue(1);
      (getPresetForType as jest.Mock).mockReturnValue({
        strokeOptions: {
          easing: mockEasing,
        },
      });

      // @ts-expect-error - accessing private method for testing
      const getCurrentPathOptions = penTool.getCurrentPathOptions.bind(penTool);
      const options = getCurrentPathOptions();

      expect(options.easing).toBe(mockEasing);
      expect(options.easing!(0.5)).toBe(1);
    });

    it('should use fallback easing function when not provided', () => {
      (getPresetForType as jest.Mock).mockReturnValue({
        strokeOptions: {},
      });

      // @ts-expect-error - accessing private method for testing
      const getCurrentPathOptions = penTool.getCurrentPathOptions.bind(penTool);
      const options = getCurrentPathOptions();

      expect(typeof options.easing).toBe('function');
      const easing = options.easing!;

      // Test t < 0.5 branch
      expect(easing(0.25)).toBe(0.125); // 2 * 0.25^2 = 0.125

      // Test t >= 0.5 branch
      expect(easing(0.75)).toBe(0.875);
    });

    it('should handle all fallback branches for stroke options', () => {
      (getPresetForType as jest.Mock).mockReturnValue({
        strokeOptions: {
          simulatePressure: false,
        },
      });

      // @ts-expect-error - accessing private method for testing
      const getCurrentPathOptions = penTool.getCurrentPathOptions.bind(penTool);
      const options = getCurrentPathOptions();

      expect(options.simulatePressure).toBe(false);
      expect(options.streamline).toBe(0.5);
      expect(options.thinning).toBe(0.5);
      expect(options.start).toEqual({ cap: true, taper: 0.3 });
      expect(options.end).toEqual({ cap: true, taper: 0.4 });
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

    it('should include opacity from preset', () => {
      // @ts-expect-error - accessing private method for testing
      const getElementStyle = penTool.getElementStyle.bind(penTool);

      const style = getElementStyle();

      expect(style).toHaveProperty('opacity');
      if (style.opacity !== undefined) {
        expect(style.opacity).toBeGreaterThanOrEqual(0);
        expect(style.opacity).toBeLessThanOrEqual(1);
      }
    });
  });
});
