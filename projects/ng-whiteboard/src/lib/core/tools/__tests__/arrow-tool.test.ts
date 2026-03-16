import { createMockPointerInfo, createMockApiService, createMockWhiteboardConfig } from '../../testing';
import { ApiService } from '../../api/api.service';
import { createElement } from '../../elements/element.utils';
import { LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { ArrowElement, ArrowheadType } from '../../elements';
import { snapToAngle } from '../../utils/geometry';
import { snapToGrid } from '../../utils/geometry';
import { ArrowTool } from '../arrow-tool';
import { ConnectionPointsService } from '../../elements/connection-points.service';
import { ArrowBindingService } from '../../elements/arrow-binding.service';
import { ConnectionUIService } from '../../elements/connection-ui.service';

jest.mock('../../elements/element.utils');
jest.mock('../../utils/geometry', () => ({
  snapToGrid: jest.fn((value, gridSize) => Math.round(value / gridSize) * gridSize),
  snapToAngle: jest.fn(),
  getCanvasCoordinates: jest.fn((config, point) => point),
}));

describe('ArrowTool', () => {
  let arrowTool: ArrowTool;
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
      snapToGrid: false,
      gridSize: 10,
      fullScreen: true,
      zoom: 1,
      x: 0,
      y: 0,
      canvasX: 0,
      canvasY: 0,
    });

    apiService = createMockApiService();
    apiService.addDraftElements = jest.fn();
    apiService.updateDraftElements = jest.fn((updates) => {
      // Mock implementation that updates the element properties
      if (arrowTool.element && updates && updates.length > 0) {
        Object.assign(arrowTool.element, updates[0]);
      }
    });
    apiService.commitDraft = jest.fn();
    apiService.commitDraftElements = jest.fn();
    apiService.getConfig = jest.fn().mockReturnValue(config);
    apiService.getCurrentLayer = jest.fn().mockReturnValue('layer-1');
    apiService.getNextZIndex = jest.fn().mockReturnValue(1);
    apiService.getActiveLayerId = jest.fn().mockReturnValue('layer-1');
    apiService.selectElements = jest.fn();

    arrowTool = new ArrowTool(apiService as unknown as ApiService);
    arrowTool.activate();
  });

  it('should initialize with the correct type', () => {
    expect(arrowTool.type).toBe(ToolType.Arrow);
  });

  it('should handle pointer down and create an element', () => {
    const mockEvent = createMockPointerInfo({
      x: 100,
      y: 200,
      eventType: 'pointerdown',
    });

    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });

    arrowTool.handlePointerDown(mockEvent);

    expect(arrowTool.startPoint).toEqual({ x: 100, y: 200 });
    expect(arrowTool.element).toBeDefined();
    expect(apiService.addDraftElements).toHaveBeenCalledWith([arrowTool.element]);
  });

  it('should handle pointer move and update the element', () => {
    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({
      x: 150,
      y: 250,
      shiftKey: false,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    expect(apiService.updateDraftElements).toHaveBeenCalledWith([
      expect.objectContaining({ id: '1', x2: 150, y2: 250 }),
    ]);
  });

  it('should handle pointer up and commit the draft', () => {
    arrowTool.element = { x1: 100, y1: 200, x2: 150, y2: 250 } as unknown as ArrowElement;
    arrowTool.startPoint = { x: 100, y: 200 };

    arrowTool.handlePointerUp();

    expect(apiService.commitDraftElements).toHaveBeenCalled();
    expect(arrowTool.element).toBeNull();
    expect(arrowTool.startPoint).toBeNull();
  });

  it('should not update element if movement is below MIN_LENGTH', () => {
    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({
      x: 101,
      y: 201,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    // Movement is only 1 pixel in each direction, which is below MIN_LENGTH (2)
    // So the element should NOT be updated
    expect(arrowTool.element?.x2).toBe(100);
    expect(arrowTool.element?.y2).toBe(200);
  });

  it('should not update element if tool is inactive', () => {
    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    arrowTool.deactivate();

    const moveEvent = createMockPointerInfo({
      x: 150,
      y: 250,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    expect(arrowTool.element?.x2).toBe(100);
    expect(arrowTool.element?.y2).toBe(200);
  });

  it('should not update element if no element is active', () => {
    const moveEvent = createMockPointerInfo({
      x: 150,
      y: 250,
      eventType: 'pointermove',
    });

    arrowTool.element = null;

    arrowTool.handlePointerMove(moveEvent);

    expect(arrowTool.element).toBeNull();
  });

  it('should update element coordinates when movement is significant', () => {
    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({
      x: 160,
      y: 260,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    expect(arrowTool.element?.x2).toBe(160);
    expect(arrowTool.element?.y2).toBe(260);
  });

  it('should not update element coordinates when movement is below MIN_LENGTH', () => {
    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({
      x: 101,
      y: 201,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    // Movement is only 1 pixel in each direction, which is below MIN_LENGTH (2)
    // So the element should NOT be updated
    expect(arrowTool.element?.x2).toBe(100);
    expect(arrowTool.element?.y2).toBe(200);
  });

  it('should snap to grid when enabled', () => {
    config.snapToGrid = true;
    config.gridSize = 10;

    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });
    (snapToGrid as jest.Mock).mockImplementation((value, gridSize) => Math.round(value / gridSize) * gridSize);

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({
      x: 105,
      y: 205,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    expect(arrowTool.element?.x2).toBe(110);
    expect(arrowTool.element?.y2).toBe(210);
  });

  it('should snap to angle when shift key is pressed', () => {
    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });
    (snapToAngle as jest.Mock).mockReturnValue({ x: 160, y: 240 });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({
      x: 150,
      y: 250,
      shiftKey: true,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    expect(apiService.updateDraftElements).toHaveBeenCalledWith([
      expect.objectContaining({ id: '1', x2: 160, y2: 240 }),
    ]);
  });

  // ------------------------------------------------------------------ //
  //  setConnectionServices & onDeactivate                               //
  // ------------------------------------------------------------------ //

  describe('setConnectionServices', () => {
    it('should store connection service references', () => {
      const mockCp = {
        findSnapTarget: jest.fn(),
        getConnectionPoints: jest.fn(),
      } as unknown as ConnectionPointsService;
      const mockAb = { createBinding: jest.fn() } as unknown as ArrowBindingService;
      const mockUi = {
        setSnapIndicator: jest.fn(),
        setVisibleConnectionPoints: jest.fn(),
        clearAll: jest.fn(),
      } as unknown as ConnectionUIService;

      arrowTool.setConnectionServices(mockCp, mockAb, mockUi);
      // Verify it doesn't throw and services are operational
      arrowTool.deactivate(); // triggers onDeactivate which calls connectionUIService.clearAll
      expect(mockUi.clearAll).toHaveBeenCalled();
    });
  });

  describe('onDeactivate', () => {
    it('should call clearAll on connectionUIService', () => {
      const mockUi = { clearAll: jest.fn() } as unknown as ConnectionUIService;
      arrowTool.setConnectionServices({} as ConnectionPointsService, {} as ArrowBindingService, mockUi);
      arrowTool.deactivate();
      expect(mockUi.clearAll).toHaveBeenCalled();
    });

    it('should not throw when connectionUIService is not set', () => {
      // No services set — connectionUIService is undefined
      expect(() => arrowTool.deactivate()).not.toThrow();
    });
  });

  // ------------------------------------------------------------------ //
  //  handlePointerDown — connection snapping (startSnap)                //
  // ------------------------------------------------------------------ //

  describe('handlePointerDown with connection snapping', () => {
    let mockCp: any;
    let mockAb: any;
    let mockUi: any;

    beforeEach(() => {
      mockCp = {
        findSnapTarget: jest.fn(),
        getConnectionPoints: jest.fn(),
      };
      mockAb = {
        createBinding: jest.fn().mockReturnValue({ elementId: 'rect-1', pointId: 'top' }),
      };
      mockUi = {
        setSnapIndicator: jest.fn(),
        setVisibleConnectionPoints: jest.fn(),
        clearAll: jest.fn(),
      };
      arrowTool.setConnectionServices(mockCp, mockAb, mockUi);
      apiService.getElements = jest.fn().mockReturnValue([{ id: 'rect-1', type: 'rectangle' }]);
    });

    it('should snap start point to a nearby shape connection point', () => {
      mockCp.findSnapTarget.mockReturnValue({
        elementId: 'rect-1',
        pointId: 'top',
        point: { x: 50, y: 0 },
        distance: 5,
      });
      (createElement as jest.Mock).mockReturnValue({ id: 'a1', x1: 50, y1: 0, x2: 50, y2: 0 });

      const event = createMockPointerInfo({ x: 48, y: 3, eventType: 'pointerdown' });
      arrowTool.handlePointerDown(event);

      expect(mockCp.findSnapTarget).toHaveBeenCalled();
      expect(mockUi.setSnapIndicator).toHaveBeenCalledWith({ x: 50, y: 0 });
      expect(mockAb.createBinding).toHaveBeenCalledWith('rect-1', 'top');
      expect(arrowTool.startPoint).toEqual({ x: 50, y: 0 });
    });

    it('should not snap when no target is nearby', () => {
      mockCp.findSnapTarget.mockReturnValue(null);
      (createElement as jest.Mock).mockReturnValue({ id: 'a1', x1: 100, y1: 200, x2: 100, y2: 200 });

      const event = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
      arrowTool.handlePointerDown(event);

      expect(mockUi.setSnapIndicator).not.toHaveBeenCalled();
      expect(arrowTool.startPoint).toEqual({ x: 100, y: 200 });
    });

    it('should not create element when tool is inactive', () => {
      arrowTool.deactivate();
      const event = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
      arrowTool.handlePointerDown(event);
      expect(arrowTool.element).toBeNull();
    });
  });

  // ------------------------------------------------------------------ //
  //  handlePointerMove — connection snapping (endSnap)                  //
  // ------------------------------------------------------------------ //

  describe('handlePointerMove with connection snapping', () => {
    let mockCp: any;
    let mockAb: any;
    let mockUi: any;

    beforeEach(() => {
      mockCp = {
        findSnapTarget: jest.fn(),
        getConnectionPoints: jest.fn().mockReturnValue([{ x: 200, y: 0 }]),
      };
      mockAb = {
        createBinding: jest.fn().mockReturnValue({ elementId: 'rect-2', pointId: 'left' }),
      };
      mockUi = {
        setSnapIndicator: jest.fn(),
        setVisibleConnectionPoints: jest.fn(),
        clearAll: jest.fn(),
      };
      arrowTool.setConnectionServices(mockCp, mockAb, mockUi);

      const targetEl = { id: 'rect-2', type: 'rectangle' };
      apiService.getElements = jest.fn().mockReturnValue([targetEl]);

      // Set up element via pointer down
      mockCp.findSnapTarget.mockReturnValueOnce(null); // no snap on start
      (createElement as jest.Mock).mockReturnValue({ id: 'a1', x1: 0, y1: 0, x2: 0, y2: 0 });
      arrowTool.handlePointerDown(createMockPointerInfo({ x: 0, y: 0, eventType: 'pointerdown' }));
      mockCp.findSnapTarget.mockReset();
    });

    it('should snap end point to a shape and show connection points', () => {
      mockCp.findSnapTarget.mockReturnValue({
        elementId: 'rect-2',
        pointId: 'left',
        point: { x: 200, y: 0 },
        distance: 8,
      });

      const event = createMockPointerInfo({ x: 195, y: 3, eventType: 'pointermove' });
      arrowTool.handlePointerMove(event);

      expect(mockUi.setSnapIndicator).toHaveBeenCalledWith({ x: 200, y: 0 });
      expect(mockCp.getConnectionPoints).toHaveBeenCalled();
      expect(mockUi.setVisibleConnectionPoints).toHaveBeenCalled();
    });

    it('should clear snap indicator when no snap target found', () => {
      mockCp.findSnapTarget.mockReturnValue(null);

      const event = createMockPointerInfo({ x: 195, y: 3, eventType: 'pointermove' });
      arrowTool.handlePointerMove(event);

      expect(mockUi.setSnapIndicator).toHaveBeenCalledWith(null);
      expect(mockUi.setVisibleConnectionPoints).toHaveBeenCalledWith([]);
    });

    it('should handle snap to element not found in allElements', () => {
      apiService.getElements = jest.fn().mockReturnValue([]); // no elements
      mockCp.findSnapTarget.mockReturnValue({
        elementId: 'nonexistent',
        pointId: 'top',
        point: { x: 200, y: 0 },
        distance: 5,
      });

      const event = createMockPointerInfo({ x: 195, y: 3, eventType: 'pointermove' });
      arrowTool.handlePointerMove(event);

      // snap indicator is set but getConnectionPoints is not called since targetEl is undefined
      expect(mockUi.setSnapIndicator).toHaveBeenCalledWith({ x: 200, y: 0 });
      expect(mockCp.getConnectionPoints).not.toHaveBeenCalled();
    });

    it('should still work when startSnap is set (self-connection path)', () => {
      // Set startSnap via a snapped pointer down
      mockCp.findSnapTarget.mockReset();
      // Reset arrow tool
      arrowTool.element = null;
      arrowTool.startPoint = null;
      (arrowTool as any).startSnap = null;

      mockCp.findSnapTarget.mockReturnValueOnce({
        elementId: 'rect-2',
        pointId: 'top',
        point: { x: 50, y: 0 },
        distance: 3,
      });
      (createElement as jest.Mock).mockReturnValue({ id: 'a2', x1: 50, y1: 0, x2: 50, y2: 0 });
      arrowTool.handlePointerDown(createMockPointerInfo({ x: 48, y: 2, eventType: 'pointerdown' }));

      // Now move with endSnap
      mockCp.findSnapTarget.mockReturnValue(null);
      const moveEvent = createMockPointerInfo({ x: 200, y: 100, eventType: 'pointermove' });
      arrowTool.handlePointerMove(moveEvent);

      expect(mockCp.findSnapTarget).toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------ //
  //  handlePointerMove — quadratic path auto-compute                    //
  // ------------------------------------------------------------------ //

  describe('handlePointerMove with quadratic path', () => {
    it('should auto-compute control point for quadratic arrows', () => {
      config.arrowConfig = { startHeadStyle: 'none', endHeadStyle: 'arrow', lineStyle: 'curve' };
      (createElement as jest.Mock).mockReturnValue({
        id: 'a1',
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        pathType: { type: 'quadratic', cx: 0, cy: 0 },
      });

      arrowTool.handlePointerDown(createMockPointerInfo({ x: 0, y: 0, eventType: 'pointerdown' }));

      const moveEvent = createMockPointerInfo({ x: 200, y: 100, eventType: 'pointermove' });
      arrowTool.handlePointerMove(moveEvent);

      expect(apiService.updateDraftElements).toHaveBeenCalledWith([
        expect.objectContaining({
          pathType: { type: 'quadratic', cx: 100, cy: 50 },
        }),
      ]);
    });
  });

  // ------------------------------------------------------------------ //
  //  handlePointerUp — end binding & selectAfterDraw                    //
  // ------------------------------------------------------------------ //

  describe('handlePointerUp with end binding', () => {
    it('should apply end binding when endSnap is set', () => {
      const mockAb = { createBinding: jest.fn().mockReturnValue({ elementId: 'rect-2', pointId: 'left' }) };
      const mockUi = { clearAll: jest.fn() };
      arrowTool.setConnectionServices(
        {} as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        mockUi as unknown as ConnectionUIService
      );

      arrowTool.element = { id: 'a1', x1: 0, y1: 0, x2: 200, y2: 0 } as unknown as ArrowElement;
      arrowTool.startPoint = { x: 0, y: 0 };
      (arrowTool as any).endSnap = {
        elementId: 'rect-2',
        pointId: 'left',
        point: { x: 200, y: 0 },
        distance: 5,
      };

      arrowTool.handlePointerUp();

      expect(mockAb.createBinding).toHaveBeenCalledWith('rect-2', 'left');
      expect(apiService.updateDraftElements).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'a1',
          endBinding: { elementId: 'rect-2', pointId: 'left' },
          x2: 200,
          y2: 0,
        }),
      ]);
      expect(apiService.commitDraftElements).toHaveBeenCalled();
      expect(mockUi.clearAll).toHaveBeenCalled();
    });
  });

  describe('handlePointerUp with selectAfterDraw', () => {
    it('should select the element if selectAfterDraw is true', () => {
      arrowTool.element = {
        id: 'a1',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        selectAfterDraw: true,
      } as unknown as ArrowElement;
      arrowTool.startPoint = { x: 0, y: 0 };

      arrowTool.handlePointerUp();

      expect(apiService.selectElements).toHaveBeenCalledWith(['a1']);
    });

    it('should not select the element if selectAfterDraw is falsy', () => {
      arrowTool.element = { id: 'a1', x1: 0, y1: 0, x2: 100, y2: 100 } as unknown as ArrowElement;
      arrowTool.startPoint = { x: 0, y: 0 };

      arrowTool.handlePointerUp();

      expect(apiService.selectElements).not.toHaveBeenCalled();
    });
  });

  describe('handlePointerUp without element', () => {
    it('should not commit when no element exists', () => {
      arrowTool.element = null;
      arrowTool.startPoint = null;

      arrowTool.handlePointerUp();

      expect(apiService.commitDraftElements).not.toHaveBeenCalled();
    });

    it('should not throw when inactive', () => {
      arrowTool.deactivate();
      expect(() => arrowTool.handlePointerUp()).not.toThrow();
      expect(apiService.commitDraftElements).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------ //
  //  Arrow config — line styles and head styles                         //
  // ------------------------------------------------------------------ //

  describe('arrow config — lineStyle', () => {
    beforeEach(() => {
      (createElement as jest.Mock).mockClear();
    });

    it('should create a curve arrow when lineStyle is curve', () => {
      config.arrowConfig = { startHeadStyle: 'none', endHeadStyle: 'arrow', lineStyle: 'curve' };
      (createElement as jest.Mock).mockReturnValue({ id: 'a1' });

      arrowTool.handlePointerDown(createMockPointerInfo({ x: 0, y: 0, eventType: 'pointerdown' }));

      const call = (createElement as jest.Mock).mock.calls[0][1];
      expect(call.pathType).toEqual({ type: 'quadratic', cx: 0, cy: 0 });
    });

    it('should create an elbow arrow when lineStyle is elbow', () => {
      config.arrowConfig = { startHeadStyle: 'none', endHeadStyle: 'arrow', lineStyle: 'elbow' };
      (createElement as jest.Mock).mockReturnValue({ id: 'a1' });

      arrowTool.handlePointerDown(createMockPointerInfo({ x: 0, y: 0, eventType: 'pointerdown' }));

      const call = (createElement as jest.Mock).mock.calls[0][1];
      expect(call.pathType).toEqual({ type: 'elbow', midRatio: 0.5 });
    });

    it('should create a straight arrow by default', () => {
      config.arrowConfig = { startHeadStyle: 'none', endHeadStyle: 'none', lineStyle: 'straight' as any };
      (createElement as jest.Mock).mockReturnValue({ id: 'a1' });

      arrowTool.handlePointerDown(createMockPointerInfo({ x: 0, y: 0, eventType: 'pointerdown' }));

      const call = (createElement as jest.Mock).mock.calls[0][1];
      expect(call.pathType).toEqual({ type: 'straight' });
    });
  });

  describe('mapHeadStyle — all arrowhead types', () => {
    const headStyleCases: Array<{ input: string; expected: ArrowheadType }> = [
      { input: 'none', expected: ArrowheadType.None },
      { input: 'arrow', expected: ArrowheadType.Arrow },
      { input: 'open-arrow', expected: ArrowheadType.OpenArrow },
      { input: 'diamond', expected: ArrowheadType.Diamond },
      { input: 'open-diamond', expected: ArrowheadType.OpenDiamond },
      { input: 'circle', expected: ArrowheadType.Circle },
      { input: 'open-circle', expected: ArrowheadType.OpenCircle },
      { input: 'bar', expected: ArrowheadType.Bar },
    ];

    headStyleCases.forEach(({ input, expected }) => {
      it(`should map '${input}' to ArrowheadType.${expected}`, () => {
        config.arrowConfig = { startHeadStyle: input as any, endHeadStyle: 'none', lineStyle: 'straight' as any };
        (createElement as jest.Mock).mockClear();
        (createElement as jest.Mock).mockReturnValue({ id: 'a1' });

        arrowTool.handlePointerDown(createMockPointerInfo({ x: 0, y: 0, eventType: 'pointerdown' }));

        const call = (createElement as jest.Mock).mock.calls[0][1];
        expect(call.startHead.type).toBe(expected);
      });
    });

    it('should return None when arrowConfig is undefined', () => {
      (config as any).arrowConfig = undefined;
      (createElement as jest.Mock).mockClear();
      (createElement as jest.Mock).mockReturnValue({ id: 'a1' });

      arrowTool.handlePointerDown(createMockPointerInfo({ x: 0, y: 0, eventType: 'pointerdown' }));

      const call = (createElement as jest.Mock).mock.calls[0][1];
      expect(call.startHead.type).toBe(ArrowheadType.None);
      expect(call.endHead.type).toBe(ArrowheadType.None);
    });

    it('should return None for an unknown head style string', () => {
      config.arrowConfig = {
        startHeadStyle: 'unknown-style' as any,
        endHeadStyle: 'none',
        lineStyle: 'straight' as any,
      };
      (createElement as jest.Mock).mockClear();
      (createElement as jest.Mock).mockReturnValue({ id: 'a1' });

      arrowTool.handlePointerDown(createMockPointerInfo({ x: 0, y: 0, eventType: 'pointerdown' }));

      const call = (createElement as jest.Mock).mock.calls[0][1];
      expect(call.startHead.type).toBe(ArrowheadType.None);
    });
  });

  // ------------------------------------------------------------------ //
  //  getElementStyle                                                    //
  // ------------------------------------------------------------------ //

  describe('getElementStyle', () => {
    it('should return the correct style from config', () => {
      config.strokeColor = '#ff0000';
      config.strokeWidth = 5;
      config.lineCap = LineCap.Butt;
      config.dasharray = '5 3';
      config.dashoffset = 2;

      (createElement as jest.Mock).mockClear();
      (createElement as jest.Mock).mockReturnValue({ id: 'a1' });

      arrowTool.handlePointerDown(createMockPointerInfo({ x: 0, y: 0, eventType: 'pointerdown' }));

      const call = (createElement as jest.Mock).mock.calls[0][1];
      expect(call.style).toEqual({
        strokeColor: '#ff0000',
        strokeWidth: 5,
        lineCap: LineCap.Butt,
        dasharray: '5 3',
        dashoffset: 2,
      });
    });
  });

  // ------------------------------------------------------------------ //
  //  handlePointerUp — connectionUIService.clearAll                     //
  // ------------------------------------------------------------------ //

  describe('handlePointerUp clears connection UI', () => {
    it('should call clearAll on connectionUIService during pointer up', () => {
      const mockUi = { clearAll: jest.fn() };
      arrowTool.setConnectionServices(
        {} as ConnectionPointsService,
        {} as ArrowBindingService,
        mockUi as unknown as ConnectionUIService
      );

      arrowTool.element = { id: 'a1', x1: 0, y1: 0, x2: 100, y2: 100 } as unknown as ArrowElement;
      arrowTool.startPoint = { x: 0, y: 0 };

      arrowTool.handlePointerUp();

      expect(mockUi.clearAll).toHaveBeenCalled();
    });
  });
});
