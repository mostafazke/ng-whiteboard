import { ShapeTool } from '../shape-tool';
import { ElementType, LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { createElement } from '../../elements/element.utils';
import { ApiService } from '../../api/api.service';
import { createMockPointerInfo } from '../../testing';

jest.mock('../../elements/element.utils');
jest.mock('../../utils/geometry', () => ({
  snapToGrid: jest.fn((value, gridSize) => Math.round(value / gridSize) * gridSize),
  getCanvasCoordinates: jest.fn((config, point) => point),
}));

const STAR = { id: 'star', name: 'Star', path: 'M0 0 L1 1 Z', aspectRatio: 2 };

describe('ShapeTool', () => {
  let tool: ShapeTool;
  let apiService: ApiService;
  let config: WhiteboardConfig;
  let getActiveShape: jest.Mock;

  const down = (x = 100, y = 200) => tool.handlePointerDown(createMockPointerInfo({ x, y, eventType: 'pointerdown' }));
  const move = (x: number, y: number, extra: object = {}) =>
    tool.handlePointerMove(createMockPointerInfo({ x, y, eventType: 'pointermove', ...extra }));

  beforeEach(() => {
    jest.clearAllMocks();
    config = {
      strokeColor: '#000000',
      strokeWidth: 2,
      lineCap: LineCap.Round,
      lineJoin: LineJoin.Round,
      dasharray: '',
      dashoffset: 0,
      fill: 'transparent',
      snapToGrid: false,
      gridSize: 10,
    } as WhiteboardConfig;

    getActiveShape = jest.fn().mockReturnValue(STAR);
    apiService = {
      addDraftElements: jest.fn(),
      updateDraftElements: jest.fn(),
      commitDraftElements: jest.fn(),
      removeDraftElements: jest.fn(),
      getConfig: jest.fn().mockImplementation(() => config),
      getNextZIndex: jest.fn().mockReturnValue(1),
      getActiveLayerId: jest.fn().mockReturnValue('layer-1'),
      getActiveShape,
      finalizeDraw: jest.fn(),
    } as unknown as ApiService;
    (createElement as jest.Mock).mockReturnValue({ id: 'e1', type: ElementType.Shape });

    tool = new ShapeTool(apiService);
    tool.activate();
  });

  it('has the shape type', () => {
    expect(tool.type).toBe(ToolType.Shape);
  });

  it('creates a shape element on pointer down', () => {
    down();

    expect(createElement).toHaveBeenCalledWith(
      ElementType.Shape,
      {
        x: 100,
        y: 200,
        shapeId: 'star',
        path: 'M0 0 L1 1 Z',
        style: expect.objectContaining({ strokeColor: '#000000', strokeWidth: 2, fill: 'transparent' }),
        zIndex: 1,
      },
      'layer-1'
    );
    expect(apiService.addDraftElements).toHaveBeenCalledWith([{ id: 'e1', type: ElementType.Shape }]);
  });

  it('does nothing on pointer down when no shape is active', () => {
    getActiveShape.mockReturnValue(undefined);

    down();

    expect(createElement).not.toHaveBeenCalled();
    expect(apiService.addDraftElements).not.toHaveBeenCalled();
  });

  it('ignores pointer moves and ups when no shape is active', () => {
    getActiveShape.mockReturnValue(undefined);

    down();
    move(300, 260);
    tool.handlePointerUp();

    expect(apiService.updateDraftElements).not.toHaveBeenCalled();
    expect(apiService.finalizeDraw).not.toHaveBeenCalled();
  });

  it('updates the draft with the dragged rectangle', () => {
    down();
    move(300, 260);

    expect(apiService.updateDraftElements).toHaveBeenCalledWith([{ id: 'e1', x: 100, y: 200, width: 200, height: 60 }]);
  });

  it('keeps the shape aspect ratio with shift', () => {
    down();
    move(300, 260, { shiftKey: true });

    expect(apiService.updateDraftElements).toHaveBeenCalledWith([
      { id: 'e1', x: 100, y: 200, width: 200, height: 100 },
    ]);
  });

  it('uses the larger extent when shift is held and the drag is tall', () => {
    down();
    move(130, 400, { shiftKey: true });

    expect(apiService.updateDraftElements).toHaveBeenCalledWith([
      { id: 'e1', x: 100, y: 200, width: 400, height: 200 },
    ]);
  });

  it('draws from the center with alt', () => {
    down();
    move(300, 260, { altKey: true });

    expect(apiService.updateDraftElements).toHaveBeenCalledWith([
      { id: 'e1', x: -100, y: 140, width: 400, height: 120 },
    ]);
  });

  it('flips the origin when dragging up and left', () => {
    down();
    move(0, 150);

    expect(apiService.updateDraftElements).toHaveBeenCalledWith([{ id: 'e1', x: 0, y: 150, width: 100, height: 50 }]);
  });

  it('snaps to the grid like the rectangle tool', () => {
    config.snapToGrid = true;
    down(103, 198);
    move(297, 263);

    expect(createElement).toHaveBeenCalledWith(
      ElementType.Shape,
      expect.objectContaining({ x: 100, y: 200 }),
      'layer-1'
    );
    expect(apiService.updateDraftElements).toHaveBeenCalledWith([{ id: 'e1', x: 100, y: 200, width: 200, height: 60 }]);
  });

  it('commits and finalizes on pointer up', () => {
    down();
    move(300, 260);
    tool.handlePointerUp();

    expect(apiService.commitDraftElements).toHaveBeenCalled();
    expect(apiService.finalizeDraw).toHaveBeenCalledWith({ id: 'e1', type: ElementType.Shape });
  });

  it('removes the draft on cancel', () => {
    down();
    tool.cancel();

    expect(apiService.removeDraftElements).toHaveBeenCalledWith(['e1']);
  });
});
