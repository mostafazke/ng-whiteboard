import { ZoomAreaTool } from '../zoom-area-tool';
import { ApiService } from '../../api/api.service';
import { ToolType, WhiteboardConfig } from '../../types';
import { createMockPointerInfo } from '../../testing';

describe('ZoomAreaTool', () => {
  let tool: ZoomAreaTool;
  let apiService: {
    setSelectionBox: jest.Mock;
    clearSelectionBox: jest.Mock;
    zoomToRegion: jest.Mock;
    getConfig: jest.Mock;
  };

  beforeEach(() => {
    apiService = {
      setSelectionBox: jest.fn(),
      clearSelectionBox: jest.fn(),
      zoomToRegion: jest.fn(),
      // Identity transform (zoom 1, no pan/offset) → canvas coords == pointer coords.
      getConfig: jest.fn().mockReturnValue({
        zoom: 1,
        x: 0,
        y: 0,
        canvasX: 0,
        canvasY: 0,
        fullScreen: true,
      } as WhiteboardConfig),
    };
    tool = new ZoomAreaTool(apiService as unknown as ApiService);
    tool.activate();
  });

  it('is the ZoomArea tool', () => {
    expect(tool.type).toBe(ToolType.ZoomArea);
  });

  it('shows the marquee via the selection box on down and move', () => {
    tool.handlePointerDown(createMockPointerInfo({ x: 10, y: 10 }));
    tool.handlePointerMove(createMockPointerInfo({ x: 110, y: 90 }));

    expect(apiService.setSelectionBox).toHaveBeenCalledTimes(2);
    expect(apiService.setSelectionBox).toHaveBeenLastCalledWith({
      x: 10,
      y: 10,
      width: 100,
      height: 80,
      visible: true,
    });
  });

  it('zooms to the dragged region (and clears the marquee) on release', () => {
    tool.handlePointerDown(createMockPointerInfo({ x: 200, y: 150 }));
    tool.handlePointerMove(createMockPointerInfo({ x: 0, y: 0 }));
    tool.handlePointerUp();

    expect(apiService.clearSelectionBox).toHaveBeenCalled();
    // Normalized box regardless of drag direction.
    expect(apiService.zoomToRegion).toHaveBeenCalledWith(0, 0, 200, 150);
  });

  it('ignores a click (drag below the minimum) — clears the marquee but does not zoom', () => {
    tool.handlePointerDown(createMockPointerInfo({ x: 50, y: 50 }));
    tool.handlePointerMove(createMockPointerInfo({ x: 52, y: 51 }));
    tool.handlePointerUp();

    expect(apiService.clearSelectionBox).toHaveBeenCalled();
    expect(apiService.zoomToRegion).not.toHaveBeenCalled();
  });

  it('ignores a move that arrives before a down', () => {
    tool.handlePointerMove(createMockPointerInfo({ x: 10, y: 10 }));
    expect(apiService.setSelectionBox).not.toHaveBeenCalled();
  });

  it('does not zoom on a release without a preceding down', () => {
    tool.handlePointerUp();
    expect(apiService.zoomToRegion).not.toHaveBeenCalled();
  });
});
