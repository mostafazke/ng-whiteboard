import { Point, PointerInfo, SelectionBox, ToolType } from '../types';
import { BaseTool } from './base-tool';
import { CursorType } from '../types/cursors';

/**
 * Marquee zoom tool: drag a rectangle on the canvas, then zoom the viewport to that area on
 * release. Reuses the existing selection-box rendering for the marquee overlay and never
 * creates or modifies elements. A plain click (no meaningful drag) is ignored.
 */
export class ZoomAreaTool extends BaseTool {
  type = ToolType.ZoomArea;
  override baseCursor = CursorType.Crosshair;

  /** Smallest drag (in canvas units) treated as a marquee; below this it's a click → ignored. */
  private static readonly MIN_DRAG = 5;

  private start: Point | null = null;
  private current: Point | null = null;

  override handlePointerDown(event: PointerInfo): void {
    this.start = this.getPointerPosition(event);
    this.current = this.start;
    this.apiService.setSelectionBox(this.boxFrom(this.start, this.current));
  }

  override handlePointerMove(event: PointerInfo): void {
    if (!this.start) return;
    this.current = this.getPointerPosition(event);
    this.apiService.setSelectionBox(this.boxFrom(this.start, this.current));
  }

  override handlePointerUp(): void {
    const start = this.start;
    const current = this.current;
    this.start = null;
    this.current = null;
    this.apiService.clearSelectionBox();
    if (!start || !current) return;

    const box = this.boxFrom(start, current);
    if (box.width < ZoomAreaTool.MIN_DRAG || box.height < ZoomAreaTool.MIN_DRAG) return; // a click, not a marquee

    // zoomToRegion zooms to the marquee AND pans so it is centred (zoomToArea alone only sets
    // the zoom level — in fullScreen it wouldn't actually bring the region into view).
    this.apiService.zoomToRegion(box.x, box.y, box.width, box.height);
  }

  private boxFrom(a: Point, b: Point): SelectionBox {
    return {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      width: Math.abs(b.x - a.x),
      height: Math.abs(b.y - a.y),
      visible: true,
    };
  }
}
